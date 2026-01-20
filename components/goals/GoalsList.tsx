"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatPercent, formatNumber, cn } from "@/lib/utils";
import { CreateGoalButton } from "./CreateGoalButton";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Goal {
  id: string;
  name: string;
  type: string;
  targetValue: number;
  currentValue: number;
  timeframe: string;
}

interface GoalsListProps {
  goals: Goal[];
}

export function GoalsList({ goals }: GoalsListProps) {
  if (goals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <p className="text-muted-foreground">
            No goals set yet. Create your first trading goal to get started!
          </p>
          <div className="flex justify-center">
            <CreateGoalButton />
          </div>
        </CardContent>
      </Card>
    );
  }

  function formatValue(value: number, type: string): string {
    switch (type) {
      case "monthly_profit":
      case "max_daily_loss":
        return formatCurrency(value);
      case "win_rate":
      case "consistency":
        return formatPercent(value);
      default:
        return formatNumber(value);
    }
  }

  function getProgress(goal: Goal): number {
    if (goal.targetValue === 0) return 0;
    // For goals where lower is better (max_daily_loss, max_trades_per_day), invert the calculation
    if (goal.type === "max_daily_loss" || goal.type === "max_trades_per_day") {
      if (goal.currentValue >= goal.targetValue) return 0;
      return ((goal.targetValue - goal.currentValue) / goal.targetValue) * 100;
    }
    return Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  }

  function getTrend(goal: Goal): "up" | "down" | "neutral" {
    // For goals where higher is better (monthly_profit, win_rate, consistency)
    if (goal.type === "monthly_profit" || goal.type === "win_rate" || goal.type === "consistency") {
      if (goal.currentValue > goal.targetValue * 0.9) return "up";
      if (goal.currentValue < goal.targetValue * 0.5) return "down";
      return goal.currentValue >= goal.targetValue * 0.7 ? "up" : "down";
    }
    // For goals where lower is better (max_daily_loss, max_trades_per_day)
    if (goal.type === "max_daily_loss" || goal.type === "max_trades_per_day") {
      if (goal.currentValue < goal.targetValue * 0.9) return "up";
      if (goal.currentValue >= goal.targetValue) return "down";
      return goal.currentValue < goal.targetValue ? "up" : "down";
    }
    return "neutral";
  }

  function getStatusColor(progress: number): string {
    if (progress >= 100) {
      return "text-[#16C784] border-[#16C784]";
    } else if (progress >= 50) {
      return "text-foreground border-border";
    } else {
      return "text-foreground border-border";
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {goals.map((goal) => {
        const progress = getProgress(goal);
        const statusColor = getStatusColor(progress);
        const trend = getTrend(goal);

        return (
          <Card key={goal.id} className={cn("border border-border/30")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{goal.name}</CardTitle>
                {trend !== "neutral" && (
                  <div className={cn(
                    "flex items-center gap-1",
                    trend === "up" ? "text-green-500" : "text-red-500"
                  )}>
                    {trend === "up" ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Current / Target</span>
                  <span className="font-semibold">
                    {formatValue(goal.currentValue, goal.type)} / {formatValue(goal.targetValue, goal.type)}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              <div className="text-sm text-muted-foreground">
                Timeframe: {goal.timeframe}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

