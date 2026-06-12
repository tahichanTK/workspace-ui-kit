"use client";

import { useMemo } from "react";
import { type AiSuggestionsEntry } from "@/lib/newbiz-schema";

type AiSuggestionsPaneProps = {
  suggestions: AiSuggestionsEntry[];
  selectedThemeId: string;
  highlightedCategories?: string[];
  onCategoryHighlight?: (cats: string[]) => void;
  onCategoryReset?: () => void;
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

export function AiSuggestionsPane({
  suggestions,
  selectedThemeId,
  highlightedCategories = [],
  onCategoryHighlight,
  onCategoryReset,
}: AiSuggestionsPaneProps) {
  const entry = useMemo(
    () => suggestions.find((s) => s.themeId === selectedThemeId),
    [suggestions, selectedThemeId],
  );

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border bg-background px-3 py-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          次の一手
        </p>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto bg-slate-50 p-3">
        {!entry ? (
          <p className="p-2 text-sm text-muted-foreground">データがありません</p>
        ) : (
          [...entry.suggestions]
            .sort((a, b) => a.priority - b.priority)
            .map((s, i) => {
              const pc = PRIORITY_CONFIG[s.priority as 1 | 2 | 3];
              const isHighlighted = s.categories.some((c) =>
                highlightedCategories.includes(c),
              );
              return (
                <div
                  key={i}
                  onMouseEnter={() => onCategoryHighlight?.(s.categories)}
                  onMouseLeave={() => onCategoryReset?.()}
                  className={[
                    "rounded-lg border p-3 shadow-sm transition-colors cursor-default",
                    isHighlighted
                      ? "border-amber-300 bg-amber-50"
                      : `bg-white ${pc.borderClass}`,
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
                </div>
              );
            })
        )}
      </div>

      {entry && (
        <div className="flex-shrink-0 border-t border-border px-3 py-2">
          <p className="text-xs text-muted-foreground/60">
            最終更新: {entry.updatedAt}（毎週月曜更新）
          </p>
        </div>
      )}
    </div>
  );
}
