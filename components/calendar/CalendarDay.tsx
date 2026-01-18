"use client";

import { formatCurrency, cn } from "@/lib/utils";

interface CalendarDayProps {
  day: {
    date: Date;
    day: number;
    netPnl: number;
    tradeCount: number;
    hasTrades: boolean;
  };
  onClick: () => void;
}

export function CalendarDay({ day, onClick }: CalendarDayProps) {
  const isProfit = day.netPnl > 0;
  const isLoss = day.netPnl < 0;
  const hasTrades = day.hasTrades;

  return (
    <div
      onClick={onClick}
      className={cn(
        "aspect-square p-2 rounded-md border border-border/20 cursor-pointer transition-all hover:scale-105",
        isProfit && "bg-neon-green/20 border-neon-green",
        isLoss && "bg-red-500/20 border-red-500",
        !hasTrades && "bg-muted border-border opacity-50"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="text-sm font-semibold mb-1">{day.day}</div>
        {hasTrades && (
          <>
            <div className={cn(
              "text-xs font-bold flex-1",
              isProfit && "text-neon-green",
              isLoss && "text-red-500"
            )}>
              {formatCurrency(day.netPnl)}
            </div>
            <div className="text-xs text-muted-foreground">
              {day.tradeCount} {day.tradeCount === 1 ? "trade" : "trades"}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

