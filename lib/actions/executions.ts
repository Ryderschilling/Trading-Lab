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

    // 2. Fetch existing trades for deduplication
    const existingTrades = await prisma.trade.findMany({
      where: { userId: user.id },
      select: {
        tradeDate: true,
        ticker: true,
        quantity: true,
        entryPrice: true,
        exitPrice: true,
      },
    });

    // Create a set of existing trade keys for fast lookup
    const existingTradeKeys = new Set(
      existingTrades.map((t: { tradeDate: Date; ticker: string; quantity: number; entryPrice: number; exitPrice: number | null }) => {
        const dateStr = new Date(t.tradeDate).toISOString().slice(0, 10);
        return `${dateStr}|${t.ticker}|${t.quantity}|${t.entryPrice}|${t.exitPrice || 0}`;
      })
    );

    // 3. Store NEW executions from CSV (append, don't delete)
    // Parse dates locally to avoid timezone shifting (activityDate is YYYY-MM-DD string)
    await prisma.brokerExecution.createMany({
      data: parseResult.executions.map(e => {
        // Parse YYYY-MM-DD format locally
        const [year, month, day] = e.activityDate.split("-").map(Number);
        const activityDate = new Date(year, month - 1, day);
        
        return {
          userId: user.id,
          uploadId,
          broker: e.broker,
          activityDate,
          instrument: e.instrument,
          description: e.description,
          transactionType: e.transactionType,
          quantity: e.quantity,
          price: e.price,
          amount: e.amount,
          rawRowData: e.rawRowData ? JSON.stringify(e.rawRowData) : null,
        };
      }),
    });

    // 4. Fetch ALL executions (existing + new) for aggregation
    const storedExecutions = await prisma.brokerExecution.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        activityDate: "asc",
      },
    });

    // Ensure chronological order before aggregation (important for correct pairing)
    storedExecutions.sort((a: { activityDate: Date; id: string }, b: { activityDate: Date; id: string }) => {
      const aTime = new Date(a.activityDate).getTime();
      const bTime = new Date(b.activityDate).getTime();
      if (aTime !== bTime) return aTime - bTime;
      // tie-breaker: use prisma id or createdAt if available
      return a.id.localeCompare(b.id);
    });
  
    const trades = buildTradesFromExecutions(storedExecutions);

    let tradesCreated = 0;
    const tradeDates = new Set<string>();

    // 5. Persist aggregated trades, skipping duplicates
    for (const trade of trades) {
      if (!trade.exitPrice || trade.totalReturn === 0) {
        // Skip open or invalid trades
        continue;
      }

      // Check for duplicates before inserting
      const dateStr = trade.entryDate.toISOString().slice(0, 10);
      const tradeKey = `${dateStr}|${trade.ticker}|${trade.quantity}|${trade.entryPrice}|${trade.exitPrice || 0}`;
      
      if (existingTradeKeys.has(tradeKey)) {
        // Skip duplicate trade
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
      tradeDates.add(dateStr);
    }

    // 6. Recalculate stats for all affected dates (new trades only)
    if (tradeDates.size > 0) {
      for (const dateStr of Array.from(tradeDates)) {
        const [year, month, day] = dateStr.split("-").map(Number);
        await recalculateStats(user.id, new Date(year, month - 1, day));
      }
    }
    
    // Also recalculate aggregated stats
    const { recalculateAggregatedStats } = await import("@/lib/actions/trades");
    await recalculateAggregatedStats(user.id);

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