"use client";

import { useState } from "react";
import type {
  KpiMapEntry,
  WeeklySummary,
  Theme,
} from "@/lib/newbiz-schema";
import { CATEGORY_LABELS } from "@/lib/newbiz-schema";

type GeneratedSuggestion = {
  priority: number;
  priorityLabel: string;
  opportunity: string;
  action: string;
  categories: string[];
};

const PRIORITY_CONFIG = {
  1: {
    bgClass: "bg-orange-100",
    textClass: "text-orange-700",
    borderClass: "border-orange-200",
    ringClass: "bg-orange-100 text-orange-700",
  },
  2: {
    bgClass: "bg-sky-100",
    textClass: "text-sky-700",
    borderClass: "border-sky-200",
    ringClass: "bg-sky-100 text-sky-700",
  },
  3: {
    bgClass: "bg-slate-100",
    textClass: "text-slate-600",
    borderClass: "border-slate-200",
    ringClass: "bg-slate-100 text-slate-600",
  },
} as const;

type AiSuggestionsPaneProps = {
  kpiMap: KpiMapEntry[];
  weeklySummaries: WeeklySummary[];
  themes: Theme[];
  selectedThemeId: string;
  selectedCategory?: string | null;
  onCategoryReset?: () => void;
};

export function AiSuggestionsPane({
  kpiMap,
  weeklySummaries,
  themes,
  selectedThemeId,
  selectedCategory = null,
  onCategoryReset,
}: AiSuggestionsPaneProps) {
  const [suggestions, setSuggestions] = useState<GeneratedSuggestion[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const filteredSuggestions = suggestions
    ? selectedCategory
      ? suggestions.filter((s) => s.categories.includes(selectedCategory))
      : suggestions
    : null;

  const categoryKey = (cat: string) => cat.replace("_", "-");

  async function handleConsult() {
    setIsLoading(true);
    setError(null);
    setSuggestions(null);

    try {
      const theme = themes.find((t) => t.id === selectedThemeId);
      const kpis = kpiMap.filter((e) => e.themeId === selectedThemeId);
      const summary = weeklySummaries.find((s) => s.themeId === selectedThemeId);

      const res = await fetch("/api/ai-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, kpis, summary }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `サーバーエラー (${res.status})`);
      }

      const data = await res.json();
      setSuggestions(data.suggestions);
      setGeneratedAt(new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border bg-background px-3 py-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              AIに相談する
            </p>
            {generatedAt && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                生成: {generatedAt}
              </p>
            )}
          </div>
          {selectedCategory && suggestions && (
            <button
              onClick={onCategoryReset}
              className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-200 transition-colors"
            >
              {CATEGORY_LABELS[selectedCategory as keyof typeof CATEGORY_LABELS]}
              <span aria-hidden="true">✕</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 p-3">
        {/* 未生成状態 */}
        {!suggestions && !isLoading && !error && (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-8">
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                現在のKPIと週次サマリーをもとに
              </p>
              <p className="text-sm text-muted-foreground">
                AIが次の一手を提案します
              </p>
            </div>
            <button
              onClick={handleConsult}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              <span>✦</span>
              AIに相談する
            </button>
          </div>
        )}

        {/* ローディング */}
        {isLoading && (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="text-sm text-muted-foreground">KPIを分析中...</p>
          </div>
        )}

        {/* エラー */}
        {error && !isLoading && (
          <div className="space-y-3">
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
            <button
              onClick={handleConsult}
              className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              もう一度試す
            </button>
          </div>
        )}

        {/* 生成済み提案 */}
        {filteredSuggestions && !isLoading && (
          <div className="space-y-2.5">
            {filteredSuggestions.length === 0 ? (
              <p className="p-2 text-sm text-muted-foreground">
                このカテゴリの提案はありません
              </p>
            ) : (
              [...filteredSuggestions]
                .sort((a, b) => a.priority - b.priority)
                .map((s, i) => {
                  const pc = PRIORITY_CONFIG[s.priority as 1 | 2 | 3] ?? PRIORITY_CONFIG[3];
                  return (
                    <div
                      key={i}
                      className={[
                        "rounded-lg border p-3 shadow-sm bg-white",
                        pc.borderClass,
                      ].join(" ")}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className={[
                            "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold",
                            pc.ringClass,
                          ].join(" ")}
                          aria-label={`優先度 ${s.priority}`}
                        >
                          {s.priority}
                        </span>
                        <span className={["text-sm font-semibold", pc.textClass].join(" ")}>
                          {s.priorityLabel}優先
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed text-foreground">
                        {s.opportunity}
                      </p>
                      <div className="mt-2.5 border-t border-border/60 pt-2.5">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          アクション
                        </p>
                        <p className="text-sm leading-relaxed text-foreground/80">{s.action}</p>
                      </div>
                      {s.categories.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {s.categories.map((c) => (
                            <span
                              key={c}
                              className="rounded px-1.5 py-0.5 text-xs font-medium"
                              style={{
                                backgroundColor: `var(--color-category-${categoryKey(c)}-bg)`,
                                color: `var(--color-category-${categoryKey(c)}-accent)`,
                              }}
                            >
                              {CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS] ?? c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
            )}
            <button
              onClick={handleConsult}
              className="w-full rounded-lg border border-border bg-white px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-slate-50 transition-colors"
            >
              再生成する
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
