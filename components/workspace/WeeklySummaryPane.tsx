"use client";

import { useMemo } from "react";
import {
  type WeeklySummary,
  CATEGORY_LABELS,
} from "@/lib/newbiz-schema";

type WeeklySummaryPaneProps = {
  summaries: WeeklySummary[];
  selectedThemeId: string;
  highlightedCategories?: string[];
  onKpiHighlight?: (kpis: string[]) => void;
  onReset?: () => void;
};

export function WeeklySummaryPane({
  summaries,
  selectedThemeId,
  highlightedCategories = [],
  onKpiHighlight,
  onReset,
}: WeeklySummaryPaneProps) {
  const summary = useMemo(
    () => summaries.find((s) => s.themeId === selectedThemeId),
    [summaries, selectedThemeId],
  );

  const categoryKey = (cat: string) => cat.replace("_", "-");

  return (
    <div className="flex flex-col overflow-hidden border-b border-border">
      <div className="flex-shrink-0 border-b border-border bg-background px-3 py-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          今週のサマリー
        </p>
        {summary && (
          <p className="mt-0.5 text-xs text-muted-foreground">{summary.weekLabel}</p>
        )}
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto bg-slate-50 p-3">
        {!summary ? (
          <p className="p-2 text-sm text-muted-foreground">データがありません</p>
        ) : (
          summary.items.map((item, i) => {
            const isHighlighted = item.categories.some((c) =>
              highlightedCategories.includes(c),
            );
            return (
            <div
              key={i}
              onMouseEnter={() => onKpiHighlight?.(item.kpis)}
              onMouseLeave={() => onReset?.()}
              className={[
                "rounded-lg border p-3 shadow-sm transition-colors cursor-default",
                isHighlighted
                  ? "border-amber-300 bg-amber-50"
                  : "border-border bg-white",
              ].join(" ")}
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
            );
          })
        )}
      </div>
    </div>
  );
}
