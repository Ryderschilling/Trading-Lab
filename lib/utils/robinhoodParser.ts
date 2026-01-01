import Papa from "papaparse";

export interface RobinhoodTrade {
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
  strategyTag?: string;
  notes?: string;
}

/**
 * Maps Robinhood CSV format to our trade format
 * Robinhood exports individual transactions (Buy/Sell), so we match pairs
 */
export function parseRobinhoodCSV(csvText: string): ParsedTrade[] {
  const results = Papa.parse<RobinhoodTrade>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (results.errors.length > 0 && results.errors.some(e => e.type === "Quotes")) {
    // Non-critical errors, continue
    console.warn("CSV parsing warnings:", results.errors);
  }

  if (!results.data || results.data.length === 0) {
    throw new Error("CSV file is empty or has no valid data rows");
  }

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
    .map((row) => {
      // Try various column name variations
      const symbol = (row["Symbol"] || row["symbol"] || row["Ticker"] || row["Instrument"] || row["symbol"] || "").toString().trim();
      if (!symbol) return null;

      const side = (row["Side"] || row["side"] || row["Type"] || row["Direction"] || row["Transaction Type"] || "").toString().toLowerCase();
      const quantityStr = (row["Quantity"] || row["quantity"] || row["Shares"] || row["Filled Quantity"] || row["Qty"] || "0").toString().replace(/,/g, "");
      const priceStr = (row["Price"] || row["price"] || row["Average Price"] || row["Filled Price"] || row["Executed Price"] || "0").toString().replace(/,/g, "");
      const feesStr = (row["Fees"] || row["fees"] || row["Commission"] || row["Commission & Fees"] || row["Total Fees"] || "0").toString().replace(/,/g, "");
      const date = (row["Date"] || row["date"] || row["Time"] || row["Executed At"] || row["Time in Force"] || row["Transaction Date"] || "").toString();
      const orderType = (row["Order Type"] || row["order_type"] || row["Order Type"] || "").toString();
      
      const quantity = Math.abs(parseFloat(quantityStr) || 0);
      const price = Math.abs(parseFloat(priceStr) || 0);
      const fees = Math.abs(parseFloat(feesStr) || 0);

      if (quantity === 0 || price === 0) {
        return null; // Skip invalid transactions
      }
      
      // Determine asset type
      let assetType = "Stock";
      let expirationDate: string | undefined;
      let strikePrice: string | undefined;

      // Check if it's an option - look for common option indicators
      const optionSymbol = (row["Option Symbol"] || row["Option"] || "").toString();
      const hasStrikePrice = row["Strike Price"] || row["Strike"] || row["strike"];
      const hasExpiration = row["Expiration Date"] || row["Expiration"] || row["Expiry"];
      
      if (optionSymbol || hasStrikePrice || hasExpiration || symbol.match(/\d{2}\/\d{2}\/\d{2,4}/) || symbol.includes(" ")) {
        // Extract option details
        if (hasStrikePrice) {
          strikePrice = hasStrikePrice.toString();
        }
        if (hasExpiration) {
          expirationDate = hasExpiration.toString();
        }
        
        // Determine Call or Put
        const symbolUpper = symbol.toUpperCase();
        if (optionSymbol.toLowerCase().includes("call") || symbolUpper.includes(" C ") || symbolUpper.endsWith("C") || symbolUpper.includes("CALL")) {
          assetType = "Call";
        } else if (optionSymbol.toLowerCase().includes("put") || symbolUpper.includes(" P ") || symbolUpper.endsWith("P") || symbolUpper.includes("PUT")) {
          assetType = "Put";
        } else {
          assetType = "Call"; // Default to Call
        }
      }

      // Parse date - handle various formats
      let tradeDate = date.trim();
      let tradeTime: string | undefined;
      
      if (date.includes(" ")) {
        const parts = date.split(" ");
        tradeDate = parts[0];
        if (parts[1]) {
          // Extract time (HH:MM:SS or HH:MM)
          const timeMatch = parts[1].match(/(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            tradeTime = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
          }
        }
      }

      // Format date to YYYY-MM-DD
      if (tradeDate && !tradeDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Try parsing as Date object
        const parsed = new Date(tradeDate);
        if (!isNaN(parsed.getTime())) {
          tradeDate = parsed.toISOString().split("T")[0];
        } else {
          // Try MM/DD/YYYY format
          const parts = tradeDate.split("/");
          if (parts.length === 3) {
            const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
            tradeDate = `${year}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
          } else {
            // Try YYYY-MM-DD with different separators
            const dashParts = tradeDate.split("-");
            if (dashParts.length === 3) {
              tradeDate = tradeDate;
            } else {
              // Default to today if can't parse
              tradeDate = new Date().toISOString().split("T")[0];
            }
          }
        }
      }

      if (!tradeDate) {
        tradeDate = new Date().toISOString().split("T")[0];
      }

      return {
        symbol: symbol.toUpperCase().split(" ")[0].split("\t")[0], // Clean symbol
        side,
        quantity,
        price,
        fees,
        tradeDate,
        tradeTime,
        assetType,
        expirationDate,
        strikePrice,
        orderType,
      };
    })
    .filter((t): t is Transaction => t !== null && t.symbol.length > 0);

  // Match buy/sell pairs to create complete trades
  const trades: ParsedTrade[] = [];
  const pendingBuys = new Map<string, Transaction[]>();

  for (const trans of transactions) {
    const key = `${trans.symbol}-${trans.expirationDate || ""}-${trans.strikePrice || ""}`;
    
    const isBuy = trans.side.includes("buy") || trans.side === "b" || trans.side.includes("purchase") || trans.side === "debit";
    const isSell = trans.side.includes("sell") || trans.side === "s" || trans.side.includes("close") || trans.side === "credit";
    
    if (isBuy) {
      // Add to pending buys
      if (!pendingBuys.has(key)) {
        pendingBuys.set(key, []);
      }
      pendingBuys.get(key)!.push(trans);
    } else if (isSell) {
      // Try to match with a buy
      const buys = pendingBuys.get(key) || [];
      if (buys.length > 0) {
        const buy = buys.shift()!;
        
        // Create complete trade
        const qty = Math.min(buy.quantity, trans.quantity);
        const entryCost = buy.price * qty + buy.fees;
        const exitValue = trans.price * qty - trans.fees;
        const totalReturn = exitValue - entryCost;
        const percentReturn = entryCost > 0 ? (totalReturn / entryCost) * 100 : 0;

        trades.push({
          tradeDate: buy.tradeDate,
          tradeTime: buy.tradeTime,
          ticker: buy.symbol,
          assetType: buy.assetType,
          expirationDate: buy.expirationDate,
          strikePrice: buy.strikePrice,
          entryPrice: buy.price.toFixed(4),
          exitPrice: trans.price.toFixed(4),
          quantity: qty.toFixed(0),
          contracts: buy.assetType !== "Stock" ? qty.toFixed(0) : undefined,
          totalInvested: entryCost.toFixed(2),
          totalReturn: totalReturn.toFixed(2),
          percentReturn: percentReturn.toFixed(2),
          notes: `Robinhood ${buy.orderType || ""}`.trim() || "Imported from Robinhood",
        });
      } else {
        // No matching buy, treat as standalone sell (partial position or closing)
        const qty = trans.quantity;
        const price = trans.price;
        const fees = trans.fees;
        const totalInvested = qty * price + fees;
        
        trades.push({
          tradeDate: trans.tradeDate,
          tradeTime: trans.tradeTime,
          ticker: trans.symbol,
          assetType: trans.assetType,
          expirationDate: trans.expirationDate,
          strikePrice: trans.strikePrice,
          entryPrice: "0",
          exitPrice: price.toFixed(4),
          quantity: qty.toFixed(0),
          contracts: trans.assetType !== "Stock" ? qty.toFixed(0) : undefined,
          totalInvested: totalInvested.toFixed(2),
          totalReturn: (-fees).toFixed(2), // Loss from fees
          percentReturn: "0",
          notes: `Robinhood ${trans.orderType || "Sell"} (no matching buy)`.trim() || "Imported from Robinhood",
        });
      }
    } else {
      // Unknown side, treat as buy
      if (!pendingBuys.has(key)) {
        pendingBuys.set(key, []);
      }
      pendingBuys.get(key)!.push(trans);
    }
  }

  // Add any remaining unmatched buys as open positions
  for (const [key, buys] of pendingBuys.entries()) {
    for (const buy of buys) {
      const qty = buy.quantity;
      const price = buy.price;
      const fees = buy.fees;
      const totalInvested = qty * price + fees;

      trades.push({
        tradeDate: buy.tradeDate,
        tradeTime: buy.tradeTime,
        ticker: buy.symbol,
        assetType: buy.assetType,
        expirationDate: buy.expirationDate,
        strikePrice: buy.strikePrice,
        entryPrice: price.toFixed(4),
        exitPrice: undefined,
        quantity: qty.toFixed(0),
        contracts: buy.assetType !== "Stock" ? qty.toFixed(0) : undefined,
        totalInvested: totalInvested.toFixed(2),
        totalReturn: "0", // Open position
        percentReturn: "0",
        notes: `Robinhood ${buy.orderType || "Buy"} (open position)`.trim() || "Imported from Robinhood",
      });
    }
  }

  if (trades.length === 0) {
    throw new Error("No valid trades found in CSV. Please check the file format matches Robinhood export format.");
  }

  return trades;
}

