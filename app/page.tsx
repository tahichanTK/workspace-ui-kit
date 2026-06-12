import { NewbizWorkspace } from "@/components/workspace/NewbizWorkspace";
import workspaceData from "@/data/workspace.json";
import { workspaceSchema } from "@/lib/schema";
import {
  getThemes,
  getKpiMap,
  getWeeklySummaries,
  getAiSuggestions,
} from "@/lib/db-queries";

export default async function Page() {
  const [themes, kpiMap, weeklySummaries, aiSuggestions] = await Promise.all([
    getThemes(),
    getKpiMap(),
    getWeeklySummaries(),
    getAiSuggestions(),
  ]);

  const wsResult = workspaceSchema.safeParse(workspaceData);
  if (!wsResult.success) {
    throw new Error(
      `workspace.json の形式が正しくありません: ${wsResult.error.issues[0]?.message}`
    );
  }

  return (
    <NewbizWorkspace
      themes={themes}
      kpiMap={kpiMap}
      weeklySummaries={weeklySummaries}
      aiSuggestions={aiSuggestions}
      workspace={wsResult.data}
    />
  );
}
