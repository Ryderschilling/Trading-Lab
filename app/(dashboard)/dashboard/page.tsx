import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { getStats, getDailyPerformance } from "@/lib/actions/trades";
import { getGoals } from "@/lib/actions/goals";
import { getJournalEntry } from "@/lib/actions/journal";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

import {
  Upload,
  BookOpen,
  Bot,
  BarChart3,
  Calendar,
  List,
  Target,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

/* ----------------------------- helpers ----------------------------- */

function QuickLink({
  href,
  title,
  description,
  Icon,
}: {
  href: string;
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link href={href} className="block">
      <Card className="h-full border-border/30 hover:border-border/60 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-semibold">{title}</div>
              </div>
              <div className="text-xs text-muted-foreground">{description}</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground mt-0.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function MiniStat({
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

/* ----------------------------- page ----------------------------- */

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));

  const [stats, dailyPerf, goals, journalToday] = await Promise.all([
    getStats(),
    getDailyPerformance(),
    getGoals(),
    getJournalEntry(todayStart),
  ]);

  // Empty state (keep tight)
  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Quick snapshot + jump to any module.
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
          <CardContent className="p-8 text-center space-y-3">
            <div className="text-sm text-muted-foreground">
              No trading data found yet.
            </div>
            <div className="text-xs text-muted-foreground">
              Upload a CSV or add a trade manually to populate analytics.
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickLink
            href="/upload"
            title="Upload"
            description="CSV import or manual trade."
            Icon={Upload}
          />
          <QuickLink
            href="/journal"
            title="Journal"
            description="Log decisions + lessons."
            Icon={BookOpen}
          />
          <QuickLink
            href="/assistant"
            title="Ask AI"
            description="Coaching and analysis."
            Icon={Bot}
          />
          <QuickLink
            href="/trades"
            title="Trades"
            description="Review executions."
            Icon={List}
          />
        </div>
      </div>
    );
  }

  const greenDays = dailyPerf.filter((d: any) => d.netPnl > 0).length;
  const redDays = dailyPerf.filter((d: any) => d.netPnl < 0).length;

  const journalDone = Boolean(journalToday);
  const topGoals = (goals ?? []).slice(0, 3);

  const totalPnl = formatCurrency(stats.totalPnl ?? 0);
  const winRate = `${Math.round(stats.winRate ?? 0)}%`;
  const profitFactor = (stats.profitFactor ?? 0).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Top row: title + primary actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Snapshot + one-click navigation.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-md border border-border/40 bg-card px-3 py-2 text-sm hover:border-border/60 transition"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Link>
          <Link
            href="/journal"
            className="inline-flex items-center gap-2 rounded-md border border-border/40 bg-card px-3 py-2 text-sm hover:border-border/60 transition"
          >
            <BookOpen className="h-4 w-4" />
            Journal
          </Link>
          <Link
            href="/assistant"
            className="inline-flex items-center gap-2 rounded-md border border-border/40 bg-card px-3 py-2 text-sm hover:border-border/60 transition"
          >
            <Bot className="h-4 w-4" />
            AI
          </Link>
        </div>
      </div>

      {/* KPI row (tight) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat label="Total P&L" value={totalPnl} sub="All-time net" />
        <MiniStat label="Win Rate" value={winRate} sub="Winning trades %" />
        <MiniStat label="Profit Factor" value={profitFactor} sub="Gross win / gross loss" />
        <MiniStat label="Green / Red Days" value={`${greenDays} / ${redDays}`} sub="Session outcomes" />
      </div>

      {/* Quick actions grid (structured, no dead space) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Quick Actions</div>
          <div className="text-xs text-muted-foreground">Jump into a module</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickLink
            href="/analytics"
            title="Analytics"
            description="Performance breakdown."
            Icon={BarChart3}
          />
          <QuickLink
            href="/trades"
            title="Trades"
            description="Review executions."
            Icon={List}
          />
          <QuickLink
            href="/calendar"
            title="Calendar"
            description="Day-by-day results."
            Icon={Calendar}
          />
          <QuickLink
            href="/goals"
            title="Goals"
            description="Targets + constraints."
            Icon={Target}
          />
        </div>
      </div>

      {/* Bottom row: Today + Goals (small, dense) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="border-border/30 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Today</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="text-muted-foreground">Journal</div>
              <div
                className={cn(
                  "inline-flex items-center gap-1 text-xs",
                  journalDone ? "text-green-500" : "text-muted-foreground"
                )}
              >
                {journalDone ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Completed
                  </>
                ) : (
                  "Not done"
                )}
              </div>
            </div>

            <Link
              href="/journal"
              className={cn(
                "inline-flex w-full items-center justify-center rounded-md px-3 py-2 text-sm font-medium",
                journalDone
                  ? "border border-border/40 hover:border-border/60"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {journalDone ? "Review Journal" : "Write Journal"}
            </Link>

            <div className="text-xs text-muted-foreground">
              Keep the dashboard lightweight. Do the work in each module.
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/30 lg:col-span-2">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm">Goals Snapshot</CardTitle>
            <Link href="/goals" className="text-xs text-muted-foreground hover:underline">
              Manage
            </Link>
          </CardHeader>

          <CardContent className="pt-0 space-y-3">
            {topGoals.length === 0 ? (
              <div className="text-sm text-muted-foreground">No active goals yet.</div>
            ) : (
              topGoals.map((g: any) => {
                const target = g.targetValue ?? 0;
                const current = g.currentValue ?? 0;
                const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;

                return (
                  <div key={g.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{g.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(current)} / {formatCurrency(target)}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {Math.round(progress)}%
                      </div>
                    </div>

                    <div className="h-2 w-full bg-border/30 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}