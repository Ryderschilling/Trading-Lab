import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStats, getTrades, getDailyPerformance } from "@/lib/actions/trades";
import { KPICard } from "@/components/dashboard/KPICard";
import { EquityCurve } from "@/components/dashboard/EquityCurve";
import { DailyPnlChart } from "@/components/dashboard/DailyPnlChart";
import { RecentTrades } from "@/components/dashboard/RecentTrades";
import { WinLossDistribution } from "@/components/dashboard/WinLossDistribution";
import { StrategyPerformance } from "@/components/dashboard/StrategyPerformance";


export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  let stats: Awaited<ReturnType<typeof getStats>> = null;
  let trades: Awaited<ReturnType<typeof getTrades>> = [];
  let dailyPerf: Awaited<ReturnType<typeof getDailyPerformance>> = [];
  
  try {
    [stats, trades, dailyPerf] = await Promise.all([
      getStats(),
      getTrades(10),
      getDailyPerformance(),
    ]);
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    // If database isn't set up, show empty state
    stats = null;
    trades = [];
    dailyPerf = [];
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No data yet. Start by uploading your first trade!
          </p>
        </div>
      </div>
    );
  }

  const recentDays = dailyPerf.slice(-30);

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
        />
        <KPICard
          title="Win Rate"
          value={stats.winRate}
          format="percent"
          trend={stats.winRate >= 50 ? "up" : "down"}
        />
        <KPICard
          title="Profit Factor"
          value={stats.profitFactor}
          format="number"
          trend={stats.profitFactor >= 1 ? "up" : "down"}
        />
        <KPICard
          title="Total Trades"
          value={stats.totalTrades}
          format="number"
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
        <StrategyPerformance trades={trades} />
      </div>

      {/* Recent Trades */}
      <RecentTrades trades={trades} />
    </div>
  );
}

