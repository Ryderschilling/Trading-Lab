"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBrokerCSV, BrokerExecution as ParsedExecution } from "@/lib/utils/brokerCSVParser";
import { revalidatePath } from "next/cache";

export interface UploadExecutionsResult {
  success: boolean;
  executionsCreated: number;
  warnings: string[];
  errors: string[];
}

/**
 * Upload broker CSV executions
 * Parses CSV server-side and stores executions (no trade pairing)
 */
export async function uploadBrokerExecutions(csvText: string): Promise<UploadExecutionsResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      executionsCreated: 0,
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
        executionsCreated: 0,
        warnings,
        errors: [],
      };
    }

    // Store each execution
    let executionsCreated = 0;
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

        await prisma.brokerExecution.create({
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

        executionsCreated++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        errors.push(`Failed to store execution for ${execution.instrument} on ${execution.activityDate}: ${errorMsg}`);
      }
    }

    // Revalidate paths to refresh UI
    revalidatePath("/upload");
    revalidatePath("/trades");

    return {
      success: true,
      executionsCreated,
      warnings,
      errors,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      executionsCreated: 0,
      warnings,
      errors: [`CSV upload failed: ${errorMsg}`],
    };
  }
}

