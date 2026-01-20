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
  const isNeutral = day.netPnl === 0;
  const hasTrades = day.hasTrades;

  return (
    <div
      onClick={onClick}
      className={cn(
        "aspect-square p-2 rounded-md border border-border/30 cursor-pointer transition-all hover:scale-105",
        isProfit && "bg-green-500/10 border-green-500/30",
        isLoss && "bg-red-500/10 border-red-500/30",
        isNeutral && hasTrades && "bg-muted border-border/30",
        !hasTrades && "bg-muted border-border/30 opacity-50"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="text-sm font-semibold mb-1">{day.day}</div>
        {hasTrades && (
          <>
            <div className={cn(
              "text-xs font-bold flex-1",
              isProfit && "text-green-500",
              isLoss && "text-red-500",
              isNeutral && "text-foreground"
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

