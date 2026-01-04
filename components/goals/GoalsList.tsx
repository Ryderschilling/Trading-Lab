"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatPercent, formatNumber, cn } from "@/lib/utils";

interface Goal {
  id: string;
  name: string;
  type: string;
  targetValue: number;
  currentValue: number;
  status: string;
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

  function getStatusColor(status: string): string {
    switch (status) {
      case "on_track":
        return "text-neon-green border-neon-green";
      case "at_risk":
        return "text-neon-orange border-neon-orange";
      case "broken":
        return "text-red-500 border-red-500";
      default:
        return "text-muted-foreground border-border";
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {goals.map((goal) => {
        const progress = getProgress(goal);
        const statusColor = getStatusColor(goal.status);

        return (
          <Card key={goal.id} className={cn("border-2", statusColor)}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{goal.name}</CardTitle>
                <span className={cn("text-xs font-semibold px-2 py-1 rounded", statusColor)}>
                  {goal.status.replace("_", " ").toUpperCase()}
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

