import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStats } from "@/lib/actions/trades";
import { AdvancedStats } from "@/components/analytics/AdvancedStats";
import { OptionsStats } from "@/components/analytics/OptionsStats";
import { TimePerformance } from "@/components/analytics/TimePerformance";


export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const stats = await getStats();

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground text-lg">
            No data yet. Start by uploading your first trade!
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/upload"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Upload Trades
            </a>
          </div>
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

