import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type Group = {
  label: string;
  value: string;
  n: number;
  avgPnl: number;
  greenRate: number; // 0..1
};

type Insights = {
  tradingQuality: Group[];
  revengeTrading: Group[];
  overtrading: Group[];
  sleepQuality: Group[];
  caffeine: Group[];
};

function InsightTable({ title, rows }: { title: string; rows: Group[] }) {
  const top = rows.slice(0, 6);

  return (
    <div className="rounded-lg border border-border/40 bg-card">
      <div className="border-b border-border/40 px-4 py-3">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">Avg P&L and green rate on days you logged this</div>
      </div>
      <div className="p-4">
        {top.length === 0 ? (
          <div className="text-sm text-muted-foreground">No journal data matched to trading days yet.</div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-12 text-xs text-muted-foreground">
              <div className="col-span-5">Value</div>
              <div className="col-span-3 text-right">Avg P&L</div>
              <div className="col-span-2 text-right">Green %</div>
              <div className="col-span-2 text-right">N</div>
            </div>
            {top.map((r) => (
              <div key={`${title}-${r.value}`} className="grid grid-cols-12 items-center text-sm">
                <div className="col-span-5 truncate">{r.value}</div>
                <div className={`col-span-3 text-right ${r.avgPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatCurrency(r.avgPnl)}
                </div>
                <div className="col-span-2 text-right">{Math.round(r.greenRate * 100)}%</div>
                <div className="col-span-2 text-right text-muted-foreground">{r.n}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function JournalInsights({ insights }: { insights: Insights }) {
  return (
    <Card className="border-border/30">
      <CardHeader>
        <CardTitle>Journal ↔ Performance Signals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <InsightTable title="Trading Quality" rows={insights.tradingQuality} />
          <InsightTable title="Revenge Trading" rows={insights.revengeTrading} />
          <InsightTable title="Overtrading" rows={insights.overtrading} />
          <InsightTable title="Sleep Quality" rows={insights.sleepQuality} />
          <InsightTable title="Caffeine" rows={insights.caffeine} />
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          These are correlations, not causation. Use them to detect patterns and tighten your process.
        </div>
      </CardContent>
    </Card>
  );
}