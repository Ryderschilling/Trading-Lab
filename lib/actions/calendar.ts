"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function ymdFromDateUTC(date: Date) {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

export async function getCalendarData(year: number, month: number) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      days: [],
      monthlyStats: null,
      streaks: { currentWinStreak: 0, currentLossStreak: 0, maxWinStreak: 0, maxLossStreak: 0 },
    };
  }

  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const [trades, dailyPerf, journalEntries, monthlyStats] = await Promise.all([
    prisma.trade.findMany({
      where: { userId: user.id, tradeDate: { gte: start, lte: end } },
      include: { optionMetadata: true },
      orderBy: { tradeDate: "asc" },
    }),
    prisma.dailyPerformance.findMany({
      where: { userId: user.id, date: { gte: start, lte: end } },
    }),
    prisma.journalEntry.findMany({
      where: { userId: user.id, date: { gte: start, lte: end } },
    }),
    prisma.monthlyPerformance.findUnique({
      where: { userId_year_month: { userId: user.id, year, month } },
    }),
  ]);

  const tradesByKey = new Map<string, typeof trades>();
  for (const t of trades) {
    const key = ymdFromDateUTC(t.tradeDate);
    if (!tradesByKey.has(key)) tradesByKey.set(key, []);
    tradesByKey.get(key)!.push(t);
  }

  const perfByKey = new Map(dailyPerf.map((p) => [ymdFromDateUTC(p.date), p]));
  const journalByKey = new Map(journalEntries.map((j) => [ymdFromDateUTC(j.date), j]));

  const daysInMonth = new Date(year, month, 0).getDate();
  const days: Array<any> = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${pad2(month)}-${pad2(d)}`;
    const dayTrades = tradesByKey.get(dateKey) ?? [];

    days.push({
      dateKey, // ✅ string only (safe to serialize)
      day: d,
      netPnl: perfByKey.get(dateKey)?.netPnl ?? 0,
      tradeCount: perfByKey.get(dateKey)?.tradeCount ?? 0,
      trades: dayTrades,
      journal: journalByKey.get(dateKey) ?? null,
      hasTrades: dayTrades.length > 0,
    });
  }

  return {
    days,
    monthlyStats,
    streaks: { currentWinStreak: 0, currentLossStreak: 0, maxWinStreak: 0, maxLossStreak: 0 },
  };
}

export async function getDayDetails(date: Date) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      trades: [],
      dailyPerf: null,
      journal: null,
    };
  }

  const dateKey = ymdFromDateUTC(date);
  const start = new Date(`${dateKey}T00:00:00.000Z`);
  const end = new Date(`${dateKey}T23:59:59.999Z`);
  const dayKeyDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0));

  const [trades, dailyPerf, journal] = await Promise.all([
    prisma.trade.findMany({
      where: { userId: user.id, tradeDate: { gte: start, lte: end } },
      include: { optionMetadata: true },
      orderBy: { tradeDate: "desc" },
    }),
    prisma.dailyPerformance.findFirst({
      where: { userId: user.id, date: dayKeyDate },
    }),
    prisma.journalEntry.findFirst({
      where: { userId: user.id, date: dayKeyDate },
    }),
  ]);

  return { trades, dailyPerf, journal };
}
