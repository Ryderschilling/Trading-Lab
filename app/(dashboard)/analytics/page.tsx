import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { getStats } from "@/lib/actions/trades";
import { getPerformanceCenterData } from "@/lib/actions/performanceCenter";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

import { AdvancedStats } from "@/components/analytics/AdvancedStats";
import { TimePerformance } from "@/components/analytics/TimePerformance";

import { EquityDrawdown } from "@/components/analytics/performance-center/EquityDrawdown";
import { MonthlyBreakdown } from "@/components/analytics/performance-center/MonthlyBreakdown";
import { PerformanceVelocity } from "@/components/analytics/performance-center/PerformanceVelocity";
import { EdgeMetrics } from "@/components/analytics/performance-center/EdgeMetrics";
import { Projections } from "@/components/analytics/performance-center/Projections";
import { JournalInsights } from "@/components/analytics/performance-center/JournalInsights";

export const dynamic = "force-dynamic";

function Kpi({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="border-border/30">
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 text-xl font-semibold tracking-tight">{value}</div>
        {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
      </CardContent>
    </Card>
  );
}

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const stats = await getStats();

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Upload trades to unlock performance breakdowns.
            </p>
          </div>
          <Link
            href="/upload"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Upload Trades
          </Link>
        </div>

        <Card className="border-border/30">
          <CardContent className="p-10 text-center space-y-2">
            <div className="text-sm text-muted-foreground">No trading data found yet.</div>
            <div className="text-xs text-muted-foreground">
              Import a CSV or add a trade manually to populate analytics.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const perf = await getPerformanceCenterData();

  const totalPnl = formatCurrency(stats.totalPnl ?? 0);
  const totalTrades = `${stats.totalTrades ?? 0}`;
  const winRate = `${Math.round(stats.winRate ?? 0)}%`;
  const avgTrade = formatCurrency(stats.avgTradePnl ?? 0);
  const profitFactor = (stats.profitFactor ?? 0).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Fast read on performance + deeper breakdowns below.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/trades"
            className="inline-flex items-center justify-center rounded-md border border-border/40 bg-card px-3 py-2 text-sm hover:border-border/60 transition"
          >
            Trades
          </Link>
          <Link
            href="/calendar"
            className="inline-flex items-center justify-center rounded-md border border-border/40 bg-card px-3 py-2 text-sm hover:border-border/60 transition"
          >
            Calendar
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi label="Total P&L" value={totalPnl} sub="All-time net" />
        <Kpi label="Total Trades" value={totalTrades} sub="Count" />
        <Kpi label="Win Rate" value={winRate} sub="Winners %" />
        <Kpi label="Avg Trade" value={avgTrade} sub="Avg P&L per trade" />
        <Kpi label="Profit Factor" value={profitFactor} sub="Gross win / gross loss" />
      </div>

      <AdvancedStats stats={stats} />
      <TimePerformance stats={stats} />

      {/* Performance Center (in-depth) */}
      {perf ? (
        <>
          <PerformanceVelocity velocity={perf.velocity} />
          <EquityDrawdown data={perf.equityCurve} />
          <MonthlyBreakdown data={perf.monthly} />
          <EdgeMetrics edge={perf.edge} drawdownMeta={perf.drawdownMeta} />
          <Projections simple={perf.projections.simple} monteCarlo={perf.projections.monteCarlo} />
          <JournalInsights insights={perf.journal.insights} />
        </>
      ) : null}
    </div>
  );
}

