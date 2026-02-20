"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type DailyRow = {
  date: string; // YYYY-MM-DD
  netPnl: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  totalVolume: number;
};

type MonthlyRow = {
  year: number;
  month: number; // 1-12
  netPnl: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  greenDays: number;
  redDays: number;
  bestDay: number | null;
  worstDay: number | null;
};

type ProjectionSummary = {
  horizonDays: number;
  expected: number;
  median: number;
  p10: number;
  p90: number;
  probProfit: number; // 0..1
};

type ProjectionBandPoint = {
  day: number;
  p10: number;
  p50: number;
  p90: number;
};

type JournalRow = {
  date: string; // YYYY-MM-DD
  sleepDuration: string | null;
  sleepQuality: string | null;
  caffeine: string | null;
  tradingQuality: string | null;
  revengeTrading: string | null;
  overtrading: string | null;
  distractions: string | null;
};

type JournalInsightGroup = {
  label: string;
  value: string;
  n: number;
  avgPnl: number;
  greenRate: number; // 0..1
};

type JournalInsights = {
  tradingQuality: JournalInsightGroup[];
  revengeTrading: JournalInsightGroup[];
  overtrading: JournalInsightGroup[];
  sleepQuality: JournalInsightGroup[];
  caffeine: JournalInsightGroup[];
};

function toISODateOnlyUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function quantile(sortedNumsAsc: number[], q: number): number {
  if (sortedNumsAsc.length === 0) return 0;
  const pos = (sortedNumsAsc.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sortedNumsAsc[base + 1] === undefined) return sortedNumsAsc[base];
  return sortedNumsAsc[base] + rest * (sortedNumsAsc[base + 1] - sortedNumsAsc[base]);
}

// Small deterministic PRNG (Mulberry32)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashToSeed(input: string): number {
  // Simple FNV-1a-ish
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function buildEquityAndDrawdown(daily: DailyRow[]) {
  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;
  let maxDDStartIndex = 0;
  let maxDDEndIndex = 0;

  // Track drawdown duration
  let inDrawdown = false;
  let ddStartIndex = 0;
  let maxDDDuration = 0;
  let maxDDDurationStartIndex = 0;
  let maxDDDurationEndIndex = 0;

  const curve = daily.map((d, idx) => {
    equity += d.netPnl;

    if (equity > peak) {
      peak = equity;
      // recover
      if (inDrawdown) {
        const duration = idx - ddStartIndex;
        if (duration > maxDDDuration) {
          maxDDDuration = duration;
          maxDDDurationStartIndex = ddStartIndex;
          maxDDDurationEndIndex = idx;
        }
        inDrawdown = false;
      }
    } else {
      if (!inDrawdown) {
        inDrawdown = true;
        ddStartIndex = idx;
      }
    }

    const drawdown = equity - peak; // negative or 0
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
      maxDDStartIndex = ddStartIndex;
      maxDDEndIndex = idx;
    }

    return {
      date: d.date,
      equity,
      drawdown,
    };
  });

  // If ending in drawdown, finalize duration
  if (inDrawdown) {
    const duration = daily.length - 1 - ddStartIndex;
    if (duration > maxDDDuration) {
      maxDDDuration = duration;
      maxDDDurationStartIndex = ddStartIndex;
      maxDDDurationEndIndex = daily.length - 1;
    }
  }

  return {
    curve,
    maxDrawdownAbs: Math.abs(maxDrawdown),
    maxDrawdown,
    maxDrawdownWindow:
      daily.length > 0
        ? {
            start: daily[maxDDStartIndex]?.date ?? null,
            end: daily[maxDDEndIndex]?.date ?? null,
          }
        : { start: null, end: null },
    maxDrawdownDurationDays: maxDDDuration,
    maxDrawdownDurationWindow:
      daily.length > 0
        ? {
            start: daily[maxDDDurationStartIndex]?.date ?? null,
            end: daily[maxDDDurationEndIndex]?.date ?? null,
          }
        : { start: null, end: null },
  };
}

function computeProjection(
  dailyPnls: number[],
  horizonDays: number,
  sims: number,
  rng: () => number
): { summary: ProjectionSummary; band: ProjectionBandPoint[] } {
  if (dailyPnls.length === 0) {
    return {
      summary: {
        horizonDays,
        expected: 0,
        median: 0,
        p10: 0,
        p90: 0,
        probProfit: 0,
      },
      band: Array.from({ length: horizonDays }, (_, i) => ({
        day: i + 1,
        p10: 0,
        p50: 0,
        p90: 0,
      })),
    };
  }

  const paths: number[][] = [];
  const finals: number[] = [];

  for (let s = 0; s < sims; s++) {
    let cum = 0;
    const path: number[] = [];
    for (let d = 0; d < horizonDays; d++) {
      const idx = Math.floor(rng() * dailyPnls.length);
      cum += dailyPnls[idx] ?? 0;
      path.push(cum);
    }
    paths.push(path);
    finals.push(cum);
  }

  const finalsSorted = [...finals].sort((a, b) => a - b);
  const expected = finals.reduce((a, b) => a + b, 0) / finals.length;
  const med = quantile(finalsSorted, 0.5);
  const p10 = quantile(finalsSorted, 0.1);
  const p90 = quantile(finalsSorted, 0.9);
  const probProfit = finals.filter((x) => x > 0).length / finals.length;

  const band: ProjectionBandPoint[] = [];
  for (let day = 0; day < horizonDays; day++) {
    const dayVals = paths.map((p) => p[day] ?? 0).sort((a, b) => a - b);
    band.push({
      day: day + 1,
      p10: quantile(dayVals, 0.1),
      p50: quantile(dayVals, 0.5),
      p90: quantile(dayVals, 0.9),
    });
  }

  return {
    summary: {
      horizonDays,
      expected,
      median: med,
      p10,
      p90,
      probProfit,
    },
    band,
  };
}

function groupJournalInsights(
  label: string,
  rows: { value: string; pnl: number }[]
): JournalInsightGroup[] {
  const map = new Map<string, { n: number; sum: number; green: number }>();
  for (const r of rows) {
    const key = r.value;
    const cur = map.get(key) ?? { n: 0, sum: 0, green: 0 };
    cur.n += 1;
    cur.sum += r.pnl;
    if (r.pnl > 0) cur.green += 1;
    map.set(key, cur);
  }

  const groups = Array.from(map.entries()).map(([value, v]) => ({
    label,
    value,
    n: v.n,
    avgPnl: v.n > 0 ? v.sum / v.n : 0,
    greenRate: v.n > 0 ? v.green / v.n : 0,
  }));

  groups.sort((a, b) => (b.n - a.n) || (b.avgPnl - a.avgPnl));
  return groups;
}

export async function getPerformanceCenterData() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!process.env.DATABASE_URL) return null;

  const [dailyPerfRaw, monthlyPerfRaw, stats] = await Promise.all([
    prisma.dailyPerformance.findMany({
      where: { userId: user.id },
      orderBy: { date: "asc" },
    }),
    prisma.monthlyPerformance.findMany({
      where: { userId: user.id },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    }),
    prisma.aggregatedStats.findUnique({ where: { userId: user.id } }),
  ]);

  if (!stats) return null;

  // Fallback: if performance tables are empty (older data), derive series from trades (read-only).
  // This avoids returning an empty Performance Center when AggregatedStats exists but daily/monthly
  // tables haven't been populated yet.
  let dailyPerf = dailyPerfRaw;
  let monthlyPerf = monthlyPerfRaw;

  if (dailyPerf.length === 0 && (stats.totalTrades ?? 0) > 0) {
    const trades = await prisma.trade.findMany({
      where: {
        userId: user.id,
        exitPrice: { not: null },
      },
      select: { tradeDate: true, totalReturn: true, totalInvested: true },
      orderBy: { tradeDate: "asc" },
    });

    const byDate = new Map<
      string,
      {
        netPnl: number;
        tradeCount: number;
        winCount: number;
        lossCount: number;
        totalVolume: number;
      }
    >();

    for (const t of trades) {
      const key = toISODateOnlyUTC(t.tradeDate);
      const cur =
        byDate.get(key) ??
        { netPnl: 0, tradeCount: 0, winCount: 0, lossCount: 0, totalVolume: 0 };

      const pnl = t.totalReturn ?? 0;
      cur.netPnl += pnl;
      cur.tradeCount += 1;
      if (pnl > 0) cur.winCount += 1;
      if (pnl < 0) cur.lossCount += 1;
      cur.totalVolume += t.totalInvested ?? 0;
      byDate.set(key, cur);
    }

    // Shape compatible with DailyPerformance fields we read below.
    // @ts-expect-error - we only read these fields
    dailyPerf = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({
        date: new Date(`${date}T00:00:00.000Z`),
        netPnl: v.netPnl,
        tradeCount: v.tradeCount,
        winCount: v.winCount,
        lossCount: v.lossCount,
        totalVolume: v.totalVolume,
      }));
  }

  if (monthlyPerf.length === 0 && dailyPerf.length > 0) {
    const byMonth = new Map<
      string,
      {
        year: number;
        month: number;
        netPnl: number;
        tradeCount: number;
        winCount: number;
        lossCount: number;
        greenDays: number;
        redDays: number;
        bestDay: number | null;
        worstDay: number | null;
      }
    >();

    // We approximate monthly trade counts/wins/losses using daily aggregates.
    // This is accurate when DailyPerformance exists; when derived, it matches the derived series.
    for (const d of dailyPerf as any[]) {
      const iso = toISODateOnlyUTC(d.date);
      const [y, m] = iso.split("-").map(Number);
      const key = `${y}-${String(m).padStart(2, "0")}`;

      const cur =
        byMonth.get(key) ??
        {
          year: y,
          month: m,
          netPnl: 0,
          tradeCount: 0,
          winCount: 0,
          lossCount: 0,
          greenDays: 0,
          redDays: 0,
          bestDay: null,
          worstDay: null,
        };

      const pnl = d.netPnl ?? 0;
      cur.netPnl += pnl;
      cur.tradeCount += d.tradeCount ?? 0;
      cur.winCount += d.winCount ?? 0;
      cur.lossCount += d.lossCount ?? 0;
      if (pnl > 0) cur.greenDays += 1;
      if (pnl < 0) cur.redDays += 1;
      cur.bestDay = cur.bestDay === null ? pnl : Math.max(cur.bestDay, pnl);
      cur.worstDay = cur.worstDay === null ? pnl : Math.min(cur.worstDay, pnl);
      byMonth.set(key, cur);
    }

    // Shape compatible with MonthlyPerformance fields we read below.
    // @ts-expect-error - we only read these fields
    monthlyPerf = Array.from(byMonth.values())
      .sort((a, b) => (a.year - b.year) || (a.month - b.month))
      .map((m) => ({
        userId: user.id,
        year: m.year,
        month: m.month,
        netPnl: m.netPnl,
        tradeCount: m.tradeCount,
        winCount: m.winCount,
        lossCount: m.lossCount,
        greenDays: m.greenDays,
        redDays: m.redDays,
        bestDay: m.bestDay,
        worstDay: m.worstDay,
      }));
  }

  const daily: DailyRow[] = dailyPerf.map((d: any) => ({
    date: toISODateOnlyUTC(d.date),
    netPnl: d.netPnl ?? 0,
    tradeCount: d.tradeCount ?? 0,
    winCount: d.winCount ?? 0,
    lossCount: d.lossCount ?? 0,
    totalVolume: d.totalVolume ?? 0,
  }));

  const monthly: MonthlyRow[] = monthlyPerf.map((m: any) => ({
    year: m.year,
    month: m.month,
    netPnl: m.netPnl ?? 0,
    tradeCount: m.tradeCount ?? 0,
    winCount: m.winCount ?? 0,
    lossCount: m.lossCount ?? 0,
    greenDays: m.greenDays ?? 0,
    redDays: m.redDays ?? 0,
    bestDay: m.bestDay ?? null,
    worstDay: m.worstDay ?? null,
  }));

  const pnlSeries = daily.map((d) => d.netPnl);
  const tradeCounts = daily.map((d) => d.tradeCount);
  const avgDaily =
    pnlSeries.length > 0 ? pnlSeries.reduce((a, b) => a + b, 0) / pnlSeries.length : 0;
  const medDaily = median(pnlSeries);
  const greenDays = pnlSeries.filter((x) => x > 0).length;
  const redDays = pnlSeries.filter((x) => x < 0).length;
  const flatDays = pnlSeries.filter((x) => x === 0).length;
  const greenRate = pnlSeries.length > 0 ? greenDays / pnlSeries.length : 0;
  const avgTradesPerDay =
    tradeCounts.length > 0 ? tradeCounts.reduce((a, b) => a + b, 0) / tradeCounts.length : 0;
  const bestDay = pnlSeries.length > 0 ? Math.max(...pnlSeries) : 0;
  const worstDay = pnlSeries.length > 0 ? Math.min(...pnlSeries) : 0;

  // MTD/YTD from daily series (UTC date-only stored)
  const now = new Date();
  const nowY = now.getUTCFullYear();
  const nowM = now.getUTCMonth() + 1;
  const mtd = daily
    .filter((d) => {
      const [y, m] = d.date.split("-").map(Number);
      return y === nowY && m === nowM;
    })
    .reduce((sum, d) => sum + d.netPnl, 0);
  const ytd = daily
    .filter((d) => {
      const [y] = d.date.split("-").map(Number);
      return y === nowY;
    })
    .reduce((sum, d) => sum + d.netPnl, 0);

  const equity = buildEquityAndDrawdown(daily);
  const recoveryFactor =
    equity.maxDrawdownAbs > 0 ? (stats.totalPnl ?? 0) / equity.maxDrawdownAbs : 0;

  // Volatility (daily stddev)
  const mean = avgDaily;
  const variance =
    pnlSeries.length > 1
      ? pnlSeries.reduce((s, x) => s + (x - mean) ** 2, 0) / (pnlSeries.length - 1)
      : 0;
  const dailyStd = Math.sqrt(variance);

  // Sortino-ish downside deviation
  const downside = pnlSeries.filter((x) => x < 0);
  const downsideVar =
    downside.length > 1 ? downside.reduce((s, x) => s + x ** 2, 0) / (downside.length - 1) : 0;
  const downsideDev = Math.sqrt(downsideVar);
  const sharpeLike = dailyStd > 0 ? mean / dailyStd : 0;
  const sortinoLike = downsideDev > 0 ? mean / downsideDev : 0;

  // Expectancy & breakeven
  const winRate = (stats.winRate ?? 0) / 100;
  const avgWin = stats.avgWin ?? 0;
  const avgLoss = stats.avgLoss ?? 0;
  const expectancy = winRate * avgWin - (1 - winRate) * avgLoss;
  const breakEvenWinRate = avgWin + avgLoss > 0 ? avgLoss / (avgWin + avgLoss) : 0;

  // Projections (bootstrap on daily P&L)
  const seedInput = `${user.id}:${daily[daily.length - 1]?.date ?? "none"}:${daily.length}`;
  const rng = mulberry32(hashToSeed(seedInput));
  const sims = 3000;

  const proj30 = computeProjection(pnlSeries, 30, sims, rng);
  const proj90 = computeProjection(pnlSeries, 90, sims, rng);
  const proj252 = computeProjection(pnlSeries, 252, sims, rng);

  // Tier-1 deterministic projections
  const simple30 = avgDaily * 30;
  const simple90 = avgDaily * 90;
  const simple252 = avgDaily * 252;

  // Journal entries (join by date)
  const minDate = (dailyPerf as any[])[0]?.date ?? null;
  const maxDate = (dailyPerf as any[])[(dailyPerf as any[]).length - 1]?.date ?? null;

  const journal = await prisma.journalEntry.findMany({
    where: {
      userId: user.id,
      ...(minDate && maxDate
        ? {
            date: {
              gte: minDate,
              lte: maxDate,
            },
          }
        : {}),
    },
    orderBy: { date: "asc" },
    select: {
      date: true,
      sleepDuration: true,
      sleepQuality: true,
      caffeine: true,
      tradingQuality: true,
      revengeTrading: true,
      overtrading: true,
      distractions: true,
    },
  });

  const journalRows: JournalRow[] = journal.map((j) => ({
    date: toISODateOnlyUTC(j.date),
    sleepDuration: j.sleepDuration,
    sleepQuality: j.sleepQuality,
    caffeine: j.caffeine,
    tradingQuality: j.tradingQuality,
    revengeTrading: j.revengeTrading,
    overtrading: j.overtrading,
    distractions: j.distractions,
  }));

  const dailyMap = new Map<string, DailyRow>();
  daily.forEach((d) => dailyMap.set(d.date, d));

  function pairs(field: keyof JournalRow): { value: string; pnl: number }[] {
    const out: { value: string; pnl: number }[] = [];
    for (const j of journalRows) {
      const v = j[field];
      if (!v) continue;
      const d = dailyMap.get(j.date);
      if (!d) continue;
      out.push({ value: String(v), pnl: d.netPnl });
    }
    return out;
  }

  const journalInsights: JournalInsights = {
    tradingQuality: groupJournalInsights("Trading Quality", pairs("tradingQuality")),
    revengeTrading: groupJournalInsights("Revenge Trading", pairs("revengeTrading")),
    overtrading: groupJournalInsights("Overtrading", pairs("overtrading")),
    sleepQuality: groupJournalInsights("Sleep Quality", pairs("sleepQuality")),
    caffeine: groupJournalInsights("Caffeine", pairs("caffeine")),
  };

  return {
    daily,
    monthly,
    equityCurve: equity.curve,
    drawdownMeta: {
      maxDrawdownAbs: equity.maxDrawdownAbs,
      maxDrawdownWindow: equity.maxDrawdownWindow,
      maxDrawdownDurationDays: equity.maxDrawdownDurationDays,
      maxDrawdownDurationWindow: equity.maxDrawdownDurationWindow,
      recoveryFactor,
    },
    velocity: {
      avgDaily,
      medianDaily: medDaily,
      greenDays,
      redDays,
      flatDays,
      greenRate,
      avgTradesPerDay,
      bestDay,
      worstDay,
      mtd,
      ytd,
    },
    edge: {
      expectancy,
      breakEvenWinRate,
      dailyStd,
      downsideDev,
      sharpeLike,
      sortinoLike,
    },
    projections: {
      simple: {
        d30: simple30,
        d90: simple90,
        d252: simple252,
      },
      monteCarlo: {
        d30: proj30.summary,
        d90: proj90.summary,
        d252: proj252.summary,
        band30: proj30.band,
      },
    },
    journal: {
      entries: journalRows,
      insights: journalInsights,
    },
  };
}