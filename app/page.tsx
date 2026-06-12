import { NewbizWorkspace } from "@/components/workspace/NewbizWorkspace";
import themesData from "@/data/themes.json";
import kpiMapData from "@/data/kpi-map.json";
import weeklySummaryData from "@/data/weekly-summary.json";
import aiSuggestionsData from "@/data/ai-suggestions.json";
import workspaceData from "@/data/workspace.json";
import {
  themesSchema,
  kpiMapSchema,
  weeklySummariesSchema,
  aiSuggestionsSchema,
} from "@/lib/newbiz-schema";
import { workspaceSchema } from "@/lib/schema";

export default function Page() {
  const themesResult = themesSchema.safeParse(themesData);
  const kpiMapResult = kpiMapSchema.safeParse(kpiMapData);
  const summariesResult = weeklySummariesSchema.safeParse(weeklySummaryData);
  const suggestionsResult = aiSuggestionsSchema.safeParse(aiSuggestionsData);
  const wsResult = workspaceSchema.safeParse(workspaceData);

  const errors = [
    !themesResult.success &&
      `themes.json: ${themesResult.error.issues[0]?.message}`,
    !kpiMapResult.success &&
      `kpi-map.json: ${kpiMapResult.error.issues[0]?.message}`,
    !summariesResult.success &&
      `weekly-summary.json: ${summariesResult.error.issues[0]?.message}`,
    !suggestionsResult.success &&
      `ai-suggestions.json: ${suggestionsResult.error.issues[0]?.message}`,
    !wsResult.success && `workspace.json: ${wsResult.error.issues[0]?.message}`,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(`データの形式が正しくありません:\n${errors.join("\n")}`);
  }

  return (
    <NewbizWorkspace
      themes={themesResult.data!}
      kpiMap={kpiMapResult.data!}
      weeklySummaries={summariesResult.data!}
      aiSuggestions={suggestionsResult.data!}
      workspace={wsResult.data!}
    />
  );
}
