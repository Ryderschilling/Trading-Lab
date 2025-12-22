"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatPercent, formatNumber, cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number;
  format?: "currency" | "percent" | "number";
  trend?: "up" | "down";
}

export function KPICard({ title, value, format = "number", trend }: KPICardProps) {
  const formattedValue = format === "currency" 
    ? formatCurrency(value)
    : format === "percent"
    ? `${value.toFixed(2)}%`
    : formatNumber(value);

  const isPositive = value >= 0;
  const colorClass = isPositive ? "text-neon-green" : "text-red-500";

  return (
    <Card className="border-neon-green/20 hover:border-neon-green/40 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {trend && (
          trend === "up" ? (
            <TrendingUp className="h-4 w-4 text-neon-green" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )
        )}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", colorClass)}>
          {formattedValue}
        </div>
      </CardContent>
    </Card>
  );
}

