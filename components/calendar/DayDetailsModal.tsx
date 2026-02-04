"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { format } from "date-fns";

interface DayDetailsModalProps {
  date: Date;
  data: { trades: any[]; dailyPerf: any; journal: any } | null;
  loading: boolean;
  error?: string | null;
  onClose: () => void;
}

export function DayDetailsModal({ date, data, loading, error, onClose }: DayDetailsModalProps) {
  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{format(date, "EEEE, MMMM d, yyyy")}</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">{error}</div>
          <div className="pt-4">
            <Button onClick={onClose} className="w-full">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!data) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{format(date, "EEEE, MMMM d, yyyy")}</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">No details available for this day.</div>
          <div className="pt-4">
            <Button onClick={onClose} className="w-full">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { trades, dailyPerf, journal } = data;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{format(date, "EEEE, MMMM d, yyyy")}</DialogTitle>
        </DialogHeader>

        {dailyPerf && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div className="p-3 rounded-lg border border-border">
              <div className="text-sm text-muted-foreground">Net P&L</div>
              <div className={`text-2xl font-bold ${dailyPerf.netPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                {formatCurrency(dailyPerf.netPnl)}
              </div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-sm text-muted-foreground">Trade Count</div>
              <div className="text-2xl font-bold">{dailyPerf.tradeCount}</div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-sm text-muted-foreground">Win Rate</div>
              <div className="text-2xl font-bold">
                {dailyPerf.tradeCount > 0 ? ((dailyPerf.winCount / dailyPerf.tradeCount) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>
        )}

        <Tabs defaultValue="trades">
          <TabsList>
            <TabsTrigger value="trades">Trades</TabsTrigger>
            {journal && <TabsTrigger value="journal">Journal</TabsTrigger>}
          </TabsList>

          <TabsContent value="trades" className="space-y-3">
            {trades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No trades on this day</div>
            ) : (
              <div className="space-y-2">
                {trades.map((trade: any) => (
                  <div key={trade.id} className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{trade.ticker}</div>
                        <div className="text-sm text-muted-foreground">{trade.assetType}</div>
                        <div className="text-sm text-muted-foreground">
                          Qty: {trade.quantity}
                          {trade.contracts && ` • Contracts: ${trade.contracts}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${trade.totalReturn >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {formatCurrency(trade.totalReturn)}
                        </div>
                        <div className={`text-sm ${trade.percentReturn >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {formatPercent(trade.percentReturn)}
                        </div>
                      </div>
                    </div>
                    {trade.notes && <div className="mt-2 text-sm text-muted-foreground">{trade.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {journal && (
            <TabsContent value="journal" className="space-y-4">
              <div className="space-y-4">
                {(journal.breakfast || journal.caffeine || journal.sugar || journal.hydration) && (
                  <div>
                    <h3 className="font-semibold mb-2">🍳 Nutrition & Stimulants</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {journal.breakfast && <div><span className="font-medium">Breakfast:</span> {journal.breakfast}</div>}
                      {journal.caffeine && <div><span className="font-medium">Caffeine:</span> {journal.caffeine}</div>}
                      {journal.sugar && <div><span className="font-medium">Sugar:</span> {journal.sugar}</div>}
                      {journal.hydration && <div><span className="font-medium">Hydration:</span> {journal.hydration}</div>}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
