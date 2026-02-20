"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, cn, pnlTextClass } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
} from "recharts";

type ProjectionSummary = {
  horizonDays: number;
  expected: number;
  median: number;
  p10: number;
  p90: number;
  probProfit: number;
};

type BandPoint = {
  day: number;
  p10: number;
  p50: number;
  p90: number;
};

export function Projections({
  simple,
  monteCarlo,
}: {
  simple: { d30: number; d90: number; d252: number };
  monteCarlo: {
    d30: ProjectionSummary;
    d90: ProjectionSummary;
    d252: ProjectionSummary;
    band30: BandPoint[];
  };
}) {
  const cards: Array<{ label: string; value: string; sub?: string; toneValue?: number }> = [
    { label: "Projected 30d (simple)", value: formatCurrency(simple.d30), sub: "Avg daily × 30", toneValue: simple.d30 },
    { label: "Projected 90d (simple)", value: formatCurrency(simple.d90), sub: "Avg daily × 90", toneValue: simple.d90 },
    { label: "Projected 252d (simple)", value: formatCurrency(simple.d252), sub: "Avg daily × 252", toneValue: simple.d252 },

    { label: "30d Prob. Profit (MC)", value: `${Math.round(monteCarlo.d30.probProfit * 100)}%`, sub: "Bootstrap Monte Carlo" },

    {
      label: "30d Median (MC)",
      value: formatCurrency(monteCarlo.d30.median),
      sub: `P10 ${formatCurrency(monteCarlo.d30.p10)} · P90 ${formatCurrency(monteCarlo.d30.p90)}`,
      toneValue: monteCarlo.d30.median,
    },
    {
      label: "90d Median (MC)",
      value: formatCurrency(monteCarlo.d90.median),
      sub: `P10 ${formatCurrency(monteCarlo.d90.p10)} · P90 ${formatCurrency(monteCarlo.d90.p90)}`,
      toneValue: monteCarlo.d90.median,
    },
    {
      label: "252d Median (MC)",
      value: formatCurrency(monteCarlo.d252.median),
      sub: `P10 ${formatCurrency(monteCarlo.d252.p10)} · P90 ${formatCurrency(monteCarlo.d252.p90)}`,
      toneValue: monteCarlo.d252.median,
    },
    { label: "Expected 30d (MC)", value: formatCurrency(monteCarlo.d30.expected), sub: "Mean outcome", toneValue: monteCarlo.d30.expected },
  ];

  const band = monteCarlo.band30.map((p) => ({
    day: p.day,
    p10: p.p10,
    p50: p.p50,
    p90: p.p90,
  }));

  return (
    <Card className="border-border/30">
      <CardHeader>
        <CardTitle>Future Projections</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map((c) => (
            <div key={c.label} className="rounded-lg border border-border/40 bg-card p-4">
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <div
                className={cn(
                  "mt-1 text-lg font-semibold tracking-tight",
                  typeof c.toneValue === "number" ? pnlTextClass(c.toneValue) : "text-foreground"
                )}
              >
                {c.value}
              </div>
              {c.sub ? <div className="mt-1 text-xs text-muted-foreground">{c.sub}</div> : null}
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border/40 bg-card p-4">
          <div className="text-sm font-medium">30-day Distribution Band (P10–P90)</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Based on resampling historical daily P&L with replacement (bootstrap). Not financial advice.
          </div>

          <div className="mt-4">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={band}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" opacity={0.3} />
                <XAxis dataKey="day" stroke="#B3B3B3" strokeWidth={1} tick={{ fontSize: 11, fill: "#B3B3B3" }} />
                <YAxis
                  stroke="#B3B3B3"
                  strokeWidth={1}
                  tick={{ fontSize: 11, fill: "#B3B3B3" }}
                  tickFormatter={(v) => formatCurrency(v)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#141414",
                    border: "1px solid #1F1F1F",
                    borderRadius: "0.5rem",
                    color: "#F2F2F2",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(l) => `Day ${l}`}
                />

                {/* Band */}
                <Area type="monotone" dataKey="p90" stroke="#B3B3B3" fill="#B3B3B3" fillOpacity={0.12} dot={false} />
                <Area type="monotone" dataKey="p10" stroke="#B3B3B3" fill="#141414" fillOpacity={0.0} dot={false} />

                {/* Median */}
                <Line type="monotone" dataKey="p50" stroke="#16C784" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Monte Carlo uses your historical daily results. If your behavior or risk changes, projections break.
        </div>
      </CardContent>
    </Card>
  );
}