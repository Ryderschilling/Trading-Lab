"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTrade(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const tradeDate = new Date(formData.get("tradeDate") as string);
  const tradeTime = formData.get("tradeTime") as string;
  const ticker = formData.get("ticker") as string;
  const assetType = formData.get("assetType") as string;
  const entryPrice = parseFloat(formData.get("entryPrice") as string);
  const exitPrice = formData.get("exitPrice") ? parseFloat(formData.get("exitPrice") as string) : null;
  const quantity = parseInt(formData.get("quantity") as string);
  const contracts = formData.get("contracts") ? parseInt(formData.get("contracts") as string) : null;
  const totalInvested = parseFloat(formData.get("totalInvested") as string);
  const totalReturn = parseFloat(formData.get("totalReturn") as string);
  const percentReturn = parseFloat(formData.get("percentReturn") as string);
  const strategyTag = formData.get("strategyTag") as string | null;
  const notes = formData.get("notes") as string | null;
  const expirationDate = formData.get("expirationDate") ? new Date(formData.get("expirationDate") as string) : null;
  const strikePrice = formData.get("strikePrice") ? parseFloat(formData.get("strikePrice") as string) : null;

  // Combine date and time if time is provided
  let finalDate = tradeDate;
  if (tradeTime) {
    const [hours, minutes] = tradeTime.split(":");
    finalDate = new Date(tradeDate);
    finalDate.setHours(parseInt(hours), parseInt(minutes));
  }

  const trade = await prisma.trade.create({
    data: {
      userId: user.id,
      tradeDate: finalDate,
      tradeTime: tradeTime || null,
      ticker: ticker.toUpperCase(),
      assetType,
      entryPrice,
      exitPrice,
      quantity,
      contracts,
      totalInvested,
      totalReturn,
      percentReturn,
      strategyTag: strategyTag || null,
      notes: notes || null,
      ...(assetType !== "Stock" && expirationDate && strikePrice && {
        optionMetadata: {
          create: {
            expirationDate,
            strikePrice,
            is0DTE: expirationDate && new Date(expirationDate.getTime() - tradeDate.getTime()).getDate() === 0,
            isWeekly: false, // Calculate based on expiration
            isMonthly: false, // Calculate based on expiration
            timeOfDay: getTimeOfDay(tradeTime),
            dayOfWeek: getDayOfWeek(finalDate),
          },
        },
      }),
    },
    include: {
      optionMetadata: true,
    },
  });

  // Recalculate stats
  await recalculateStats(user.id, finalDate);

  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  revalidatePath("/goals");

  return trade;
}

function getTimeOfDay(time: string | null): string | null {
  if (!time) return null;
  const hour = parseInt(time.split(":")[0]);
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

function getDayOfWeek(date: Date): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getDay()];
}

export async function recalculateStats(userId: string, date?: Date) {
  // Recalculate daily performance for the trade date
  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  const dayStart = new Date(targetDate);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  const trades = await prisma.trade.findMany({
    where: {
      userId,
      tradeDate: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
  });

  const netPnl = trades.reduce((sum, t) => sum + t.totalReturn, 0);
  const winCount = trades.filter(t => t.totalReturn > 0).length;
  const lossCount = trades.filter(t => t.totalReturn < 0).length;
  const wins = trades.filter(t => t.totalReturn > 0).map(t => t.totalReturn);
  const losses = trades.filter(t => t.totalReturn < 0).map(t => Math.abs(t.totalReturn));
  const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : null;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : null;
  const largestWin = wins.length > 0 ? Math.max(...wins) : null;
  const largestLoss = losses.length > 0 ? Math.max(...losses) : null;
  const totalVolume = trades.reduce((sum, t) => sum + t.totalInvested, 0);

  await prisma.dailyPerformance.upsert({
    where: {
      userId_date: {
        userId,
        date: targetDate,
      },
    },
    update: {
      netPnl,
      tradeCount: trades.length,
      winCount,
      lossCount,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      totalVolume,
    },
    create: {
      userId,
      date: targetDate,
      netPnl,
      tradeCount: trades.length,
      winCount,
      lossCount,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      totalVolume,
    },
  });

  // Recalculate monthly performance
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  const monthTrades = await prisma.trade.findMany({
    where: {
      userId,
      tradeDate: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  });

  const monthPnl = monthTrades.reduce((sum, t) => sum + t.totalReturn, 0);
  const monthWinCount = monthTrades.filter(t => t.totalReturn > 0).length;
  const monthLossCount = monthTrades.filter(t => t.totalReturn < 0).length;

  const dailyPerfs = await prisma.dailyPerformance.findMany({
    where: {
      userId,
      date: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  });

  const greenDays = dailyPerfs.filter(d => d.netPnl > 0).length;
  const redDays = dailyPerfs.filter(d => d.netPnl < 0).length;
  const bestDay = dailyPerfs.length > 0 ? Math.max(...dailyPerfs.map(d => d.netPnl)) : null;
  const worstDay = dailyPerfs.length > 0 ? Math.min(...dailyPerfs.map(d => d.netPnl)) : null;

  await prisma.monthlyPerformance.upsert({
    where: {
      userId_year_month: {
        userId,
        year,
        month,
      },
    },
    update: {
      netPnl: monthPnl,
      tradeCount: monthTrades.length,
      winCount: monthWinCount,
      lossCount: monthLossCount,
      greenDays,
      redDays,
      bestDay,
      worstDay,
    },
    create: {
      userId,
      year,
      month,
      netPnl: monthPnl,
      tradeCount: monthTrades.length,
      winCount: monthWinCount,
      lossCount: monthLossCount,
      greenDays,
      redDays,
      bestDay,
      worstDay,
    },
  });

  // Recalculate aggregated stats
  await recalculateAggregatedStats(userId);
}

async function recalculateAggregatedStats(userId: string) {
  const allTrades = await prisma.trade.findMany({
    where: { userId },
    include: { optionMetadata: true },
    orderBy: { tradeDate: "asc" },
  });

  if (allTrades.length === 0) return;

  const totalPnl = allTrades.reduce((sum, t) => sum + t.totalReturn, 0);
  const wins = allTrades.filter(t => t.totalReturn > 0);
  const losses = allTrades.filter(t => t.totalReturn < 0);
  const winRate = allTrades.length > 0 ? (wins.length / allTrades.length) * 100 : 0;
  const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.totalReturn, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.totalReturn, 0) / losses.length) : 0;
  const riskToReward = avgLoss > 0 ? avgWin / avgLoss : 0;

  // Calculate max drawdown
  let maxDrawdown = 0;
  let peak = 0;
  let runningTotal = 0;
  for (const trade of allTrades) {
    runningTotal += trade.totalReturn;
    if (runningTotal > peak) peak = runningTotal;
    const drawdown = peak - runningTotal;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  const profitFactor = avgLoss > 0 ? (avgWin * wins.length) / (avgLoss * losses.length) : 0;

  // Calculate average hold time (simplified - would need entry/exit times)
  const avgHoldTime = 0; // Placeholder

  // Best/worst tickers
  const tickerPnl = new Map<string, number>();
  allTrades.forEach(trade => {
    tickerPnl.set(trade.ticker, (tickerPnl.get(trade.ticker) || 0) + trade.totalReturn);
  });
  const bestTicker = Array.from(tickerPnl.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const worstTicker = Array.from(tickerPnl.entries()).sort((a, b) => a[1] - b[1])[0]?.[0] || null;

  // Best/worst strategies
  const strategyPnl = new Map<string, number>();
  allTrades.forEach(trade => {
    if (trade.strategyTag) {
      strategyPnl.set(trade.strategyTag, (strategyPnl.get(trade.strategyTag) || 0) + trade.totalReturn);
    }
  });
  const bestStrategy = Array.from(strategyPnl.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const worstStrategy = Array.from(strategyPnl.entries()).sort((a, b) => a[1] - b[1])[0]?.[0] || null;

  // Options-specific stats
  const calls = allTrades.filter(t => t.assetType === "Call");
  const puts = allTrades.filter(t => t.assetType === "Put");
  const stocks = allTrades.filter(t => t.assetType === "Stock");
  const callsPnl = calls.reduce((sum, t) => sum + t.totalReturn, 0);
  const putsPnl = puts.reduce((sum, t) => sum + t.totalReturn, 0);
  const stocksPnl = stocks.reduce((sum, t) => sum + t.totalReturn, 0);

  const zeroDTE = allTrades.filter(t => t.optionMetadata?.is0DTE);
  const weekly = allTrades.filter(t => t.optionMetadata?.isWeekly);
  const monthly = allTrades.filter(t => t.optionMetadata?.isMonthly);
  const zeroDTEPnl = zeroDTE.reduce((sum, t) => sum + t.totalReturn, 0);
  const weeklyPnl = weekly.reduce((sum, t) => sum + t.totalReturn, 0);
  const monthlyPnl = monthly.reduce((sum, t) => sum + t.totalReturn, 0);

  // Time-of-day stats
  const morning = allTrades.filter(t => t.optionMetadata?.timeOfDay === "Morning");
  const afternoon = allTrades.filter(t => t.optionMetadata?.timeOfDay === "Afternoon");
  const evening = allTrades.filter(t => t.optionMetadata?.timeOfDay === "Evening");
  const morningPnl = morning.reduce((sum, t) => sum + t.totalReturn, 0);
  const afternoonPnl = afternoon.reduce((sum, t) => sum + t.totalReturn, 0);
  const eveningPnl = evening.reduce((sum, t) => sum + t.totalReturn, 0);

  // Day-of-week stats
  const monday = allTrades.filter(t => t.optionMetadata?.dayOfWeek === "Monday");
  const tuesday = allTrades.filter(t => t.optionMetadata?.dayOfWeek === "Tuesday");
  const wednesday = allTrades.filter(t => t.optionMetadata?.dayOfWeek === "Wednesday");
  const thursday = allTrades.filter(t => t.optionMetadata?.dayOfWeek === "Thursday");
  const friday = allTrades.filter(t => t.optionMetadata?.dayOfWeek === "Friday");
  const mondayPnl = monday.reduce((sum, t) => sum + t.totalReturn, 0);
  const tuesdayPnl = tuesday.reduce((sum, t) => sum + t.totalReturn, 0);
  const wednesdayPnl = wednesday.reduce((sum, t) => sum + t.totalReturn, 0);
  const thursdayPnl = thursday.reduce((sum, t) => sum + t.totalReturn, 0);
  const fridayPnl = friday.reduce((sum, t) => sum + t.totalReturn, 0);

  await prisma.aggregatedStats.upsert({
    where: { userId },
    update: {
      totalPnl,
      totalTrades: allTrades.length,
      winRate,
      avgWin,
      avgLoss,
      riskToReward,
      maxDrawdown,
      profitFactor,
      avgHoldTime,
      bestTicker,
      worstTicker,
      bestStrategy,
      worstStrategy,
      callsPnl,
      putsPnl,
      stocksPnl,
      zeroDTEPnl,
      weeklyPnl,
      monthlyPnl,
      morningPnl,
      afternoonPnl,
      eveningPnl,
      mondayPnl,
      tuesdayPnl,
      wednesdayPnl,
      thursdayPnl,
      fridayPnl,
      lastUpdated: new Date(),
    },
    create: {
      userId,
      totalPnl,
      totalTrades: allTrades.length,
      winRate,
      avgWin,
      avgLoss,
      riskToReward,
      maxDrawdown,
      profitFactor,
      avgHoldTime,
      bestTicker,
      worstTicker,
      bestStrategy,
      worstStrategy,
      callsPnl,
      putsPnl,
      stocksPnl,
      zeroDTEPnl,
      weeklyPnl,
      monthlyPnl,
      morningPnl,
      afternoonPnl,
      eveningPnl,
      mondayPnl,
      tuesdayPnl,
      wednesdayPnl,
      thursdayPnl,
      fridayPnl,
    },
  });
}

export async function getTrades(limit?: number) {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.trade.findMany({
    where: { userId: user.id },
    include: { optionMetadata: true },
    orderBy: { tradeDate: "desc" },
    take: limit,
  });
}

export async function getStats() {
  const user = await getCurrentUser();
  if (!user) return null;

  return prisma.aggregatedStats.findUnique({
    where: { userId: user.id },
  });
}

export async function getDailyPerformance(startDate?: Date, endDate?: Date) {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.dailyPerformance.findMany({
    where: {
      userId: user.id,
      ...(startDate && endDate && {
        date: {
          gte: startDate,
          lte: endDate,
        },
      }),
    },
    orderBy: { date: "asc" },
  });
}

