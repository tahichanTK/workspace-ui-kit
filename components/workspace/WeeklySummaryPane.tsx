"use client";

import { useMemo } from "react";
import {
  type WeeklySummary,
  CATEGORY_LABELS,
} from "@/lib/newbiz-schema";

type WeeklySummaryPaneProps = {
  summaries: WeeklySummary[];
  selectedThemeId: string;
  selectedCategory?: string | null;
  onCategoryReset?: () => void;
};

export function WeeklySummaryPane({
  summaries,
  selectedThemeId,
  selectedCategory = null,
  onCategoryReset,
}: WeeklySummaryPaneProps) {
  const summary = useMemo(
    () => summaries.find((s) => s.themeId === selectedThemeId),
    [summaries, selectedThemeId],
  );

  const categoryKey = (cat: string) => cat.replace("_", "-");

  const filteredItems = useMemo(() => {
    if (!summary) return [];
    if (!selectedCategory) return summary.items;
    return summary.items.filter((item) =>
      item.categories.includes(selectedCategory as WeeklySummary["items"][number]["categories"][number]),
    );
  }, [summary, selectedCategory]);

  return (
    <div className="flex flex-col overflow-hidden border-b border-border">
      <div className="flex-shrink-0 border-b border-border bg-background px-3 py-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              今週のサマリー
            </p>
            {summary && (
              <p className="mt-0.5 text-xs text-muted-foreground">{summary.weekLabel}</p>
            )}
          </div>
          {selectedCategory && (
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

      <div className="flex-1 space-y-2.5 overflow-y-auto bg-slate-50 p-3">
        {!summary ? (
          <p className="p-2 text-sm text-muted-foreground">データがありません</p>
        ) : filteredItems.length === 0 ? (
          <p className="p-2 text-sm text-muted-foreground">
            このカテゴリの項目はありません
          </p>
        ) : (
          filteredItems.map((item, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-white p-3 shadow-sm"
            >
              <p className="text-sm leading-relaxed text-foreground">{item.text}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.categories.map((c) => (
                  <span
                    key={c}
                    className="rounded px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `var(--color-category-${categoryKey(c)}-bg)`,
                      color: `var(--color-category-${categoryKey(c)}-accent)`,
                    }}
                  >
                    {CATEGORY_LABELS[c]}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
