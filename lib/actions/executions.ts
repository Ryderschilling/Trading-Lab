"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBrokerCSV, BrokerExecution as ParsedExecution } from "@/lib/utils/brokerCSVParser";
import { buildTradesFromExecutions } from "@/lib/utils/tradeAggregation";
import { recalculateStats } from "@/lib/actions/trades";
import { revalidatePath } from "next/cache";

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

    // Aggregate executions into trades
    const aggregatedTrades = buildTradesFromExecutions(storedExecutions);

    // Create Trade records from aggregated trades
    let tradesCreated = 0;
    const tradeDates: Date[] = [];

    for (const aggregatedTrade of aggregatedTrades) {
      try {
        // Only create trades for closed positions (per original behavior)
        // Open positions can be tracked via executions but don't create trade records
        if (aggregatedTrade.status !== "CLOSED") {
          continue;
        }

        // Create trade record
        const trade = await prisma.trade.create({
          data: {
            userId: user.id,
            tradeDate: aggregatedTrade.tradeDate,
            tradeTime: null,
            ticker: aggregatedTrade.ticker,
            assetType: aggregatedTrade.assetType === "Call" ? "Call" : aggregatedTrade.assetType === "Put" ? "Put" : "Stock",
            entryPrice: aggregatedTrade.entryPrice,
            exitPrice: aggregatedTrade.exitPrice,
            quantity: Math.round(aggregatedTrade.quantity),
            contracts: aggregatedTrade.contracts ? Math.round(aggregatedTrade.contracts) : null,
            totalInvested: aggregatedTrade.totalInvested,
            totalReturn: aggregatedTrade.totalReturn,
            percentReturn: aggregatedTrade.percentReturn,
            notes: "Imported from broker CSV",
            ...(aggregatedTrade.assetType !== "Stock" && aggregatedTrade.expirationDate && aggregatedTrade.strikePrice && {
              optionMetadata: {
                create: {
                  expirationDate: aggregatedTrade.expirationDate,
                  strikePrice: aggregatedTrade.strikePrice,
                  is0DTE: aggregatedTrade.expirationDate && 
                    Math.floor((aggregatedTrade.expirationDate.getTime() - aggregatedTrade.entryDate.getTime()) / (1000 * 60 * 60 * 24)) === 0,
                  isWeekly: false,
                  isMonthly: false,
                  timeOfDay: getTimeOfDay(aggregatedTrade.entryDate),
                  dayOfWeek: getDayOfWeek(aggregatedTrade.entryDate),
                },
              },
            }),
          },
        });

        tradesCreated++;
        tradeDates.push(aggregatedTrade.tradeDate);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        errors.push(`Failed to create trade for ${aggregatedTrade.ticker}: ${errorMsg}`);
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

