"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBrokerCSV } from "@/lib/utils/brokerCSVParser";
import { buildTradesFromExecutions } from "@/lib/utils/tradeAggregation";
import { recalculateStats } from "@/lib/actions/trades";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export interface UploadExecutionsResult {
  success: boolean;
  tradesCreated: number;
  warnings: string[];
  errors: string[];
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

/**
 * Convert YYYY-MM-DD (date-only) into a stable Date:
 * UTC midday avoids timezone rollover bugs when stored as DateTime.
 */
function dateFromYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/** Stable YYYY-MM-DD from a Date using UTC components */
function ymdFromDateUTC(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

export async function uploadBrokerExecutions(csvText: string): Promise<UploadExecutionsResult> {
  const uploadId = crypto.randomUUID();

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, tradesCreated: 0, warnings: [], errors: ["Unauthorized"] };
  }

  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    const parseResult = parseBrokerCSV(csvText);
    warnings.push(...parseResult.warnings);

    if (parseResult.executions.length === 0) {
      return { success: true, tradesCreated: 0, warnings, errors: [] };
    }

    const existingTrades = await prisma.trade.findMany({
      where: { userId: user.id },
      select: { tradeDate: true, ticker: true, quantity: true, entryPrice: true, exitPrice: true },
    });

    const existingTradeKeys = new Set(
      existingTrades.map((t) => {
        const dateStr = ymdFromDateUTC(t.tradeDate);
        return `${dateStr}|${t.ticker}|${t.quantity}|${t.entryPrice}|${t.exitPrice || 0}`;
      })
    );

    await prisma.brokerExecution.createMany({
      data: parseResult.executions.map((e) => ({
        userId: user.id,
        uploadId,
        broker: e.broker,
        activityDate: dateFromYMD(e.activityDate), // stable
        instrument: e.instrument,
        description: e.description,
        transactionType: e.transactionType,
        quantity: e.quantity,
        price: e.price,
        amount: e.amount,
        rawRowData: e.rawRowData ? JSON.stringify(e.rawRowData) : null,
      })),
    });

    const storedExecutions = await prisma.brokerExecution.findMany({
      where: { userId: user.id },
      orderBy: { activityDate: "asc" },
    });

    storedExecutions.sort((a, b) => {
      const diff = a.activityDate.getTime() - b.activityDate.getTime();
      if (diff !== 0) return diff;
      return a.id.localeCompare(b.id);
    });

    const trades = buildTradesFromExecutions(storedExecutions);

    let tradesCreated = 0;
    const tradeDates = new Set<string>();

    for (const trade of trades) {
      if (!trade.exitPrice || trade.totalReturn === 0) continue;

      const dateStr = ymdFromDateUTC(trade.entryDate);
      const tradeKey = `${dateStr}|${trade.ticker}|${trade.quantity}|${trade.entryPrice}|${trade.exitPrice || 0}`;

      if (existingTradeKeys.has(tradeKey)) continue;

      await prisma.trade.create({
        data: {
          userId: user.id,
          tradeDate: trade.entryDate, // already UTC-midday
          ticker: trade.ticker,
          assetType: trade.assetType,
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          quantity: trade.quantity,
          totalInvested: trade.totalInvested,
          totalReturn: trade.totalReturn,
          percentReturn: trade.percentReturn,
          notes: "Imported from broker CSV",
        },
      });

      tradesCreated++;
      tradeDates.add(dateStr);
    }

    if (tradeDates.size > 0) {
      for (const dateStr of Array.from(tradeDates)) {
        await recalculateStats(user.id, dateFromYMD(dateStr));
      }
    }

    const { recalculateAggregatedStats } = await import("@/lib/actions/trades");
    await recalculateAggregatedStats(user.id);

    revalidatePath("/trades");
    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    revalidatePath("/analytics");
    revalidatePath("/goals");

    return { success: true, tradesCreated, warnings, errors };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, tradesCreated: 0, warnings, errors: [message] };
  }
}
