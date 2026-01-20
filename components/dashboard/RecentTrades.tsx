"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { format } from "date-fns";

interface RecentTradesProps {
  trades: Array<{
    id: string;
    ticker: string;
    assetType: string;
    tradeDate: Date;
    totalReturn: number;
    percentReturn: number;
    quantity: number;
    strategyTag: string | null;
  }>;
}

export function RecentTrades({ trades }: RecentTradesProps) {
  if (trades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No trades yet. Start by uploading your first trade!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="font-semibold">{trade.ticker}</p>
                    <p className="text-sm text-muted-foreground">{trade.assetType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(trade.tradeDate), "MMM dd, yyyy")}
                    </p>
                    {trade.strategyTag && (
                      <p className="text-sm text-neon-purple">{trade.strategyTag}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Qty: {trade.quantity}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={trade.totalReturn >= 0 ? "text-green-500 font-semibold" : "text-red-500 font-semibold"}>
                  {formatCurrency(trade.totalReturn)}
                </p>
                <p className={`text-sm ${trade.percentReturn >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {formatPercent(trade.percentReturn)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

