import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStats, getDailyPerformance } from "@/lib/actions/trades";
import { KPICard } from "@/components/dashboard/KPICard";
import { EquityCurve } from "@/components/dashboard/EquityCurve";
import { DailyPnlChart } from "@/components/dashboard/DailyPnlChart";
import { WinLossDistribution } from "@/components/dashboard/WinLossDistribution";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  let stats: Awaited<ReturnType<typeof getStats>> = null;
  let dailyPerf: Awaited<ReturnType<typeof getDailyPerformance>> = [];
  
  try {
    [stats, dailyPerf] = await Promise.all([
      getStats(),
      getDailyPerformance(),
    ]);
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    // If database isn't set up, show empty state
    stats = null;
    dailyPerf = [];
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
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

  const recentDays = dailyPerf.slice(-30);
  
  // Calculate Green vs Red Days from all daily performance
  const greenDays = dailyPerf.filter((d: { netPnl: number }) => d.netPnl > 0).length;
  const redDays = dailyPerf.filter((d: { netPnl: number }) => d.netPnl < 0).length;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total P&L"
          value={stats.totalPnl}
          format="currency"
          trend={stats.totalPnl >= 0 ? "up" : "down"}
          tooltip="Your total realized profit or loss from closed trades during this period."
        />
        <KPICard
          title="Profit Factor"
          value={stats.profitFactor}
          format="number"
          trend={stats.profitFactor >= 1 ? "up" : "down"}
          tooltip="Total profits divided by total losses. Above 1 means you're profitable overall."
        />
        <KPICard
          title="Win Rate"
          value={stats.winRate}
          format="percent"
          trend={stats.winRate >= 50 ? "up" : "down"}
          tooltip="Percentage of trades that closed with a profit."
        />
        <KPICard
          title="Average Trade P&L"
          value={stats.avgTradePnl || 0}
          format="currency"
          trend={(stats.avgTradePnl || 0) >= 0 ? "up" : "down"}
          tooltip="Your average profit or loss per closed trade. Includes both winning and losing trades."
        />
        <KPICard
          title="Trade Count"
          value={stats.totalTrades}
          format="number"
          tooltip="Total number of trades closed during this period."
        />
        <KPICard
          title="Green vs Red Days"
          value={greenDays}
          format="number"
          trend={greenDays >= redDays ? "up" : "down"}
          tooltip="Number of profitable days compared to losing days."
          customDisplay={`${greenDays} vs ${redDays}`}
        />
        <KPICard
          title="Largest Win"
          value={stats.largestWin || 0}
          format="currency"
          trend="up"
          tooltip="Your single most profitable trade in this period."
        />
        <KPICard
          title="Largest Loss"
          value={stats.largestLoss || 0}
          format="currency"
          trend="down"
          tooltip="Your single biggest losing trade in this period."
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EquityCurve data={dailyPerf} />
        <DailyPnlChart data={recentDays} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WinLossDistribution stats={stats} />
      </div>
    </div>
  );
}

