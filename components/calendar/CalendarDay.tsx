"use client";

import { formatCurrency, cn } from "@/lib/utils";

interface CalendarDayProps {
  day: {
    dateKey: string; // YYYY-MM-DD
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
      onClick={hasTrades ? onClick : undefined}
      className={cn(
        // Smaller than aspect-square; fits month on one screen more often
        "h-[84px] md:h-[92px] p-1.5 rounded-md border border-border/30 transition-colors",
        hasTrades ? "cursor-pointer hover:border-border/60" : "opacity-50 cursor-default",
        isProfit && "bg-green-500/10 border-green-500/30",
        isLoss && "bg-red-500/10 border-red-500/30",
        isNeutral && hasTrades && "bg-muted border-border/30",
        !hasTrades && "bg-muted border-border/30"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="text-xs font-semibold leading-none">{day.day}</div>

        {hasTrades ? (
          <>
            <div
              className={cn(
                "mt-1 text-xs font-bold flex-1 leading-tight",
                isProfit && "text-green-500",
                isLoss && "text-red-500",
                isNeutral && "text-foreground"
              )}
            >
              {formatCurrency(day.netPnl)}
            </div>
            <div className="text-[11px] text-muted-foreground leading-none">
              {day.tradeCount} {day.tradeCount === 1 ? "trade" : "trades"}
            </div>
          </>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
}
