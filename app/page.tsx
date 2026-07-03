import { NewbizWorkspace } from "@/components/workspace/NewbizWorkspace";
import workspaceData from "@/data/workspace.json";
import { workspaceSchema } from "@/lib/schema";
import {
  getThemes,
  getKpiMap,
  getWeeklySummaries,
} from "@/lib/db-queries";

export default async function Page() {
  const [themes, kpiMap, weeklySummaries] = await Promise.all([
    getThemes(),
    getKpiMap(),
    getWeeklySummaries(),
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
      workspace={wsResult.data}
    />
  );
}
