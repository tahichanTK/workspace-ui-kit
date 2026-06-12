"use client";

import {
  type Theme,
  type ThemeStatus,
  PHASE_LABELS,
} from "@/lib/newbiz-schema";

type ThemePaneProps = {
  themes: Theme[];
  selectedThemeId: string;
  onSelect: (id: string) => void;
};

const STATUS_CONFIG: Record<
  ThemeStatus,
  { label: string; dotClass: string; textClass: string }
> = {
  "on-track": {
    label: "順調",
    dotClass: "bg-green-500",
    textClass: "text-green-700",
  },
  "at-risk": {
    label: "要確認",
    dotClass: "bg-amber-400",
    textClass: "text-amber-700",
  },
  critical: {
    label: "要介入",
    dotClass: "bg-red-500",
    textClass: "text-red-600",
  },
};

const TYPE_LABELS: Record<string, string> = {
  product: "ものづくり系",
  service: "サービス系",
};

export function ThemePane({ themes, selectedThemeId, onSelect }: ThemePaneProps) {
  return (
    <aside
      className="flex h-full flex-col border-r border-border bg-muted/20"
      style={{ width: 216, minWidth: 216 }}
    >
      <div className="flex-shrink-0 border-b border-border px-3 py-2.5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          プロジェクト
        </p>
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
        {themes.map((theme) => {
          const isSelected = theme.id === selectedThemeId;
          const status = STATUS_CONFIG[theme.status];
          return (
            <button
              key={theme.id}
              onClick={() => onSelect(theme.id)}
              className={[
                "w-full min-h-[44px] rounded-lg border-l-4 px-3 py-2.5 text-left transition-colors",
                isSelected
                  ? "border-blue-600 bg-blue-50"
                  : "border-transparent hover:bg-muted/60",
              ].join(" ")}
            >
              <p
                className={[
                  "text-sm font-semibold leading-snug",
                  isSelected ? "text-blue-900" : "text-foreground",
                ].join(" ")}
              >
                {theme.name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {TYPE_LABELS[theme.type]}
              </p>
              <p className="text-xs text-muted-foreground">
                {PHASE_LABELS[theme.currentPhase]}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span
                  className={[
                    "h-2 w-2 flex-shrink-0 rounded-full",
                    status.dotClass,
                  ].join(" ")}
                />
                <span className={["text-xs font-medium", status.textClass].join(" ")}>
                  {status.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

    </aside>
  );
}
