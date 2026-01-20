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

export async function uploadBrokerExecutions(
csvText: string
): Promise<UploadExecutionsResult> {
  const uploadId = crypto.randomUUID();

  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      tradesCreated: 0,
      warnings: [],
      errors: ["Unauthorized"],
    };
  }

  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    // 1. Parse CSV
    const parseResult = parseBrokerCSV(csvText);
    warnings.push(...parseResult.warnings);

    if (parseResult.executions.length === 0) {
      return {
        success: true,
        tradesCreated: 0,
        warnings,
        errors: [],
      };
    }

    // 2. DELETE ALL EXISTING TRADES AND EXECUTIONS BEFORE IMPORT
    // This ensures CSV import REPLACES instead of APPENDS
    await prisma.trade.deleteMany({
      where: { userId: user.id },
    });

    await prisma.brokerExecution.deleteMany({
      where: { userId: user.id },
    });

    await prisma.rawCSVRow.deleteMany({
      where: { userId: user.id },
    });

    // Clear performance records (they will be recalculated from new trades)
    await prisma.dailyPerformance.deleteMany({
      where: { userId: user.id },
    });

    await prisma.monthlyPerformance.deleteMany({
      where: { userId: user.id },
    });

    // Reset aggregated stats
    await prisma.aggregatedStats.deleteMany({
      where: { userId: user.id },
    });

    // 3. Store NEW executions from CSV
    await prisma.brokerExecution.createMany({
      data: parseResult.executions.map(e => ({
        userId: user.id,
        broker: e.broker,
        activityDate: new Date(e.activityDate),
        instrument: e.instrument,
        description: e.description,
        transactionType: e.transactionType,
        quantity: e.quantity,
        price: e.price,
        amount: e.amount,
        rawRowData: e.rawRowData ? JSON.stringify(e.rawRowData) : null,
      })),
    });

    // 4. Fetch ONLY the newly stored executions for aggregation
    const storedExecutions = await prisma.brokerExecution.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        activityDate: "asc",
      },
    });

    // Ensure chronological order before aggregation (important for correct pairing)
    storedExecutions.sort((a, b) => {
      const aTime = new Date(a.activityDate).getTime();
      const bTime = new Date(b.activityDate).getTime();
      if (aTime !== bTime) return aTime - bTime;
      // tie-breaker: use prisma id or createdAt if available
      return a.id.localeCompare(b.id);
    });
  
    const trades = buildTradesFromExecutions(storedExecutions);

    let tradesCreated = 0;
    const tradeDates = new Set<string>();

    // 5. Persist ONLY aggregated trades from NEW executions
    for (const trade of trades) {
      if (!trade.exitPrice || trade.totalReturn === 0) {
        // Skip open or invalid trades
        continue;
      }

      await prisma.trade.create({
        data: {
          userId: user.id,
          tradeDate: trade.entryDate,
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
      tradeDates.add(trade.entryDate.toISOString().slice(0, 10));
    }

    // 6. Recalculate stats for all new trade dates
    if (tradeDates.size > 0) {
      for (const dateStr of Array.from(tradeDates)) {
        await recalculateStats(user.id, new Date(dateStr));
      }
    } else {
      // If no trades created, ensure stats are reset
      await recalculateStats(user.id);
    }

    // 7. Revalidate UI
    revalidatePath("/trades");
    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    revalidatePath("/analytics");
    revalidatePath("/goals");

    return {
      success: true,
      tradesCreated,
      warnings,
      errors,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      tradesCreated: 0,
      warnings,
      errors: [message],
    };
  }
}