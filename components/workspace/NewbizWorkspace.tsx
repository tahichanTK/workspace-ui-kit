"use client";

import { useState } from "react";
import type {
  Theme,
  KpiMapEntry,
  WeeklySummary,
  AiSuggestionsEntry,
} from "@/lib/newbiz-schema";
import { ThemePane } from "@/components/workspace/ThemePane";
import { KpiMapPane } from "@/components/workspace/KpiMapPane";
import { WeeklySummaryPane } from "@/components/workspace/WeeklySummaryPane";
import { AiSuggestionsPane } from "@/components/workspace/AiSuggestionsPane";

type NewbizWorkspaceProps = {
  themes: Theme[];
  kpiMap: KpiMapEntry[];
  weeklySummaries: WeeklySummary[];
  aiSuggestions: AiSuggestionsEntry[];
  workspace: { name: string; icon: string };
};

export function NewbizWorkspace({
  themes,
  kpiMap,
  weeklySummaries,
  aiSuggestions,
  workspace,
}: NewbizWorkspaceProps) {
  const [selectedThemeId, setSelectedThemeId] = useState(themes[0]?.id ?? "");
  // P2列ホバー or P4カードホバー → P3/P4カードに amber 反応
  const [highlightedCategories, setHighlightedCategories] = useState<string[]>([]);
  // P3カードホバー → P2の特定KPIカードにリング反応
  const [highlightedKpis, setHighlightedKpis] = useState<string[]>([]);

  const handleCategoryHighlight = (cats: string[]) => {
    setHighlightedCategories(cats);
    setHighlightedKpis([]);
  };
  const handleKpiHighlight = (kpis: string[]) => {
    setHighlightedKpis(kpis);
    setHighlightedCategories([]);
  };
  const handleReset = () => {
    setHighlightedCategories([]);
    setHighlightedKpis([]);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* App Header */}
      <header className="flex h-10 flex-shrink-0 items-center justify-between bg-slate-800 px-4 text-white">
        <span className="text-sm font-bold">{workspace.name}</span>
        <span className="text-xs text-slate-400">2026年 Q2</span>
      </header>

      {/* 4-pane grid — desktop */}
      <div
        className="hidden min-h-0 flex-1 md:grid"
        style={{
          gridTemplateColumns: "216px 1fr 540px",
          gridTemplateRows: "1fr 1fr",
        }}
      >
        {/* P1: テーマナビ（2行分） */}
        <div style={{ gridRow: "1 / 3" }} className="min-h-0">
          <ThemePane
            themes={themes}
            selectedThemeId={selectedThemeId}
            onSelect={setSelectedThemeId}
          />
        </div>

        {/* P2: KPI マップ（2行分） */}
        <div
          key={`p2-${selectedThemeId}`}
          style={{ gridRow: "1 / 3" }}
          className="animate-in fade-in-0 flex min-h-0 flex-col duration-200"
        >
          <KpiMapPane
            themes={themes}
            kpiMap={kpiMap}
            selectedThemeId={selectedThemeId}
            highlightedKpis={highlightedKpis}
            onCategoryHighlight={handleCategoryHighlight}
            onCategoryReset={handleReset}
          />
        </div>

        {/* P3: 今週のサマリー */}
        <div
          key={`p3-${selectedThemeId}`}
          className="animate-in fade-in-0 flex min-h-0 flex-col overflow-hidden duration-200"
        >
          <WeeklySummaryPane
            summaries={weeklySummaries}
            selectedThemeId={selectedThemeId}
            highlightedCategories={highlightedCategories}
            onKpiHighlight={handleKpiHighlight}
            onReset={handleReset}
          />
        </div>

        {/* P4: 次の一手 */}
        <div
          key={`p4-${selectedThemeId}`}
          className="animate-in fade-in-0 flex min-h-0 flex-col overflow-hidden duration-200"
        >
          <AiSuggestionsPane
            suggestions={aiSuggestions}
            selectedThemeId={selectedThemeId}
            highlightedCategories={highlightedCategories}
            onCategoryHighlight={handleCategoryHighlight}
            onCategoryReset={handleReset}
          />
        </div>
      </div>

      {/* モバイル: タブ切替シングルカラム */}
      <MobileView
        themes={themes}
        kpiMap={kpiMap}
        weeklySummaries={weeklySummaries}
        aiSuggestions={aiSuggestions}
        selectedThemeId={selectedThemeId}
        onSelectTheme={setSelectedThemeId}
      />
    </div>
  );
}

type MobileViewProps = {
  themes: Theme[];
  kpiMap: KpiMapEntry[];
  weeklySummaries: WeeklySummary[];
  aiSuggestions: AiSuggestionsEntry[];
  selectedThemeId: string;
  onSelectTheme: (id: string) => void;
};

type TabKey = "theme" | "map" | "summary" | "ai";

const TABS: { key: TabKey; label: string }[] = [
  { key: "theme", label: "テーマ" },
  { key: "map", label: "KPI地図" },
  { key: "summary", label: "週次" },
  { key: "ai", label: "AI提案" },
];

function MobileView({
  themes,
  kpiMap,
  weeklySummaries,
  aiSuggestions,
  selectedThemeId,
  onSelectTheme,
}: MobileViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("theme");

  return (
    <div className="flex min-h-0 flex-1 flex-col md:hidden">
      {/* Tab bar */}
      <div className="flex flex-shrink-0 border-b border-border bg-background">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={[
              "flex-1 py-2 text-xs font-semibold transition-colors",
              activeTab === tab.key
                ? "border-b-2 border-blue-600 text-blue-700"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === "theme" && (
          <div className="h-full overflow-y-auto">
            <ThemePane
              themes={themes}
              selectedThemeId={selectedThemeId}
              onSelect={(id) => {
                onSelectTheme(id);
                setActiveTab("map");
              }}
            />
          </div>
        )}
        {activeTab === "map" && (
          <KpiMapPane
            themes={themes}
            kpiMap={kpiMap}
            selectedThemeId={selectedThemeId}
          />
        )}
        {activeTab === "summary" && (
          <WeeklySummaryPane
            summaries={weeklySummaries}
            selectedThemeId={selectedThemeId}
          />
        )}
        {activeTab === "ai" && (
          <AiSuggestionsPane
            suggestions={aiSuggestions}
            selectedThemeId={selectedThemeId}
          />
        )}
      </div>
    </div>
  );
}
