"use client";

import { useState, useMemo, useCallback } from "react";
import {
  type Theme,
  type KpiMapEntry,
  type Rag,
  PHASE_ORDER,
  PHASE_LABELS,
  CATEGORY_LABELS,
  CATEGORIES_BY_TYPE,
  VALID_CATEGORIES_BY_PHASE,
  ragToDisplay,
} from "@/lib/newbiz-schema";

// ===== サブコンポーネント =====

/** フェーズ進捗ステッパー */
function PhasesStepper({
  currentPhase,
}: {
  currentPhase: string;
}) {
  const currentIndex = PHASE_ORDER.indexOf(
    currentPhase as (typeof PHASE_ORDER)[number],
  );
  const progressPct =
    PHASE_ORDER.length > 1
      ? (currentIndex / (PHASE_ORDER.length - 1)) * 100
      : 0;

  return (
    <div className="relative flex items-start">
      {/* ベースライン */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-3.5 h-0.5 bg-muted/30"
        aria-hidden="true"
      />
      {/* 完了済みライン */}
      <div
        className="pointer-events-none absolute left-0 top-3.5 h-0.5 bg-blue-400 transition-all"
        style={{ width: `${progressPct}%` }}
        aria-hidden="true"
      />
      {/* フェーズノード */}
      {PHASE_ORDER.map((phase, i) => {
        const isPast = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div
            key={phase}
            className="relative z-10 flex flex-1 flex-col items-center"
          >
            <div
              className={[
                "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold",
                isPast
                  ? "border-blue-400 bg-blue-400 text-white"
                  : isCurrent
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-muted-foreground/30 bg-background text-muted-foreground/40",
              ].join(" ")}
            >
              {isPast ? "✓" : i + 1}
            </div>
            <span
              className={[
                "mt-1 whitespace-nowrap text-xs",
                isCurrent
                  ? "font-bold text-blue-700"
                  : isPast
                    ? "text-blue-400"
                    : "text-muted-foreground/40",
              ].join(" ")}
            >
              {PHASE_LABELS[phase]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** KPI カード（プログレスバー + RAGバッジ付き） */
function KpiCard({
  name,
  value,
  target,
  unit,
  rag,
  expanded,
  isHighlighted,
}: {
  name: string;
  value: number;
  target: number;
  unit: string;
  rag: Rag;
  expanded: boolean;
  isHighlighted: boolean;
}) {
  const ragDisplay = ragToDisplay(rag);
  const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0);
  const barColor =
    rag === "G"
      ? "bg-green-500"
      : rag === "A"
        ? "bg-amber-400"
        : "bg-red-500";

  return (
    <div
      className={[
        "rounded-md border transition-all",
        isHighlighted
          ? "border-amber-400 bg-amber-50 shadow-md ring-2 ring-amber-300"
          : expanded
            ? "border-border bg-background px-3 py-2.5 shadow-sm"
            : "border-border bg-muted/30",
        isHighlighted || expanded ? "px-3 py-2.5" : "px-2 py-1.5",
      ].join(" ")}
    >
      {/* KPI 名 */}
      <p
        className={[
          "font-semibold leading-snug text-foreground",
          expanded ? "text-sm" : "text-xs",
        ].join(" ")}
      >
        {name}
      </p>

      {/* 達成値 / 目標値 */}
      <p className="mt-0.5 text-xs text-muted-foreground">
        {value}
        {unit} / {target}
        {unit}
      </p>

      {/* プログレスバー */}
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={["h-full rounded-full transition-all", barColor].join(" ")}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${name}: ${pct.toFixed(0)}%`}
        />
      </div>

      {/* RAG バッジ（強化版: 背景付き rounded-full） */}
      <div
        className={[
          "mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
          ragDisplay.bgClass,
          ragDisplay.colorClass,
        ].join(" ")}
      >
        <span aria-hidden="true">{ragDisplay.icon}</span>
        <span>{ragDisplay.label}</span>
      </div>
    </div>
  );
}

// ===== メインコンポーネント =====

type KpiMapPaneProps = {
  themes: Theme[];
  kpiMap: KpiMapEntry[];
  selectedThemeId: string;
  highlightedKpis?: string[];
  onCategoryHighlight?: (cats: string[]) => void;
  onCategoryReset?: () => void;
};

export function KpiMapPane({
  themes,
  kpiMap,
  selectedThemeId,
  highlightedKpis = [],
  onCategoryHighlight,
  onCategoryReset,
}: KpiMapPaneProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredCol, setHoveredCol] = useState<string | null>(null);
  const [futureExpanded, setFutureExpanded] = useState(false);

  const toggleFuture = useCallback(() => setFutureExpanded((v) => !v), []);

  const theme = useMemo(
    () => themes.find((t) => t.id === selectedThemeId) ?? themes[0],
    [themes, selectedThemeId],
  );

  // データが存在するカテゴリのみ表示（空列を排除）
  const categories = useMemo(() => {
    const populated = new Set(
      kpiMap
        .filter((e) => e.themeId === selectedThemeId)
        .map((e) => e.category),
    );
    return CATEGORIES_BY_TYPE[theme.type].filter((cat) => populated.has(cat));
  }, [kpiMap, selectedThemeId, theme.type]);

  const kpiForCell = useMemo(() => {
    const map = new Map<string, KpiMapEntry>();
    kpiMap
      .filter((e) => e.themeId === selectedThemeId)
      .forEach((e) => {
        map.set(`${e.phase}:${e.category}`, e);
      });
    return map;
  }, [kpiMap, selectedThemeId]);

  const categoryKey = (cat: string) => cat.replace("_", "-");

  return (
    <div className="flex min-h-0 flex-1 flex-col border-r border-border">
      {/* ヘッダー（テーマ情報 + フェーズステッパー） */}
      <div className="flex-shrink-0 border-b border-border bg-background px-4 pb-3 pt-2.5">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            KPI マップ
          </span>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
            {theme.name} |{" "}
            {theme.type === "product" ? "ものづくり系" : "サービス系"}
          </span>
        </div>
        <PhasesStepper currentPhase={theme.currentPhase} />
      </div>

      {/* KPI グリッド */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {/* 角セル */}
              <th className="sticky left-0 top-0 z-20 min-w-[80px] border-b border-r border-border bg-muted/60 px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                フェーズ
              </th>
              {categories.map((cat) => {
                return (
                <th
                  key={cat}
                  onMouseEnter={() => { setHoveredCol(cat); onCategoryHighlight?.([cat]); }}
                  onMouseLeave={() => { setHoveredCol(null); onCategoryReset?.(); }}
                  className={[
                    "sticky top-0 z-10 min-w-[180px] border-b border-r border-border px-3 py-2 text-left text-xs font-semibold transition-colors",
                    hoveredCol === cat ? "bg-slate-100" : "bg-muted/40",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                      style={{
                        backgroundColor: `var(--color-category-${categoryKey(cat)}-accent)`,
                      }}
                    />
                    {CATEGORY_LABELS[cat]}
                  </span>
                </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {(() => {
              const currentIndex = PHASE_ORDER.indexOf(
                theme.currentPhase as (typeof PHASE_ORDER)[number],
              );
              const visiblePhases = PHASE_ORDER.slice(0, currentIndex + 1);
              const futurePhases = PHASE_ORDER.slice(currentIndex + 1);

              return (
                <>
                  {/* 現在フェーズまでの行 */}
                  {visiblePhases.map((phase) => {
                    const isCurrentPhase = phase === theme.currentPhase;
                    const validCats = VALID_CATEGORIES_BY_PHASE[phase][theme.type];

                    return (
                      <tr
                        key={phase}
                        onMouseEnter={() => setHoveredRow(phase)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        {/* フェーズラベルセル */}
                        <td
                          className={[
                            "sticky left-0 z-10 border-b border-r border-border align-top transition-colors",
                            isCurrentPhase
                              ? "bg-blue-50 px-3 py-4"
                              : hoveredRow === phase
                                ? "bg-slate-50 px-3 py-2"
                                : "bg-muted/20 px-3 py-2",
                          ].join(" ")}
                        >
                          <div className="flex flex-col gap-1">
                            <span
                              className={[
                                "text-xs font-bold",
                                isCurrentPhase
                                  ? "text-blue-700"
                                  : "text-muted-foreground",
                              ].join(" ")}
                            >
                              {PHASE_LABELS[phase]}
                            </span>
                            {isCurrentPhase && (
                              <span className="w-fit rounded-full bg-blue-600 px-1.5 py-0.5 text-xs text-white">
                                現在地
                              </span>
                            )}
                          </div>
                        </td>

                        {/* KPI セル */}
                  {categories.map((cat) => {
                    const isValid = (validCats as string[]).includes(cat);
                    const entry = kpiForCell.get(`${phase}:${cat}`);
                    const isRowHovered = hoveredRow === phase;
                    const isColHovered = hoveredCol === cat;

                    return (
                      <td
                        key={cat}
                        onMouseEnter={() => { setHoveredCol(cat); onCategoryHighlight?.([cat]); }}
                        onMouseLeave={() => { setHoveredCol(null); onCategoryReset?.(); }}
                        className={[
                          "border-b border-r border-border align-top transition-colors",
                          isCurrentPhase ? "px-3 py-4" : "px-3 py-2",
                          isCurrentPhase && isValid
                            ? "border-l-2 border-l-blue-600 bg-blue-50"
                            : (isRowHovered || isColHovered) && isValid
                              ? "bg-slate-50"
                              : !isValid
                                ? "bg-muted/10"
                                : "",
                        ].join(" ")}
                      >
                              {!isValid ? (
                                <span className="text-xs text-muted-foreground/30">
                                  —
                                </span>
                              ) : !entry ? (
                                <span className="text-xs text-muted-foreground/50">
                                  未設定
                                </span>
                              ) : (
                                <div
                                  className={
                                    isCurrentPhase ? "space-y-2.5" : "space-y-1.5"
                                  }
                                >
                            {entry.kpis.map((kpi, i) => (
                              <KpiCard
                                key={i}
                                name={kpi.name}
                                value={kpi.value}
                                target={kpi.target}
                                unit={kpi.unit}
                                rag={kpi.rag}
                                expanded={isCurrentPhase}
                                isHighlighted={highlightedKpis.includes(kpi.name)}
                              />
                            ))}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  {/* 将来フェーズ折りたたみ行 */}
                  {futurePhases.length > 0 && (
                    <>
                      <tr>
                        <td
                          colSpan={categories.length + 1}
                          className="border-b border-border bg-muted/10 px-3 py-2"
                        >
                          <button
                            onClick={toggleFuture}
                            className="flex w-full items-center gap-2 text-left text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <span
                              className={[
                                "inline-block transition-transform",
                                futureExpanded ? "rotate-90" : "",
                              ].join(" ")}
                            >
                              ▶
                            </span>
                            将来フェーズ（{futurePhases.map((p) => PHASE_LABELS[p]).join(" → ")}）
                          </button>
                        </td>
                      </tr>

                      {/* 展開時のみ表示 */}
                      {futureExpanded &&
                        futurePhases.map((phase) => {
                          const validCats = VALID_CATEGORIES_BY_PHASE[phase][theme.type];
                          return (
                            <tr
                              key={phase}
                              onMouseEnter={() => setHoveredRow(phase)}
                              onMouseLeave={() => setHoveredRow(null)}
                              className="opacity-50"
                            >
                              <td className="sticky left-0 z-10 border-b border-r border-border bg-muted/10 px-3 py-2 align-top">
                                <span className="text-xs font-bold text-muted-foreground">
                                  {PHASE_LABELS[phase]}
                                </span>
                              </td>
                              {categories.map((cat) => {
                                const isValid = (validCats as string[]).includes(cat);
                                return (
                                  <td
                                    key={cat}
                                    className="border-b border-r border-border bg-muted/5 px-3 py-2 align-top"
                                  >
                                    <span className="text-xs text-muted-foreground/40">
                                      {isValid ? "未開始" : "—"}
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                    </>
                  )}
                </>
              );
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
