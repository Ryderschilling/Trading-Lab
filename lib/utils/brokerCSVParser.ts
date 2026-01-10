import Papa from "papaparse";

export interface BrokerExecution {
  broker: string;
  activityDate: string; // YYYY-MM-DD format
  instrument: string;
  description: string | null;
  transactionType: string; // "BTO", "STC", "STO", "BTC", "BUY", "SELL"
  quantity: number; // Allow fractional quantities
  price: number;
  amount: number; // Net amount (can be negative)
  rawRowData?: Record<string, string>; // Original CSV row for reference
}

export interface ParsedCSVResult {
  executions: BrokerExecution[];
  warnings: string[];
}

/**
 * Parse amount string with $ and parentheses (e.g., "$152.93" or "($126.04)")
 * Handles: "$600.98", "($600.98)", "$1,234.56", "($1,234.56)"
 */
function parseAmount(amountStr: string): number {
  if (!amountStr || amountStr.trim() === "") return 0;
  // Remove commas and dollar signs
  let cleaned = amountStr.replace(/,/g, "").replace(/\$/g, "").trim();
  
  // Check for negative values in parentheses
  if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
    cleaned = cleaned.slice(1, -1); // Remove parentheses
    const value = parseFloat(cleaned) || 0;
    return -Math.abs(value); // Ensure negative
  }
  
  return parseFloat(cleaned) || 0;
}

/**
 * Parse price string with $ (e.g., "$0.51" or "$1,234.56")
 * Handles dollar signs and commas
 */
function parsePrice(priceStr: string): number {
  if (!priceStr || priceStr.trim() === "") return 0;
  // Remove commas and dollar signs, then parse
  const cleaned = priceStr.replace(/,/g, "").replace(/\$/g, "").trim();
  return parseFloat(cleaned) || 0;
}

/**
 * Infer asset type from instrument/description
 * OPTION if Instrument contains "Call" or "Put", STOCK otherwise
 */
function inferAssetType(instrument: string, description: string | null): string {
  const combined = `${instrument} ${description || ""}`.toLowerCase();
  if (combined.includes("call") || combined.includes("put")) {
    return "OPTION";
  }
  return "STOCK";
}

/**
 * Parse date string (MM/DD/YYYY or YYYY-MM-DD) and convert to YYYY-MM-DD
 * Returns null if cannot parse
 */
function parseActivityDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === "") return null;
  
  const trimmed = dateStr.trim();
  
  // Already in YYYY-MM-DD format
  if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return trimmed;
  }
  
  // Try MM/DD/YYYY format (Robinhood standard)
  const parts = trimmed.split("/");
  if (parts.length === 3) {
    const month = parts[0].padStart(2, "0");
    const day = parts[1].padStart(2, "0");
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${year}-${month}-${day}`;
  }
  
  // Try parsing as Date object
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }
  
  return null;
}

/**
 * Detect broker from CSV headers or content
 */
function detectBroker(headers: string[], firstRow: Record<string, string>): string {
  // Check headers for broker indicators
  const headerStr = headers.join(" ").toLowerCase();
  if (headerStr.includes("robinhood")) return "robinhood";
  if (headerStr.includes("td ameritrade") || headerStr.includes("tdameritrade")) return "tdameritrade";
  if (headerStr.includes("fidelity")) return "fidelity";
  if (headerStr.includes("schwab")) return "schwab";
  if (headerStr.includes("etrade") || headerStr.includes("e-trade")) return "etrade";
  
  // Check for Robinhood-specific patterns
  if (headers.some(h => h.toLowerCase() === "activity date" || h.toLowerCase() === "trans code")) {
    return "robinhood";
  }
  
  // Default to "unknown" if cannot detect
  return "unknown";
}

/**
 * Parse broker CSV and return executions (no trade pairing, no interpretation)
 * Returns { executions: BrokerExecution[], warnings: string[] }
 * Never throws errors - all issues are returned as warnings
 */
export function parseBrokerCSV(csvText: string): ParsedCSVResult {
  const warnings: string[] = [];
  const executions: BrokerExecution[] = [];
  
  // Split into lines to check for terms row at the end
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  
  // Remove last row if it looks like terms/conditions (doesn't have standard columns)
  if (lines.length > 1) {
    const lastLine = lines[lines.length - 1].toLowerCase();
    if (lastLine.includes("terms") || lastLine.includes("condition") || 
        lastLine.includes("disclaimer") || !lastLine.includes(",")) {
      lines.pop();
    }
  }
  
  const cleanedCsv = lines.join('\n');
  
  const results = Papa.parse<Record<string, string>>(cleanedCsv, {
    header: true,
    skipEmptyLines: true,
    quoteChar: '"',
    escapeChar: '"',
    newline: '\n',
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });

  // Log parsing errors as warnings
  if (results.errors.length > 0) {
    const criticalErrors = results.errors.filter(e => e.type !== "Quotes" && e.type !== "Delimiter");
    if (criticalErrors.length > 0) {
      warnings.push(`CSV parsing warnings: ${criticalErrors.map(e => e.message).join("; ")}`);
    }
  }

  if (!results.data || results.data.length === 0) {
    return { executions: [], warnings: ["CSV file is empty or has no valid data rows"] };
  }

  // Detect broker from headers
  const headers = Object.keys(results.data[0] || {});
  const broker = detectBroker(headers, results.data[0] || {});
  
  console.log(`Parsed ${results.data.length} rows from CSV (broker: ${broker})`);

  // Define non-trade transaction codes to ignore
  const nonTradeCodes = ["INT", "DIV", "FEE", "DEP", "WDL", "ADJ", "TRF", "COR"];
  
  // Process each row as a potential execution
  results.data.forEach((row, index) => {
    try {
      // Get columns - handle case sensitivity
      const instrument = (row["Instrument"] || row["instrument"] || "").toString().trim();
      const description = (row["Description"] || row["description"] || "").toString().trim() || null;
      const transCode = (row["Trans Code"] || row["trans code"] || row["TransCode"] || "").toString().trim().toUpperCase();
      const quantityStr = (row["Quantity"] || row["quantity"] || "").toString().trim();
      const priceStr = (row["Price"] || row["price"] || "").toString().trim();
      const amountStr = (row["Amount"] || row["amount"] || "").toString().trim();
      const activityDateStr = (row["Activity Date"] || row["activity date"] || row["ActivityDate"] || "").toString().trim();

      // Skip rows with missing critical fields (but log as warning)
      if (!activityDateStr) {
        warnings.push(`Row ${index + 1}: Missing Activity Date, skipped`);
        return;
      }

      if (!instrument || instrument.trim() === "") {
        // This might be a fee/interest row - skip silently if it's a known non-trade code
        if (transCode && nonTradeCodes.includes(transCode)) {
          return; // Ignore non-trade rows silently
        }
        warnings.push(`Row ${index + 1}: Missing Instrument, skipped`);
        return;
      }

      // Skip non-trade transaction codes (fees, dividends, interest, etc.)
      if (transCode && nonTradeCodes.includes(transCode)) {
        return; // Ignore non-trade rows silently
      }

      // Validate transaction type - must be a trade code
      const validTradeCodes = ["BTO", "STC", "STO", "BTC", "BUY", "SELL"];
      if (!transCode || !validTradeCodes.includes(transCode)) {
        if (transCode) {
          warnings.push(`Row ${index + 1}: Unknown transaction code "${transCode}", skipped`);
        } else {
          warnings.push(`Row ${index + 1}: Missing transaction code, skipped`);
        }
        return;
      }

      // Parse activity date (broker-driven inference)
      const activityDate = parseActivityDate(activityDateStr);
      if (!activityDate) {
        warnings.push(`Row ${index + 1}: Invalid Activity Date "${activityDateStr}", skipped`);
        return;
      }

      // Parse numeric values (allow fractional quantities)
      const quantity = parseFloat(quantityStr.replace(/,/g, "")) || 0;
      const price = parsePrice(priceStr);
      const amount = parseAmount(amountStr);

      // Skip if quantity is zero or negative (invalid transaction)
      if (quantity <= 0) {
        warnings.push(`Row ${index + 1}: Invalid quantity "${quantityStr}", skipped`);
        return;
      }

      // If price is zero but amount isn't, calculate price from amount/quantity
      let finalPrice = price;
      if (price === 0 && amount !== 0 && quantity > 0) {
        finalPrice = Math.abs(amount) / quantity;
      }

      // Infer asset type from instrument/description (broker-driven inference only)
      const assetType = inferAssetType(instrument, description);
      
      // Store original row data for reference
      const rawRowData: Record<string, string> = {};
      Object.keys(row).forEach(key => {
        rawRowData[key] = row[key];
      });

      const execution: BrokerExecution = {
        broker,
        activityDate,
        instrument: instrument.toUpperCase(),
        description,
        transactionType: transCode,
        quantity, // Allow fractional quantities
        price: finalPrice,
        amount, // Can be negative
        rawRowData,
      };

      executions.push(execution);
    } catch (error) {
      warnings.push(`Row ${index + 1}: Error parsing row - ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });

  // Never throw - always return result with warnings
  if (executions.length === 0) {
    warnings.push("No valid trade executions found in CSV. Please check the file format matches the standard broker export format.");
  } else {
    console.log(`Successfully parsed ${executions.length} executions from CSV`);
  }

  return { executions, warnings };
}
