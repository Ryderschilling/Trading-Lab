import Papa from "papaparse";

export interface BrokerExecution {
  broker: string;
  activityDate: string; // YYYY-MM-DD (date-only)
  instrument: string;
  description: string | null;
  transactionType: string; // "BTO", "STC", "STO", "BTC", "BUY", "SELL"
  quantity: number; // Allow fractional quantities
  price: number;
  amount: number; // Net amount (can be negative)
  rawRowData?: Record<string, string>;
}

export interface ParsedCSVResult {
  executions: BrokerExecution[];
  warnings: string[];
}

function parseAmount(amountStr: string): number {
  if (!amountStr || amountStr.trim() === "") return 0;
  let cleaned = amountStr.replace(/,/g, "").replace(/\$/g, "").trim();

  // Parentheses mean negative in many broker exports
  if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
    cleaned = cleaned.slice(1, -1);
    const value = parseFloat(cleaned) || 0;
    return -Math.abs(value);
  }

  return parseFloat(cleaned) || 0;
}

function parsePrice(priceStr: string): number {
  if (!priceStr || priceStr.trim() === "") return 0;
  const cleaned = priceStr.replace(/,/g, "").replace(/\$/g, "").trim();
  return parseFloat(cleaned) || 0;
}

function inferAssetType(instrument: string, description: string | null): string {
  const combined = `${instrument} ${description || ""}`.toLowerCase();
  if (combined.includes("call") || combined.includes("put")) return "OPTION";
  return "STOCK";
}

function parseActivityDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === "") return null;
  const trimmed = dateStr.trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // Robinhood standard MM/DD/YYYY
  const parts = trimmed.split("/");
  if (parts.length === 3) {
    const month = parts[0].padStart(2, "0");
    const day = parts[1].padStart(2, "0");
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${year}-${month}-${day}`;
  }

  return null;
}

function detectBroker(headers: string[]): string {
  const headerStr = headers.join(" ").toLowerCase();
  if (headerStr.includes("robinhood")) return "robinhood";
  if (headers.some((h) => h.toLowerCase() === "activity date" || h.toLowerCase() === "trans code")) {
    return "robinhood";
  }
  return "unknown";
}

/**
 * Strong footer stripping:
 * - Removes blank lines
 * - Removes trailing lines where the first column isn't a date
 *   (covers Robinhood's disclaimer footer row that has extra columns)
 */
function stripTrailingNonDataLines(csvText: string): string {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== "");

  if (lines.length <= 1) return lines.join("\n");

  // Header is first line
  const header = lines[0];
  const dataLines = lines.slice(1);

  // Pop trailing lines that don't start with a date in first column
  // Robinhood data rows start like: "1/27/2026",...
  // Footer row starts like: "","","",...
  while (dataLines.length > 0) {
    const last = dataLines[dataLines.length - 1].trim();
    const firstField = last.startsWith('"') ? last.slice(1).split('"')[0] : last.split(",")[0];
    const looksLikeDate = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(firstField.trim()) || /^\d{4}-\d{2}-\d{2}$/.test(firstField.trim());

    if (looksLikeDate) break;
    dataLines.pop();
  }

  return [header, ...dataLines].join("\n");
}

export function parseBrokerCSV(csvText: string): ParsedCSVResult {
  const warnings: string[] = [];
  const executions: BrokerExecution[] = [];

  const cleanedCsv = stripTrailingNonDataLines(csvText);

  const results = Papa.parse<Record<string, string>>(cleanedCsv, {
    header: true,
    skipEmptyLines: true,
    quoteChar: '"',
    escapeChar: '"',
    transformHeader: (header) => header.trim(),
    transform: (value) => (typeof value === "string" ? value.trim() : value),
  });

  if (results.errors.length > 0) {
    const criticalErrors = results.errors.filter((e) => e.type !== "Quotes" && e.type !== "Delimiter");
    if (criticalErrors.length > 0) {
      warnings.push(`CSV parsing warnings: ${criticalErrors.map((e) => e.message).join("; ")}`);
    }
  }

  if (!results.data || results.data.length === 0) {
    return { executions: [], warnings: ["CSV file is empty or has no valid data rows"] };
  }

  const headers = Object.keys(results.data[0] || {});
  const broker = detectBroker(headers);

  const nonTradeCodes = ["INT", "DIV", "FEE", "DEP", "WDL", "ADJ", "TRF", "COR"];
  const validTradeCodes = ["BTO", "STC", "STO", "BTC", "BUY", "SELL"];

  results.data.forEach((row, index) => {
    try {
      const instrument = (row["Instrument"] || row["instrument"] || "").toString().trim();
      const description = (row["Description"] || row["description"] || "").toString().trim() || null;
      const transCode = (row["Trans Code"] || row["trans code"] || row["TransCode"] || "").toString().trim().toUpperCase();
      const quantityStr = (row["Quantity"] || row["quantity"] || "").toString().trim();
      const priceStr = (row["Price"] || row["price"] || "").toString().trim();
      const amountStr = (row["Amount"] || row["amount"] || "").toString().trim();
      const activityDateStr = (row["Activity Date"] || row["activity date"] || row["ActivityDate"] || "").toString().trim();

      // Skip obvious non-data rows
      if (!activityDateStr) return;
      if (!instrument || instrument.trim() === "") return;
      if (transCode && nonTradeCodes.includes(transCode)) return;

      if (!transCode || !validTradeCodes.includes(transCode)) {
        warnings.push(`Row ${index + 1}: Unknown/missing transaction code "${transCode || "EMPTY"}", skipped`);
        return;
      }

      const activityDate = parseActivityDate(activityDateStr);
      if (!activityDate) {
        warnings.push(`Row ${index + 1}: Invalid Activity Date "${activityDateStr}", skipped`);
        return;
      }

      const quantity = parseFloat(quantityStr.replace(/,/g, "")) || 0;
      if (quantity <= 0) {
        warnings.push(`Row ${index + 1}: Invalid quantity "${quantityStr}", skipped`);
        return;
      }

      const price = parsePrice(priceStr);
      const amount = parseAmount(amountStr);

      let finalPrice = price;
      if (price === 0 && amount !== 0 && quantity > 0) {
        finalPrice = Math.abs(amount) / quantity;
      }

      inferAssetType(instrument, description);

      const rawRowData: Record<string, string> = {};
      Object.keys(row).forEach((key) => {
        rawRowData[key] = row[key];
      });

      executions.push({
        broker,
        activityDate,
        instrument: instrument.toUpperCase(),
        description,
        transactionType: transCode,
        quantity,
        price: finalPrice,
        amount,
        rawRowData,
      });
    } catch (error) {
      warnings.push(`Row ${index + 1}: Error parsing row - ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });

  if (executions.length === 0) {
    warnings.push("No valid trade executions found in CSV. Please check the file format matches the standard broker export format.");
  }

  return { executions, warnings };
}
