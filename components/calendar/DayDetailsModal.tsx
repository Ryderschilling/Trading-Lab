"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { format } from "date-fns";

interface DayDetailsModalProps {
  date: Date;
  onClose: () => void;
}

export function DayDetailsModal({ date, onClose }: DayDetailsModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDayDetails();
  }, [date]);

  async function loadDayDetails() {
    setLoading(true);
    try {
      const dateStr = date.toISOString().split("T")[0];
      const response = await fetch(`/api/calendar/day?date=${dateStr}`);
      const dayData = await response.json();
      setData(dayData);
    } catch (error) {
      console.error("Failed to load day details:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !data) {
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

  const { trades, dailyPerf, journal } = data;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {format(date, "EEEE, MMMM d, yyyy")}
          </DialogTitle>
        </DialogHeader>

        {dailyPerf && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg border border-border">
              <div className="text-sm text-muted-foreground">Net P&L</div>
              <div className={`text-2xl font-bold ${dailyPerf.netPnl >= 0 ? "text-neon-green" : "text-red-500"}`}>
                {formatCurrency(dailyPerf.netPnl)}
              </div>
            </div>
            <div className="p-4 rounded-lg border border-border">
              <div className="text-sm text-muted-foreground">Trade Count</div>
              <div className="text-2xl font-bold">{dailyPerf.tradeCount}</div>
            </div>
            <div className="p-4 rounded-lg border border-border">
              <div className="text-sm text-muted-foreground">Win Rate</div>
              <div className="text-2xl font-bold">
                {dailyPerf.tradeCount > 0
                  ? ((dailyPerf.winCount / dailyPerf.tradeCount) * 100).toFixed(1)
                  : 0}%
              </div>
            </div>
          </div>
        )}

        <Tabs defaultValue="trades">
          <TabsList>
            <TabsTrigger value="trades">Trades</TabsTrigger>
            {journal && <TabsTrigger value="journal">Journal</TabsTrigger>}
          </TabsList>

          <TabsContent value="trades" className="space-y-4">
            {trades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No trades on this day
              </div>
            ) : (
              <div className="space-y-2">
                {trades.map((trade: any) => (
                  <div
                    key={trade.id}
                    className="p-4 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{trade.ticker}</div>
                        <div className="text-sm text-muted-foreground">
                          {trade.assetType}
                          {trade.strategyTag && ` • ${trade.strategyTag}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Qty: {trade.quantity}
                          {trade.contracts && ` • Contracts: ${trade.contracts}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${trade.totalReturn >= 0 ? "text-neon-green" : "text-red-500"}`}>
                          {formatCurrency(trade.totalReturn)}
                        </div>
                        <div className={`text-sm ${trade.percentReturn >= 0 ? "text-neon-green" : "text-red-500"}`}>
                          {formatPercent(trade.percentReturn)}
                        </div>
                      </div>
                    </div>
                    {trade.notes && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {trade.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {journal && (
            <TabsContent value="journal" className="space-y-4">
              <div className="space-y-4">
                {journal.preMarketPlan && (
                  <div>
                    <h3 className="font-semibold mb-2">Pre-Market Plan</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {journal.preMarketPlan}
                    </p>
                  </div>
                )}
                {journal.marketBias && (
                  <div>
                    <h3 className="font-semibold mb-2">Market Bias</h3>
                    <p className="text-sm text-muted-foreground">
                      {journal.marketBias}
                    </p>
                  </div>
                )}
                {journal.emotionalState && (
                  <div>
                    <h3 className="font-semibold mb-2">Emotional State</h3>
                    <p className="text-sm text-muted-foreground">
                      {journal.emotionalState}
                    </p>
                  </div>
                )}
                {journal.whatWentWell && (
                  <div>
                    <h3 className="font-semibold mb-2">What Went Well</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {journal.whatWentWell}
                    </p>
                  </div>
                )}
                {journal.whatWentWrong && (
                  <div>
                    <h3 className="font-semibold mb-2">What Went Wrong</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {journal.whatWentWrong}
                    </p>
                  </div>
                )}
                {journal.lessonsLearned && (
                  <div>
                    <h3 className="font-semibold mb-2">Lessons Learned</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {journal.lessonsLearned}
                    </p>
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

