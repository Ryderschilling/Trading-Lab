"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";

interface AdvancedStatsProps {
  stats: {
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
    bestTicker: string | null;
    worstTicker: string | null;
    largestWin: number | null;
    largestLoss: number | null;
  };
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green" | "red" | "neutral";
}) {
  return (
    <Card className="border-border/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          className={cn(
            "text-xl font-semibold tracking-tight",
            tone === "green" ? "text-green-500" : tone === "red" ? "text-red-500" : "text-foreground"
          )}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

export function AdvancedStats({ stats }: AdvancedStatsProps) {
  const cards = [
    {
      label: "Average Win",
      value: formatCurrency(stats.avgWin),
      tone: stats.avgWin > 0 ? "green" : stats.avgWin < 0 ? "red" : "neutral",
    },
    {
      label: "Average Loss",
      value: formatCurrency(stats.avgLoss),
      tone: "red",
    },
    {
      label: "Profit Factor",
      value: formatNumber(stats.profitFactor),
      tone: stats.profitFactor >= 1 ? "green" : "red",
    },
    { label: "Best Ticker", value: stats.bestTicker || "N/A", tone: "neutral" },
    { label: "Worst Ticker", value: stats.worstTicker || "N/A", tone: "neutral" },
    ...(stats.largestWin !== null && stats.largestWin !== undefined
      ? [
          {
            label: "Largest Win",
            value: formatCurrency(stats.largestWin),
            tone: stats.largestWin > 0 ? "green" : "neutral",
          },
        ]
      : []),
    ...(stats.largestLoss !== null && stats.largestLoss !== undefined
      ? [
          {
            label: "Largest Loss",
            value: formatCurrency(stats.largestLoss),
            tone: "red",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">Trade Stats</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} tone={c.tone as any} />
        ))}
      </div>
    </div>
  );
}