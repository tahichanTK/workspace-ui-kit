import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  PHASE_LABELS,
  CATEGORY_LABELS,
  type Theme,
  type KpiMapEntry,
  type WeeklySummary,
} from "@/lib/newbiz-schema";

type RequestBody = {
  theme: Theme;
  kpis: KpiMapEntry[];
  summary: WeeklySummary | undefined;
};

function buildPrompt(theme: Theme, kpis: KpiMapEntry[], summary: WeeklySummary | undefined): string {
  const phaseLabel = PHASE_LABELS[theme.currentPhase] ?? theme.currentPhase;

  const kpiLines = kpis
    .filter((e) => e.phase === theme.currentPhase)
    .flatMap((e) => {
      const catLabel = CATEGORY_LABELS[e.category] ?? e.category;
      return e.kpis.map(
        (k) => `  [${catLabel}] ${k.name}: ${k.value}${k.unit} / 目標${k.target}${k.unit} (${k.rag === "G" ? "順調" : k.rag === "A" ? "注意" : "要対応"})`,
      );
    })
    .join("\n");

  const summaryLines = summary?.items
    .map((item) => {
      const cats = item.categories.map((c) => CATEGORY_LABELS[c] ?? c).join("・");
      return `  [${cats}] ${item.text}`;
    })
    .join("\n") ?? "（サマリーなし）";

  return `あなたは新規事業アドバイザーです。以下のテーマ情報・KPI・週次サマリーをもとに、次の一手を3つ提案してください。

## テーマ情報
- テーマ名: ${theme.name}
- 種別: ${theme.type === "product" ? "ものづくり系" : "サービス系"}
- 現在フェーズ: ${phaseLabel}

## 現在フェーズのKPI
${kpiLines || "（KPIデータなし）"}

## 今週のサマリー（${summary?.weekLabel ?? "不明"}）
${summaryLines}

## 出力形式（必ずJSONで返すこと）
以下のJSON配列を返してください。他の文字は一切含めないこと。

[
  {
    "priority": 1,
    "priorityLabel": "高",
    "opportunity": "機会・課題の説明（1〜2文）",
    "action": "具体的なアクション（1〜2文）",
    "categories": ["marketing"] // 関連カテゴリ（marketing/making/production/service_design/delivery/advantage から選択）
  },
  {
    "priority": 2,
    "priorityLabel": "中",
    "opportunity": "...",
    "action": "...",
    "categories": ["making"]
  },
  {
    "priority": 3,
    "priorityLabel": "低",
    "opportunity": "...",
    "action": "...",
    "categories": ["marketing", "making"]
  }
]`;
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY が設定されていません。Vercel環境変数を確認してください。" },
      { status: 500 },
    );
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が正しくありません" }, { status: 400 });
  }

  const { theme, kpis, summary } = body;
  if (!theme || !kpis) {
    return NextResponse.json({ error: "theme と kpis は必須です" }, { status: 400 });
  }

  try {
    const prompt = buildPrompt(theme, kpis, summary);

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content ?? "";

    // JSON部分だけを抽出（```json ... ``` ブロックにも対応）
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "AIの回答からJSONを解析できませんでした" },
        { status: 502 },
      );
    }

    const suggestions = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ suggestions });
  } catch (e) {
    const message = e instanceof Error ? e.message : "不明なエラー";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
