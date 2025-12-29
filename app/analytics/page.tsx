import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStats } from "@/lib/actions/trades";
import { AdvancedStats } from "@/components/analytics/AdvancedStats";
import { OptionsStats } from "@/components/analytics/OptionsStats";
import { TimePerformance } from "@/components/analytics/TimePerformance";

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const stats = await getStats();

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No data yet. Start by uploading your first trade!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Advanced Analytics</h1>

      <AdvancedStats stats={stats} />
      <OptionsStats stats={stats} />
      <TimePerformance stats={stats} />
    </div>
  );
}

