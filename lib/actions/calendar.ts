"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCalendarData(year: number, month: number) {
  const user = await getCurrentUser();
  if (!user) return { days: [], monthlyStats: null };

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const dailyPerf = await prisma.dailyPerformance.findMany({
    where: {
      userId: user.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "asc" },
  });

  // Get journal entries for the month
  const journalEntries = await prisma.journalEntry.findMany({
    where: {
      userId: user.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Get trades for the month
  const trades = await prisma.trade.findMany({
    where: {
      userId: user.id,
      tradeDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: { optionMetadata: true },
    orderBy: { tradeDate: "asc" },
  });

  // Get monthly performance
  const monthlyStats = await prisma.monthlyPerformance.findUnique({
    where: {
      userId_year_month: {
        userId: user.id,
        year,
        month,
      },
    },
  });

  // Group trades by date
  const tradesByDate = new Map<string, typeof trades>();
  trades.forEach((trade) => {
    const dateStr = new Date(trade.tradeDate).toISOString().split("T")[0];
    if (!tradesByDate.has(dateStr)) {
      tradesByDate.set(dateStr, []);
    }
    tradesByDate.get(dateStr)!.push(trade);
  });

  // Create a map of daily performance by date
  const perfByDate = new Map(
    dailyPerf.map((perf) => [
      new Date(perf.date).toISOString().split("T")[0],
      perf,
    ])
  );

  // Create a map of journal entries by date
  const journalByDate = new Map(
    journalEntries.map((entry) => [
      new Date(entry.date).toISOString().split("T")[0],
      entry,
    ])
  );

  // Build calendar days
  const daysInMonth = endDate.getDate();
  const days = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = date.toISOString().split("T")[0];
    const perf = perfByDate.get(dateStr);
    const dayTrades = tradesByDate.get(dateStr) || [];
    const journal = journalByDate.get(dateStr);

    days.push({
      date,
      day,
      netPnl: perf?.netPnl || 0,
      tradeCount: perf?.tradeCount || 0,
      trades: dayTrades,
      journal,
      hasTrades: dayTrades.length > 0,
    });
  }

  // Calculate streaks
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;

  dailyPerf.forEach((perf) => {
    if (perf.netPnl > 0) {
      currentWinStreak++;
      currentLossStreak = 0;
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
    } else if (perf.netPnl < 0) {
      currentLossStreak++;
      currentWinStreak = 0;
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
    } else {
      currentWinStreak = 0;
      currentLossStreak = 0;
    }
  });

  return {
    days,
    monthlyStats,
    streaks: {
      currentWinStreak,
      currentLossStreak,
      maxWinStreak,
      maxLossStreak,
    },
  };
}

export async function getDayDetails(date: Date) {
  const user = await getCurrentUser();
  if (!user) return null;

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const [trades, dailyPerf, journal] = await Promise.all([
    prisma.trade.findMany({
      where: {
        userId: user.id,
        tradeDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: { optionMetadata: true },
      orderBy: { tradeDate: "desc" },
    }),
    prisma.dailyPerformance.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: startOfDay,
        },
      },
    }),
    prisma.journalEntry.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: startOfDay,
        },
      },
    }),
  ]);

  return {
    trades,
    dailyPerf,
    journal,
  };
}

