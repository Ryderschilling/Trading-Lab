"use client";

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
  data: {
    trades: any[];
    dailyPerf: any;
    journal: any;
  } | null;
  loading: boolean;
  onClose: () => void;
}

export function DayDetailsModal({ date, data, loading, onClose }: DayDetailsModalProps) {
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
              <div className={`text-2xl font-bold ${dailyPerf.netPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
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
                        </div>
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
                {/* Nutrition & Stimulants */}
                {(journal.breakfast || journal.caffeine || journal.sugar || journal.hydration) && (
                  <div>
                    <h3 className="font-semibold mb-2">🍳 Nutrition & Stimulants</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {journal.breakfast && <div><span className="font-medium">Breakfast:</span> {journal.breakfast}</div>}
                      {journal.caffeine && <div><span className="font-medium">Caffeine:</span> {journal.caffeine}</div>}
                      {journal.sugar && <div><span className="font-medium">Sugar:</span> {journal.sugar}</div>}
                      {journal.hydration && <div><span className="font-medium">Hydration:</span> {journal.hydration}</div>}
                    </div>
                  </div>
                )}

                {/* Sleep & Recovery */}
                {(journal.sleepDuration || journal.sleepQuality || journal.bedtime || journal.wakeFeeling) && (
                  <div>
                    <h3 className="font-semibold mb-2">😴 Sleep & Recovery</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {journal.sleepDuration && <div><span className="font-medium">Duration:</span> {journal.sleepDuration}</div>}
                      {journal.sleepQuality && <div><span className="font-medium">Quality:</span> {journal.sleepQuality}</div>}
                      {journal.bedtime && <div><span className="font-medium">Bedtime:</span> {journal.bedtime}</div>}
                      {journal.wakeFeeling && <div><span className="font-medium">Wake Feeling:</span> {journal.wakeFeeling}</div>}
                    </div>
                  </div>
                )}

                {/* Trading Behavior */}
                {(journal.tradingQuality || journal.revengeTrading || journal.distractions || journal.overtrading || journal.timeSpentTrading || journal.stoppedWhenShouldHave) && (
                  <div>
                    <h3 className="font-semibold mb-2">📈 Trading Behavior</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {journal.tradingQuality && <div><span className="font-medium">Quality:</span> {journal.tradingQuality}</div>}
                      {journal.revengeTrading && <div><span className="font-medium">Revenge Trading:</span> {journal.revengeTrading}</div>}
                      {journal.distractions && <div><span className="font-medium">Distractions:</span> {journal.distractions}</div>}
                      {journal.overtrading && <div><span className="font-medium">Overtrading:</span> {journal.overtrading}</div>}
                      {journal.timeSpentTrading && <div><span className="font-medium">Time Spent:</span> {journal.timeSpentTrading}</div>}
                      {journal.stoppedWhenShouldHave && <div><span className="font-medium">Stopped When Should Have:</span> {journal.stoppedWhenShouldHave}</div>}
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

