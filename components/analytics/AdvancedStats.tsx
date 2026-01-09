"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils";

interface AdvancedStatsProps {
  stats: {
    totalPnl: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
    bestTicker: string | null;
    worstTicker: string | null;
    largestWin: number | null;
    largestLoss: number | null;
  };
}

export function AdvancedStats({ stats }: AdvancedStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Average Win
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-neon-green">
            {formatCurrency(stats.avgWin)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Average Loss
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">
            {formatCurrency(stats.avgLoss)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Profit Factor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(stats.profitFactor)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Best Ticker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-neon-green">
            {stats.bestTicker || "N/A"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Worst Ticker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">
            {stats.worstTicker || "N/A"}
          </div>
        </CardContent>
      </Card>

      {stats.largestWin !== null && stats.largestWin !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Largest Win
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neon-green">
              {formatCurrency(stats.largestWin)}
            </div>
          </CardContent>
        </Card>
      )}

      {stats.largestLoss !== null && stats.largestLoss !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Largest Loss
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(stats.largestLoss)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

