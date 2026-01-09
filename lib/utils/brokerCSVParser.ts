import Papa from "papaparse";

export interface BrokerTrade {
  [key: string]: string; // CSV row as key-value pairs
}

export interface ParsedTrade {
  tradeDate: string;
  tradeTime?: string;
  ticker: string;
  assetType: string;
  expirationDate?: string;
  strikePrice?: string;
  entryPrice: string;
  exitPrice?: string;
  quantity: string;
  contracts?: string;
  totalInvested?: string;
  totalReturn: string;
  percentReturn?: string;
  status?: string; // CLOSED, OPEN
  notes?: string;
}

/**
 * Parse amount string with $ and parentheses (e.g., "$152.93" or "($126.04)")
 * Handles: "$600.98", "($600.98)", "$1,234.56", "($1,234.56)"
 */
function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
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
  if (!priceStr) return 0;
  // Remove commas and dollar signs, then parse
  const cleaned = priceStr.replace(/,/g, "").replace(/\$/g, "").trim();
  return parseFloat(cleaned) || 0;
}

/**
 * Parse description to extract option details
 * Format: "SPY 12/31/2025 Put $684.00" or "SPY 12/31/2025 Call $684.00"
 */
function parseDescription(description: string): {
  ticker: string;
  expirationDate?: string;
  strikePrice?: string;
  assetType: string;
} {
  if (!description) {
    return { ticker: "", assetType: "Stock" };
  }

  // Clean up description - remove newlines and extra whitespace
  const cleaned = description.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

  // Check if it's an option (has date and strike price pattern)
  // Pattern: TICKER MM/DD/YYYY Call/Put $STRIKE
  const optionMatch = cleaned.match(/^([A-Z]+)\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(Call|Put)\s+\$?([\d,]+\.?\d*)/i);
  if (optionMatch) {
    const [, ticker, expDate, callPut, strike] = optionMatch;
    const assetType = callPut.toLowerCase() === "put" ? "Put" : "Call";
    
    // Format expiration date to YYYY-MM-DD
    const dateParts = expDate.split("/");
    if (dateParts.length === 3) {
      const year = dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2];
      const formattedDate = `${year}-${dateParts[0].padStart(2, "0")}-${dateParts[1].padStart(2, "0")}`;
      return {
        ticker: ticker.toUpperCase(),
        expirationDate: formattedDate,
        strikePrice: strike.replace(/,/g, ""),
        assetType,
      };
    }
  }

  // Check if it's a stock (just ticker, possibly with company name)
  // Pattern: TICKER or TICKER Company Name
  const stockMatch = cleaned.match(/^([A-Z]{1,5})(\s|$|,)/i);
  if (stockMatch) {
    return {
      ticker: stockMatch[1].toUpperCase(),
      assetType: "Stock",
    };
  }

  return { ticker: "", assetType: "Stock" };
}

/**
 * Maps broker CSV format (standard transaction-based format) to our trade format
 * Broker exports typically contain individual transactions (Buy/Sell), so we match pairs
 */
export function parseBrokerCSV(csvText: string): ParsedTrade[] {
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
  
  const results = Papa.parse<BrokerTrade>(cleanedCsv, {
    header: true,
    skipEmptyLines: true,
    quoteChar: '"',
    escapeChar: '"',
    newline: '\n',
    // Handle multi-line fields properly
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });

  // Log parsing errors for debugging
  if (results.errors.length > 0) {
    const criticalErrors = results.errors.filter(e => e.type !== "Quotes" && e.type !== "Delimiter");
    if (criticalErrors.length > 0) {
      console.error("CSV parsing errors:", criticalErrors);
      throw new Error(`CSV parsing failed: ${criticalErrors[0].message || "Invalid CSV format"}`);
    } else {
      // Non-critical errors (quotes, delimiters), continue
      console.warn("CSV parsing warnings:", results.errors);
    }
  }

  if (!results.data || results.data.length === 0) {
    throw new Error("CSV file is empty or has no valid data rows");
  }

  console.log(`Parsed ${results.data.length} rows from CSV`);

  // Group transactions by symbol to match buy/sell pairs
  interface Transaction {
    symbol: string;
    side: string;
    quantity: number;
    price: number;
    fees: number;
    tradeDate: string;
    tradeTime?: string;
    assetType: string;
    expirationDate?: string;
    strikePrice?: string;
    orderType: string;
  }

  const transactions: Transaction[] = results.data
    .map((row, index) => {
      try {
        // Get columns - handle case sensitivity (Instrument with capital I)
        const instrument = (row["Instrument"] || row["instrument"] || "").toString().trim();
        const description = (row["Description"] || row["description"] || "").toString().trim();
        const transCode = (row["Trans Code"] || row["trans code"] || row["TransCode"] || "").toString().trim().toUpperCase();
        const quantityStr = (row["Quantity"] || row["quantity"] || "").toString().trim();
        const priceStr = (row["Price"] || row["price"] || "").toString().trim();
        const amountStr = (row["Amount"] || row["amount"] || "").toString().trim();
        const activityDate = (row["Activity Date"] || row["activity date"] || row["ActivityDate"] || "").toString().trim();

      // Skip non-trade transactions (Interest, Transfers, Gold fees, etc.)
      // Skip if Trans Code is missing or not a trade type
      // Also skip INT (Interest), DIV (Dividend), etc.
      const validTradeCodes = ["BTO", "STC", "STO", "BTC", "BUY", "SELL"];
      const invalidCodes = ["INT", "DIV", "FEE"];
      
      if (!transCode || 
          (!validTradeCodes.includes(transCode) || invalidCodes.includes(transCode))) {
        return null;
      }

      // Skip rows with empty Instrument (like "Gold Subscription Fee", "Interest Payment", etc.)
      // These are not trades and will cause errors
      if (!instrument || instrument.trim() === "") {
        return null;
      }

      // Parse description to get ticker and option details
      const descInfo = parseDescription(description);
      if (!descInfo.ticker && instrument) {
        descInfo.ticker = instrument.toUpperCase();
      }
      
      // Final check: must have a ticker to proceed
      if (!descInfo.ticker || descInfo.ticker.trim() === "") {
        return null; // Skip rows without ticker
      }

      // Parse numeric values with validation
      const quantity = parseFloat(quantityStr.replace(/,/g, "")) || 0;
      const price = parsePrice(priceStr);
      const amount = parseAmount(amountStr);
      
      // Skip if quantity is missing or zero (e.g., Interest Payment rows)
      if (!quantityStr || quantityStr.trim() === "" || quantity === 0) {
        return null;
      }
      
      // Calculate fees from amount difference (Amount = Price * Quantity - Fees)
      const expectedAmount = price * quantity;
      const fees = Math.abs(expectedAmount - Math.abs(amount));

      // Skip if both price and amount are zero (invalid transaction)
      if (price === 0 && amount === 0) {
        return null;
      }
      
      // If price is zero but amount isn't, calculate price from amount/quantity
      let finalPrice = price;
      if (price === 0 && amount !== 0 && quantity > 0) {
        finalPrice = Math.abs(amount) / quantity;
      }
      
      if (finalPrice === 0) {
        return null; // Still invalid
      }

      // Determine side from Trans Code
      // BTO (Buy to Open) = Buy (opening a position)
      // BTC (Buy to Close) = Buy (closing a short position)
      // STC (Sell to Close) = Sell (closing a long position)
      // STO (Sell to Open) = Sell (opening a short position)
      // BUY = Buy
      // SELL = Sell
      const isBuy = transCode === "BTO" || transCode === "BTC" || transCode === "BUY";
      const isSell = transCode === "STC" || transCode === "STO" || transCode === "SELL";
      const side = isBuy ? "buy" : (isSell ? "sell" : null);
      
      // Skip if we can't determine the side
      if (!side) {
        return null;
      }

      // Parse date (MM/DD/YYYY format) and convert to YYYY-MM-DD
      let tradeDate = activityDate;
      if (tradeDate && !tradeDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Try MM/DD/YYYY format first (Robinhood standard)
        const parts = tradeDate.split("/");
        if (parts.length === 3) {
          const month = parts[0].padStart(2, "0");
          const day = parts[1].padStart(2, "0");
          const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          tradeDate = `${year}-${month}-${day}`;
        } else {
          // Try parsing as Date object
          const parsed = new Date(tradeDate);
          if (!isNaN(parsed.getTime())) {
            tradeDate = parsed.toISOString().split("T")[0];
          } else {
            // Fallback to today if can't parse
            tradeDate = new Date().toISOString().split("T")[0];
          }
        }
      }

      if (!tradeDate || !tradeDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        tradeDate = new Date().toISOString().split("T")[0];
      }

      const transaction: Transaction = {
        symbol: descInfo.ticker,
        side,
        quantity: Math.abs(quantity),
        price: Math.abs(finalPrice),
        fees,
        tradeDate,
        assetType: descInfo.assetType,
        orderType: transCode,
      };
      
      if (descInfo.expirationDate) {
        transaction.expirationDate = descInfo.expirationDate;
      }
      
      if (descInfo.strikePrice) {
        transaction.strikePrice = descInfo.strikePrice;
      }
      
        return transaction;
      } catch (error) {
        console.warn(`Error parsing row ${index + 1}:`, error, row);
        return null;
      }
    })
    .filter((t): t is Transaction => t !== null && t.symbol.length > 0);

  // Track positions by position key (symbol, asset type, strike, expiration)
  // Only create trades when positions are fully closed
  interface Position {
    symbol: string;
    assetType: string;
    strikePrice?: string;
    expirationDate?: string;
    quantity: number; // Current open quantity (positive = long, negative = short)
    totalCost: number; // Total cost basis (sum of all buys)
    totalProceeds: number; // Total sell proceeds (sum of all sells)
    firstBuyDate: string; // Date of first buy
    lastActivityDate: string; // Date of last activity
  }

  const positions = new Map<string, Position>();

  for (const trans of transactions) {
    // Create position key: symbol-assetType-strike-expiration
    // For stocks: "AAPL-Stock"
    // For options: "AAPL-Call-150-2025-12-31" or "AAPL-Put-150-2025-12-31"
    const assetTypeKey = trans.assetType; // "Stock", "Call", or "Put" - treat PUTS same as CALLS for position tracking
    const positionKey = trans.assetType === "Stock" 
      ? `${trans.symbol}-${assetTypeKey}`
      : `${trans.symbol}-${assetTypeKey}-${trans.strikePrice || ""}-${trans.expirationDate || ""}`;

    if (!positions.has(positionKey)) {
      positions.set(positionKey, {
        symbol: trans.symbol,
        assetType: trans.assetType,
        strikePrice: trans.strikePrice,
        expirationDate: trans.expirationDate,
        quantity: 0,
        totalCost: 0,
        totalProceeds: 0,
        firstBuyDate: trans.tradeDate,
        lastActivityDate: trans.tradeDate,
      });
    }

    const position = positions.get(positionKey)!;

    // Calculate cost/proceeds - for options, multiply by 100 for contracts
    const multiplier = trans.assetType === "Stock" ? 1 : 100;
    const cost = trans.price * trans.quantity * multiplier + trans.fees;

    if (trans.side === "buy") {
      // Buying adds to position quantity and cost basis
      position.quantity += trans.quantity;
      position.totalCost += cost;
    } else if (trans.side === "sell") {
      // Selling reduces position quantity and adds to proceeds
      position.quantity -= trans.quantity;
      position.totalProceeds += cost;
    }

    // Update last activity date
    if (new Date(trans.tradeDate) > new Date(position.lastActivityDate)) {
      position.lastActivityDate = trans.tradeDate;
    }
  }

  // Create trades for closed positions (quantity === 0) and open positions (quantity !== 0)
  const trades: ParsedTrade[] = [];

  for (const [key, position] of Array.from(positions.entries())) {
    // Find transactions for this position to calculate quantities
    const positionTransactions = transactions.filter(t => {
      const tKey = t.assetType === "Stock"
        ? `${t.symbol}-${t.assetType}`
        : `${t.symbol}-${t.assetType}-${t.strikePrice || ""}-${t.expirationDate || ""}`;
      return tKey === key;
    });
    
    const multiplier = position.assetType === "Stock" ? 1 : 100;
    
    if (position.quantity === 0 && position.totalCost > 0) {
      // Position is fully closed, create trade
      const totalReturn = position.totalProceeds - position.totalCost;
      const percentReturn = position.totalCost > 0 ? (totalReturn / position.totalCost) * 100 : 0;
      
      // Calculate actual closed quantity: sum of all buy quantities
      const buyQuantity = positionTransactions
        .filter(t => t.side === "buy")
        .reduce((sum, t) => sum + t.quantity, 0);
      const sellQuantity = positionTransactions
        .filter(t => t.side === "sell")
        .reduce((sum, t) => sum + t.quantity, 0);
      
      // The closed quantity is the minimum of buy and sell quantities
      const closedQuantity = Math.min(buyQuantity, sellQuantity);

      if (closedQuantity > 0) {
        // Calculate average prices based on the actual closed quantity
        const avgEntryPrice = position.totalCost / (closedQuantity * multiplier);
        const avgExitPrice = position.totalProceeds / (closedQuantity * multiplier);

        trades.push({
          tradeDate: position.firstBuyDate,
          ticker: position.symbol,
          assetType: position.assetType,
          expirationDate: position.expirationDate,
          strikePrice: position.strikePrice,
          entryPrice: avgEntryPrice.toFixed(4),
          exitPrice: avgExitPrice.toFixed(4),
          quantity: closedQuantity.toFixed(0),
          contracts: position.assetType !== "Stock" ? closedQuantity.toFixed(0) : undefined,
          totalInvested: position.totalCost.toFixed(2),
          totalReturn: totalReturn.toFixed(2),
          percentReturn: percentReturn.toFixed(2),
          status: "CLOSED",
          notes: "Imported from broker CSV",
        });
      }
    } else if (position.quantity !== 0 && position.totalCost > 0) {
      // Store open positions with status: "OPEN" and realizedPnL: 0
      const buyQuantity = positionTransactions
        .filter(t => t.side === "buy")
        .reduce((sum, t) => sum + t.quantity, 0);
      
      if (buyQuantity > 0) {
        const avgEntryPrice = position.totalCost / (buyQuantity * multiplier);
        trades.push({
          tradeDate: position.firstBuyDate,
          ticker: position.symbol,
          assetType: position.assetType,
          expirationDate: position.expirationDate,
          strikePrice: position.strikePrice,
          entryPrice: avgEntryPrice.toFixed(4),
          exitPrice: undefined,
          quantity: Math.abs(position.quantity).toFixed(0),
          contracts: position.assetType !== "Stock" ? Math.abs(position.quantity).toFixed(0) : undefined,
          totalInvested: position.totalCost.toFixed(2),
          totalReturn: "0.00", // Open positions have no realized P&L
          percentReturn: "0.00",
          status: "OPEN",
          notes: "Open position from broker CSV",
        });
      }
    }
  }

  if (trades.length === 0) {
    throw new Error("No valid trades found in CSV. Please check the file format matches the standard broker export format. Make sure your CSV has columns: Activity Date, Instrument, Description, Trans Code, Quantity, Price, Amount.");
  }

  console.log(`Successfully parsed ${trades.length} trades from CSV`);
  return trades;
}

