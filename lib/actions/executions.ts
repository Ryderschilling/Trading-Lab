"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBrokerCSV, BrokerExecution as ParsedExecution } from "@/lib/utils/brokerCSVParser";
import { buildTradesFromExecutions } from "@/lib/utils/tradeAggregation";
import { recalculateStats } from "@/lib/actions/trades";
import { revalidatePath } from "next/cache";

type ExecutionRow = {
  order_id?: string
  symbol: string
  side: "BUY" | "SELL"
  quantity: number
  price: number
  timestamp: string
}

type AggregatedTrade = {
  symbol: string
  side: "LONG" | "SHORT"
  quantity: number
  entryPrice: number
  entryTime: Date
}

function aggregateExecutionsToTrades(
  rows: ExecutionRow[]
): AggregatedTrade[] {
  const groups = new Map<string, ExecutionRow[]>()

  for (const row of rows) {
    const key =
      row.order_id ??
      `${row.symbol}-${row.side}-${row.timestamp.split("T")[0]}`

    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(row)
  }

  const trades: AggregatedTrade[] = []

  for (const executions of Array.from(groups.values())) {
    const totalQty = executions.reduce(
      (sum, r) => sum + r.quantity,
      0
    )

    const weightedPrice =
      executions.reduce(
        (sum, r) => sum + r.price * r.quantity,
        0
      ) / totalQty

    const entryTime = new Date(
      Math.min(
        ...executions.map(e =>
          new Date(e.timestamp).getTime()
        )
      )
    )

    trades.push({
      symbol: executions[0].symbol,
      side: executions[0].side === "BUY" ? "LONG" : "SHORT",
      quantity: totalQty,
      entryPrice: weightedPrice,
      entryTime
    })
  }

  return trades
}

export interface UploadExecutionsResult {
  success: boolean;
  tradesCreated: number;
  warnings: string[];
  errors: string[];
}

function getTimeOfDay(tradeDate: Date): string | null {
  const hour = tradeDate.getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

function getDayOfWeek(date: Date): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getDay()];
}

/**
 * Upload broker CSV executions and create trades
 * 1. Stores executions in broker_executions table
 * 2. Aggregates executions into trades
 * 3. Persists trades to Trade table
 */
export async function uploadBrokerExecutions(csvText: string): Promise<UploadExecutionsResult> {
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
    // Parse CSV (server-side) - returns { executions, warnings }
    const parseResult = parseBrokerCSV(csvText);
    warnings.push(...parseResult.warnings);

    if (parseResult.executions.length === 0) {
      // Zero valid rows is still a successful upload (just with warnings)
      return {
        success: true,
        tradesCreated: 0,
        warnings,
        errors: [],
      };
    }

    // Store each execution
    const storedExecutions = [];
    for (const execution of parseResult.executions) {
      try {
        // Convert activityDate string to Date
        const activityDate = new Date(execution.activityDate);
        if (isNaN(activityDate.getTime())) {
          warnings.push(`Skipped execution: Invalid date ${execution.activityDate}`);
          continue;
        }

        // Store raw row data as JSON string if available
        const rawRowDataStr = execution.rawRowData 
          ? JSON.stringify(execution.rawRowData) 
          : null;

        const storedExecution = await prisma.brokerExecution.create({
          data: {
            userId: user.id,
            broker: execution.broker,
            activityDate,
            instrument: execution.instrument,
            description: execution.description,
            transactionType: execution.transactionType,
            quantity: execution.quantity,
            price: execution.price,
            amount: execution.amount,
            rawRowData: rawRowDataStr,
          },
        });

        storedExecutions.push(storedExecution);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        errors.push(`Failed to store execution for ${execution.instrument} on ${execution.activityDate}: ${errorMsg}`);
      }
    }

    // Convert parsed executions to ExecutionRow format
    const parsedRows: ExecutionRow[] = parseResult.executions.map(execution => {
      // Map transactionType to side: BTO/BTC/BUY -> BUY, STC/STO/SELL -> SELL
      const side = (execution.transactionType === "BTO" || 
                   execution.transactionType === "BTC" || 
                   execution.transactionType === "BUY") ? "BUY" : "SELL";
      
      return {
        symbol: execution.instrument,
        side: side as "BUY" | "SELL",
        quantity: execution.quantity,
        price: execution.price,
        timestamp: execution.activityDate,
      };
    });

    // Aggregate executions into trades
    const aggregatedTrades = aggregateExecutionsToTrades(parsedRows);

    // Create Trade records from aggregated trades
    let tradesCreated = 0;
    const tradeDates: Date[] = [];

    for (const aggregatedTrade of aggregatedTrades) {
      try {
        // Create trade record
        const trade = await prisma.trade.create({
          data: {
            userId: user.id,
            tradeDate: aggregatedTrade.entryTime,
            tradeTime: null,
            ticker: aggregatedTrade.symbol,
            assetType: "Stock",
            entryPrice: aggregatedTrade.entryPrice,
            exitPrice: null,
            quantity: Math.round(aggregatedTrade.quantity),
            contracts: null,
            totalInvested: aggregatedTrade.entryPrice * aggregatedTrade.quantity,
            totalReturn: 0,
            percentReturn: 0,
            notes: "Imported from broker CSV",
          },
        });

        tradesCreated++;
        tradeDates.push(aggregatedTrade.entryTime);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        errors.push(`Failed to create trade for ${aggregatedTrade.symbol}: ${errorMsg}`);
      }
    }

    // Recalculate stats for all trade dates
    for (const tradeDate of tradeDates) {
      try {
        await recalculateStats(user.id, tradeDate);
      } catch (error) {
        console.error("Error recalculating stats:", error);
      }
    }

    // Revalidate paths to refresh UI
    revalidatePath("/upload");
    revalidatePath("/trades");
    revalidatePath("/dashboard");
    revalidatePath("/calendar");
    revalidatePath("/analytics");

    return {
      success: true,
      tradesCreated,
      warnings,
      errors,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      tradesCreated: 0,
      warnings,
      errors: [`CSV upload failed: ${errorMsg}`],
    };
  }
}

