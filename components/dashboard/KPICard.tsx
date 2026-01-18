"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatPercent, formatNumber, cn } from "@/lib/utils";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KPICardProps {
  title: string;
  value: number;
  format?: "currency" | "percent" | "number";
  trend?: "up" | "down";
  tooltip?: string;
  customDisplay?: string;
}

export function KPICard({ title, value, format = "number", trend, tooltip, customDisplay }: KPICardProps) {
  const formattedValue = customDisplay || (format === "currency" 
    ? formatCurrency(value)
    : format === "percent"
    ? `${value.toFixed(2)}%`
    : formatNumber(value));

  // Performance metrics that should use color
  const isPerformanceMetric = [
    "Total P&L",
    "Average Trade P&L",
    "Profit Factor",
    "Largest Win",
    "Largest Loss"
  ].includes(title);

  // Determine color class for performance metrics only
  let colorClass = "";
  if (isPerformanceMetric) {
    if (title === "Profit Factor") {
      // Profit factor: green if >= 1.0, red if < 1.0
      colorClass = value >= 1.0 ? "text-[#16C784]" : "text-[#EA3943]";
    } else if (title === "Largest Loss") {
      // Largest loss always red
      colorClass = "text-[#EA3943]";
    } else {
      // Other performance metrics: green if positive, red if negative
      const isPositive = value >= 0;
      colorClass = isPositive ? "text-[#16C784]" : "text-[#EA3943]";
    }
  } else {
    // Non-performance metrics: use foreground text
    colorClass = "text-foreground";
  }

  return (
    <Card className="border-border/30 hover:border-border/40 transition-colors relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {trend && isPerformanceMetric && (
            trend === "up" ? (
              <TrendingUp className="h-4 w-4 text-foreground" />
            ) : (
              <TrendingDown className="h-4 w-4 text-foreground" />
            )
          )}
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", colorClass)}>
          {formattedValue}
        </div>
      </CardContent>
    </Card>
  );
}
