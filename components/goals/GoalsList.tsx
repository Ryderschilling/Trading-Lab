"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatPercent, formatNumber, cn } from "@/lib/utils";
import { CreateGoalButton } from "./CreateGoalButton";

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
    return Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  }

  function getStatusColor(progress: number): string {
    if (progress >= 100) {
      return "text-neon-green border-neon-green";
    } else if (progress >= 50) {
      return "text-neon-orange border-neon-orange";
    } else {
      return "text-red-500 border-red-500";
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {goals.map((goal) => {
        const progress = getProgress(goal);
        const statusColor = getStatusColor(progress);

        return (
          <Card key={goal.id} className={cn("border-2", statusColor)}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{goal.name}</CardTitle>
                <span className={cn("text-xs font-semibold px-2 py-1 rounded", statusColor)}>
                  {progress >= 100 ? "COMPLETE" : progress >= 50 ? "ON TRACK" : "AT RISK"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress</span>
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

