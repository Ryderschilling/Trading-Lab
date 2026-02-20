import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber, cn, pnlTextClass } from "@/lib/utils";

export function EdgeMetrics({
  edge,
  drawdownMeta,
}: {
  edge: {
    expectancy: number;
    breakEvenWinRate: number;
    dailyStd: number;
    downsideDev: number;
    sharpeLike: number;
    sortinoLike: number;
  };
  drawdownMeta: {
    maxDrawdownAbs: number;
    maxDrawdownWindow: { start: string | null; end: string | null };
    maxDrawdownDurationDays: number;
    maxDrawdownDurationWindow: { start: string | null; end: string | null };
    recoveryFactor: number;
  };
}) {
  const cards: Array<{ label: string; value: string; sub?: string; toneValue?: number }> = [
    {
      label: "Expectancy / Trade",
      value: formatCurrency(edge.expectancy),
      sub: "(W%×AvgWin) − (L%×AvgLoss)",
      toneValue: edge.expectancy,
    },
    {
      label: "Break-even Win Rate",
      value: `${Math.round(edge.breakEvenWinRate * 100)}%`,
      sub: "Required to be profitable",
    },
    {
      label: "Daily Volatility",
      value: formatCurrency(edge.dailyStd),
      sub: "Std dev of daily net",
    },
    {
      label: "Downside Deviation",
      value: formatCurrency(edge.downsideDev),
      sub: "Volatility of red days",
    },
    {
      label: "Sharpe-like",
      value: formatNumber(edge.sharpeLike),
      sub: "Mean / daily std",
      toneValue: edge.sharpeLike,
    },
    {
      label: "Sortino-like",
      value: formatNumber(edge.sortinoLike),
      sub: "Mean / downside dev",
      toneValue: edge.sortinoLike,
    },
    {
      label: "Max Drawdown",
      value: formatCurrency(-Math.abs(drawdownMeta.maxDrawdownAbs)),
      sub:
        drawdownMeta.maxDrawdownWindow.start && drawdownMeta.maxDrawdownWindow.end
          ? `${drawdownMeta.maxDrawdownWindow.start} → ${drawdownMeta.maxDrawdownWindow.end}`
          : "—",
      toneValue: -Math.abs(drawdownMeta.maxDrawdownAbs),
    },
    {
      label: "Recovery Factor",
      value: formatNumber(drawdownMeta.recoveryFactor),
      sub: "Total P&L / Max DD",
      toneValue: drawdownMeta.recoveryFactor,
    },
  ];

  return (
    <Card className="border-border/30">
      <CardHeader>
        <CardTitle>Edge & Risk</CardTitle>
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

          <div className="rounded-lg border border-border/40 bg-card p-4">
            <div className="text-xs text-muted-foreground">Max DD Duration</div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-foreground">
              {drawdownMeta.maxDrawdownDurationDays} days
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {drawdownMeta.maxDrawdownDurationWindow.start && drawdownMeta.maxDrawdownDurationWindow.end
                ? `${drawdownMeta.maxDrawdownDurationWindow.start} → ${drawdownMeta.maxDrawdownDurationWindow.end}`
                : "—"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}