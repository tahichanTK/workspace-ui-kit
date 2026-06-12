/**
 * NeonデータベースからデータをQueryする関数群。
 * Zodスキーマと同じ型で返すので、既存のコンポーネントはそのまま使える。
 */

import { sql } from "@/lib/db";
import type {
  Theme,
  KpiMapEntry,
  WeeklySummary,
  AiSuggestionsEntry,
} from "@/lib/newbiz-schema";

// ---- テーブルの行型（DBから返ってくる形） ----

type ThemeRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  current_phase: string;
};

type KpiSnapshotRow = {
  theme_id: string;
  phase: string;
  category: string;
  name: string;
  value: string; // Neonは NUMERIC を string で返す
  target: string;
  unit: string;
  rag: string;
};

type WeeklySummaryRow = {
  id: number;
  theme_id: string;
  week_label: string;
};

type WeeklySummaryItemRow = {
  summary_id: number;
  text: string;
  phases: string[];
  categories: string[];
  kpis: string[];
};

type AiSuggestionRow = {
  theme_id: string;
  updated_at: string;
  priority: number;
  priority_label: string;
  opportunity: string;
  action: string;
  categories: string[];
};

// ---- クエリ関数 ----

export async function getThemes(): Promise<Theme[]> {
  const rows = (await sql`SELECT * FROM themes ORDER BY id`) as ThemeRow[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type as Theme["type"],
    status: r.status as Theme["status"],
    currentPhase: r.current_phase as Theme["currentPhase"],
  }));
}

export async function getKpiMap(): Promise<KpiMapEntry[]> {
  const rows =
    (await sql`SELECT * FROM kpi_snapshots ORDER BY theme_id, phase, category`) as KpiSnapshotRow[];

  // theme_id + phase + category でグループ化
  const map = new Map<string, KpiMapEntry>();
  for (const row of rows) {
    const key = `${row.theme_id}__${row.phase}__${row.category}`;
    if (!map.has(key)) {
      map.set(key, {
        themeId: row.theme_id,
        phase: row.phase as KpiMapEntry["phase"],
        category: row.category as KpiMapEntry["category"],
        kpis: [],
      });
    }
    map.get(key)!.kpis.push({
      name: row.name,
      value: Number(row.value),
      target: Number(row.target),
      unit: row.unit,
      rag: row.rag as "R" | "A" | "G",
    });
  }
  return Array.from(map.values());
}

export async function getWeeklySummaries(): Promise<WeeklySummary[]> {
  const summaryRows =
    (await sql`SELECT * FROM weekly_summaries ORDER BY id`) as WeeklySummaryRow[];
  const itemRows =
    (await sql`SELECT * FROM weekly_summary_items ORDER BY summary_id, id`) as WeeklySummaryItemRow[];

  // summary_id でアイテムをグループ化
  const itemMap = new Map<number, WeeklySummaryItemRow[]>();
  for (const item of itemRows) {
    if (!itemMap.has(item.summary_id)) itemMap.set(item.summary_id, []);
    itemMap.get(item.summary_id)!.push(item);
  }

  return summaryRows.map((s) => ({
    themeId: s.theme_id,
    weekLabel: s.week_label,
    items: (itemMap.get(s.id) ?? []).map((item) => ({
      text: item.text,
      phases: item.phases as WeeklySummary["items"][number]["phases"],
      categories:
        item.categories as WeeklySummary["items"][number]["categories"],
      kpis: item.kpis,
    })),
  }));
}

export async function getAiSuggestions(): Promise<AiSuggestionsEntry[]> {
  const rows =
    (await sql`SELECT * FROM ai_suggestions ORDER BY theme_id, priority`) as AiSuggestionRow[];

  // theme_id でグループ化
  const map = new Map<string, AiSuggestionsEntry>();
  for (const row of rows) {
    if (!map.has(row.theme_id)) {
      map.set(row.theme_id, {
        themeId: row.theme_id,
        updatedAt: row.updated_at,
        suggestions: [],
      });
    }
    map.get(row.theme_id)!.suggestions.push({
      priority: row.priority,
      priorityLabel: row.priority_label,
      opportunity: row.opportunity,
      action: row.action,
      categories:
        row.categories as AiSuggestionsEntry["suggestions"][number]["categories"],
    });
  }
  return Array.from(map.values());
}
