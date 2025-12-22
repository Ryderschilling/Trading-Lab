"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getStats, getDailyPerformance } from "./trades";

export async function getGoals() {
  const user = await getCurrentUser();
  if (!user) return [];

  const goals = await prisma.goal.findMany({
    where: {
      userId: user.id,
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Update goal progress
  const stats = await getStats();
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const dailyPerf = await getDailyPerformance(startOfMonth, today);

  const updatedGoals = await Promise.all(
    goals.map(async (goal) => {
      let currentValue = 0;
      let status = "on_track";

      switch (goal.type) {
        case "monthly_profit":
          currentValue = stats?.totalPnl || 0;
          // Get monthly P&L
          const monthPnl = dailyPerf.reduce((sum, day) => sum + day.netPnl, 0);
          currentValue = monthPnl;
          status = currentValue >= goal.targetValue ? "on_track" : currentValue >= goal.targetValue * 0.7 ? "at_risk" : "broken";
          break;
        case "max_daily_loss":
          const maxDailyLoss = dailyPerf.length > 0
            ? Math.min(...dailyPerf.map(d => d.netPnl))
            : 0;
          currentValue = Math.abs(maxDailyLoss);
          status = currentValue <= goal.targetValue ? "on_track" : "broken";
          break;
        case "max_trades_per_day":
          const maxTradesPerDay = dailyPerf.length > 0
            ? Math.max(...dailyPerf.map(d => d.tradeCount))
            : 0;
          currentValue = maxTradesPerDay;
          status = currentValue <= goal.targetValue ? "on_track" : "broken";
          break;
        case "win_rate":
          currentValue = stats?.winRate || 0;
          status = currentValue >= goal.targetValue ? "on_track" : currentValue >= goal.targetValue * 0.9 ? "at_risk" : "broken";
          break;
        case "consistency":
          const greenDays = dailyPerf.filter(d => d.netPnl > 0).length;
          currentValue = dailyPerf.length > 0 ? (greenDays / dailyPerf.length) * 100 : 0;
          status = currentValue >= goal.targetValue ? "on_track" : currentValue >= goal.targetValue * 0.9 ? "at_risk" : "broken";
          break;
      }

      return {
        ...goal,
        currentValue,
        status,
      };
    })
  );

  return updatedGoals;
}

export async function createGoal(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const targetValue = parseFloat(formData.get("targetValue") as string);
  const timeframe = formData.get("timeframe") as string;

  const goal = await prisma.goal.create({
    data: {
      userId: user.id,
      name,
      type,
      targetValue,
      timeframe,
    },
  });

  revalidatePath("/goals");
  return goal;
}

export async function updateGoal(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const targetValue = parseFloat(formData.get("targetValue") as string);
  const isActive = formData.get("isActive") === "true";

  const goal = await prisma.goal.update({
    where: {
      id,
      userId: user.id,
    },
    data: {
      name,
      targetValue,
      isActive,
    },
  });

  revalidatePath("/goals");
  return goal;
}

export async function deleteGoal(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.goal.delete({
    where: {
      id,
      userId: user.id,
    },
  });

  revalidatePath("/goals");
}

