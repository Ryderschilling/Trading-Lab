"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface StrategyPerformanceProps {
  trades: Array<{
    strategyTag: string | null;
    totalReturn: number;
  }>;
}

export function StrategyPerformance({ trades }: StrategyPerformanceProps) {
  const strategyMap = new Map<string, number>();
  
  trades.forEach((trade) => {
    if (trade.strategyTag) {
      strategyMap.set(
        trade.strategyTag,
        (strategyMap.get(trade.strategyTag) || 0) + trade.totalReturn
      );
    }
  });

  const strategyData = Array.from(strategyMap.entries())
    .map(([strategy, pnl]) => ({ strategy, pnl }))
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 5);

  if (strategyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Strategy Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No strategy data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Strategies</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {strategyData.map((item) => (
            <div key={item.strategy} className="flex items-center justify-between">
              <span className="font-medium">{item.strategy}</span>
              <span className={item.pnl >= 0 ? "text-green-500" : "text-red-500"}>
                {formatCurrency(item.pnl)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

