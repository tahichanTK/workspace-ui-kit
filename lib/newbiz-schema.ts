/**
 * 新規事業進捗ダッシュボードのドメインスキーマ。
 * 既存の採用管理 lib/schema.ts とは完全に分離する。
 */

import { z } from "zod";

// ===== Enums =====

export const PHASE_ORDER = ["idea", "validation", "mvp", "scale"] as const;
export const phaseSchema = z.enum(["idea", "validation", "mvp", "scale"]);
export type Phase = z.infer<typeof phaseSchema>;

export const PHASE_LABELS: Record<Phase, string> = {
  idea: "アイデア",
  validation: "仮説検証",
  mvp: "MVP",
  scale: "スケール",
};

export const THEME_TYPE_VALUES = ["product", "service"] as const;
export const themeTypeSchema = z.enum(["product", "service"]);
export type ThemeType = z.infer<typeof themeTypeSchema>;

export const THEME_STATUS_VALUES = ["on-track", "at-risk", "critical"] as const;
export const themeStatusSchema = z.enum(["on-track", "at-risk", "critical"]);
export type ThemeStatus = z.infer<typeof themeStatusSchema>;

export const ALL_CATEGORIES = [
  "marketing",
  "making",
  "production",
  "advantage",
  "service_design",
  "delivery",
] as const;
export const categorySchema = z.enum(ALL_CATEGORIES);
export type Category = z.infer<typeof categorySchema>;

export const CATEGORY_LABELS: Record<Category, string> = {
  marketing: "マーケティング",
  making: "ものづくり",
  production: "生産",
  advantage: "競争優位性",
  service_design: "サービス設計",
  delivery: "デリバリー",
};

/**
 * テーマ種別ごとのカテゴリ表示順。
 * 「競争優位性」は idea / scale フェーズでのみ有効だが、
 * 現行のサンプルテーマ（仮説検証・MVP）では空欄になるため P2 グリッドから除外。
 */
export const CATEGORIES_BY_TYPE: Record<ThemeType, Category[]> = {
  product: ["marketing", "making", "production"],
  service: ["marketing", "service_design", "delivery"],
};

/** フェーズ × テーマ種別で有効なカテゴリ（空白セル削減） */
export const VALID_CATEGORIES_BY_PHASE: Record<Phase, Record<ThemeType, Category[]>> = {
  idea: {
    product: ["marketing", "advantage"],
    service: ["marketing", "advantage"],
  },
  validation: {
    product: ["marketing", "making"],
    service: ["marketing", "service_design"],
  },
  mvp: {
    product: ["marketing", "making", "production"],
    service: ["marketing", "service_design", "delivery"],
  },
  scale: {
    product: ["marketing", "making", "production", "advantage"],
    service: ["marketing", "service_design", "delivery", "advantage"],
  },
};

export const RAG_VALUES = ["R", "A", "G"] as const;
export const ragSchema = z.enum(["R", "A", "G"]);
export type Rag = z.infer<typeof ragSchema>;

/** RAG 値を表示用のアイコン・色クラス・ラベルに変換するユーティリティ */
export function ragToDisplay(rag: Rag): {
  icon: string;
  colorClass: string;
  bgClass: string;
  label: string;
} {
  switch (rag) {
    case "R":
      return {
        icon: "✕",
        colorClass: "text-red-600",
        bgClass: "bg-red-50",
        label: "要対応",
      };
    case "A":
      return {
        icon: "△",
        colorClass: "text-amber-700",
        bgClass: "bg-amber-50",
        label: "注意",
      };
    case "G":
      return {
        icon: "✓",
        colorClass: "text-green-700",
        bgClass: "bg-green-50",
        label: "順調",
      };
  }
}

// ===== Theme =====

export const themeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: themeTypeSchema,
  status: themeStatusSchema,
  currentPhase: phaseSchema,
});
export type Theme = z.infer<typeof themeSchema>;
export const themesSchema = z.array(themeSchema);

// ===== KPI Map =====

export const kpiSchema = z.object({
  name: z.string(),
  value: z.number(),
  target: z.number(),
  unit: z.string(),
  rag: ragSchema,
});
export type Kpi = z.infer<typeof kpiSchema>;

export const kpiMapEntrySchema = z.object({
  themeId: z.string(),
  phase: phaseSchema,
  category: categorySchema,
  kpis: z.array(kpiSchema),
});
export type KpiMapEntry = z.infer<typeof kpiMapEntrySchema>;
export const kpiMapSchema = z.array(kpiMapEntrySchema);

// ===== Weekly Summary =====

export const weeklySummaryItemSchema = z.object({
  text: z.string(),
  phases: z.array(phaseSchema),
  categories: z.array(categorySchema),
  kpis: z.array(z.string()),
});
export type WeeklySummaryItem = z.infer<typeof weeklySummaryItemSchema>;

export const weeklySummarySchema = z.object({
  themeId: z.string(),
  weekLabel: z.string(),
  items: z.array(weeklySummaryItemSchema),
});
export type WeeklySummary = z.infer<typeof weeklySummarySchema>;
export const weeklySummariesSchema = z.array(weeklySummarySchema);

// ===== AI Suggestions =====

export const aiSuggestionSchema = z.object({
  priority: z.number().int().min(1).max(3),
  priorityLabel: z.string(),
  opportunity: z.string(),
  action: z.string(),
  categories: z.array(categorySchema).default([]),
});
export type AiSuggestion = z.infer<typeof aiSuggestionSchema>;

export const aiSuggestionsEntrySchema = z.object({
  themeId: z.string(),
  updatedAt: z.string(),
  suggestions: z.array(aiSuggestionSchema),
});
export type AiSuggestionsEntry = z.infer<typeof aiSuggestionsEntrySchema>;
export const aiSuggestionsSchema = z.array(aiSuggestionsEntrySchema);
