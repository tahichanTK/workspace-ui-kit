/**
 * Neonデータベースのテーブル作成＋初期データ投入スクリプト
 * 実行: npm run setup-db
 *
 * - すでにテーブルが存在する場合は DROP してから再作成する
 * - data/*.json の内容をそのままDBに入れる
 */

import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve } from "path";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL が設定されていません。.env.local を確認してください。");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

function readJson<T>(filename: string): T {
  const path = resolve(process.cwd(), "data", filename);
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

// ---- 型定義（JSONの形） ----

type ThemeJson = {
  id: string;
  name: string;
  type: string;
  status: string;
  currentPhase: string;
};

type KpiJson = {
  name: string;
  value: number;
  target: number;
  unit: string;
  rag: string;
};

type KpiMapEntryJson = {
  themeId: string;
  phase: string;
  category: string;
  kpis: KpiJson[];
};

type WeeklySummaryItemJson = {
  text: string;
  phases: string[];
  categories: string[];
  kpis: string[];
};

type WeeklySummaryJson = {
  themeId: string;
  weekLabel: string;
  items: WeeklySummaryItemJson[];
};

type AiSuggestionJson = {
  priority: number;
  priorityLabel: string;
  opportunity: string;
  action: string;
  categories: string[];
};

type AiSuggestionsEntryJson = {
  themeId: string;
  updatedAt: string;
  suggestions: AiSuggestionJson[];
};

// ---- メイン処理 ----

async function main() {
  console.log("🔌 Neonに接続中...");

  // 1. テーブルを DROP → CREATE
  console.log("📦 テーブルを作成中...");
  await sql`DROP TABLE IF EXISTS ai_suggestions CASCADE`;
  await sql`DROP TABLE IF EXISTS weekly_summary_items CASCADE`;
  await sql`DROP TABLE IF EXISTS weekly_summaries CASCADE`;
  await sql`DROP TABLE IF EXISTS kpi_snapshots CASCADE`;
  await sql`DROP TABLE IF EXISTS themes CASCADE`;

  await sql`
    CREATE TABLE themes (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      type         TEXT NOT NULL,
      status       TEXT NOT NULL,
      current_phase TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE kpi_snapshots (
      id        SERIAL PRIMARY KEY,
      theme_id  TEXT NOT NULL REFERENCES themes(id),
      phase     TEXT NOT NULL,
      category  TEXT NOT NULL,
      name      TEXT NOT NULL,
      value     NUMERIC NOT NULL,
      target    NUMERIC NOT NULL,
      unit      TEXT NOT NULL,
      rag       TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE weekly_summaries (
      id         SERIAL PRIMARY KEY,
      theme_id   TEXT NOT NULL REFERENCES themes(id),
      week_label TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE weekly_summary_items (
      id          SERIAL PRIMARY KEY,
      summary_id  INTEGER NOT NULL REFERENCES weekly_summaries(id),
      text        TEXT NOT NULL,
      phases      TEXT[] NOT NULL,
      categories  TEXT[] NOT NULL,
      kpis        TEXT[] NOT NULL
    )
  `;

  await sql`
    CREATE TABLE ai_suggestions (
      id             SERIAL PRIMARY KEY,
      theme_id       TEXT NOT NULL REFERENCES themes(id),
      updated_at     TEXT NOT NULL,
      priority       INTEGER NOT NULL,
      priority_label TEXT NOT NULL,
      opportunity    TEXT NOT NULL,
      action         TEXT NOT NULL,
      categories     TEXT[] NOT NULL
    )
  `;
  console.log("  ✅ テーブル作成完了（5テーブル）");

  // 2. themes を投入
  const themes = readJson<ThemeJson[]>("themes.json");
  for (const t of themes) {
    await sql`
      INSERT INTO themes (id, name, type, status, current_phase)
      VALUES (${t.id}, ${t.name}, ${t.type}, ${t.status}, ${t.currentPhase})
    `;
  }
  console.log(`  ✅ themes: ${themes.length}件`);

  // 3. kpi_snapshots を投入
  const kpiMap = readJson<KpiMapEntryJson[]>("kpi-map.json");
  let kpiCount = 0;
  for (const entry of kpiMap) {
    for (const kpi of entry.kpis) {
      await sql`
        INSERT INTO kpi_snapshots (theme_id, phase, category, name, value, target, unit, rag)
        VALUES (${entry.themeId}, ${entry.phase}, ${entry.category}, ${kpi.name}, ${kpi.value}, ${kpi.target}, ${kpi.unit}, ${kpi.rag})
      `;
      kpiCount++;
    }
  }
  console.log(`  ✅ kpi_snapshots: ${kpiCount}件`);

  // 4. weekly_summaries + items を投入
  const weeklySummaries = readJson<WeeklySummaryJson[]>("weekly-summary.json");
  let itemCount = 0;
  for (const ws of weeklySummaries) {
    const [row] = await sql`
      INSERT INTO weekly_summaries (theme_id, week_label)
      VALUES (${ws.themeId}, ${ws.weekLabel})
      RETURNING id
    `;
    const summaryId = (row as { id: number }).id;
    for (const item of ws.items) {
      await sql`
        INSERT INTO weekly_summary_items (summary_id, text, phases, categories, kpis)
        VALUES (${summaryId}, ${item.text}, ${item.phases}, ${item.categories}, ${item.kpis})
      `;
      itemCount++;
    }
  }
  console.log(`  ✅ weekly_summaries: ${weeklySummaries.length}件 / items: ${itemCount}件`);

  // 5. ai_suggestions を投入
  const aiSuggestions = readJson<AiSuggestionsEntryJson[]>("ai-suggestions.json");
  let suggestionCount = 0;
  for (const entry of aiSuggestions) {
    for (const s of entry.suggestions) {
      await sql`
        INSERT INTO ai_suggestions (theme_id, updated_at, priority, priority_label, opportunity, action, categories)
        VALUES (${entry.themeId}, ${entry.updatedAt}, ${s.priority}, ${s.priorityLabel}, ${s.opportunity}, ${s.action}, ${s.categories})
      `;
      suggestionCount++;
    }
  }
  console.log(`  ✅ ai_suggestions: ${suggestionCount}件`);

  console.log("\n🎉 セットアップ完了！Neonにデータが保存されました。");
}

main().catch((err) => {
  console.error("❌ エラーが発生しました:", err);
  process.exit(1);
});
