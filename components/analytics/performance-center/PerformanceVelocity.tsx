import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber, cn, pnlTextClass } from "@/lib/utils";

export function PerformanceVelocity({
  velocity,
}: {
  velocity: {
    avgDaily: number;
    medianDaily: number;
    greenDays: number;
    redDays: number;
    flatDays: number;
    greenRate: number;
    avgTradesPerDay: number;
    bestDay: number;
    worstDay: number;
    mtd: number;
    ytd: number;
  };
}) {
  const cards: Array<{
    label: string;
    value: string;
    sub?: string;
    toneValue?: number; // if provided -> color the value based on sign
  }> = [
    { label: "Avg Daily P&L", value: formatCurrency(velocity.avgDaily), sub: "Mean", toneValue: velocity.avgDaily },
    { label: "Median Daily P&L", value: formatCurrency(velocity.medianDaily), sub: "More robust", toneValue: velocity.medianDaily },
    {
      label: "Green Day %",
      value: `${Math.round(velocity.greenRate * 100)}%`,
      sub: `${velocity.greenDays} green / ${velocity.redDays} red`,
    },
    { label: "Avg Trades/Day", value: formatNumber(velocity.avgTradesPerDay), sub: "Based on active days" },
    { label: "Best Day", value: formatCurrency(velocity.bestDay), sub: "Max daily net", toneValue: velocity.bestDay },
    { label: "Worst Day", value: formatCurrency(velocity.worstDay), sub: "Min daily net", toneValue: velocity.worstDay },
    { label: "MTD P&L", value: formatCurrency(velocity.mtd), sub: "Month-to-date", toneValue: velocity.mtd },
    { label: "YTD P&L", value: formatCurrency(velocity.ytd), sub: "Year-to-date", toneValue: velocity.ytd },
  ];

  return (
    <Card className="border-border/30">
      <CardHeader>
        <CardTitle>Profit Velocity</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}