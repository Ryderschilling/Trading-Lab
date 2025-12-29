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

  if (results.errors.length > 0) {
    throw new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(", ")}`);
  }

  // Group transactions by symbol to match buy/sell pairs
  const transactions = results.data.map((row) => {
    const symbol = row["Symbol"] || row["symbol"] || row["Ticker"] || row["Instrument"] || "";
    const side = (row["Side"] || row["side"] || row["Type"] || row["Direction"] || "").toLowerCase();
    const quantity = row["Quantity"] || row["quantity"] || row["Shares"] || row["Filled Quantity"] || "0";
    const price = row["Price"] || row["price"] || row["Average Price"] || row["Filled Price"] || "0";
    const fees = row["Fees"] || row["fees"] || row["Commission"] || row["Commission & Fees"] || "0";
    const date = row["Date"] || row["date"] || row["Time"] || row["Executed At"] || row["Time in Force"] || "";
    const orderType = row["Order Type"] || row["order_type"] || row["Order Type"] || "";
    
    // Determine asset type
    let assetType = "Stock";
    let expirationDate: string | undefined;
    let strikePrice: string | undefined;
    let optionType: string | undefined;

    // Check if it's an option
    const optionSymbol = row["Option Symbol"] || row["Option"] || "";
    if (optionSymbol || row["Strike Price"] || symbol.match(/\d{2}\/\d{2}\/\d{2,4}/) || symbol.includes(" ")) {
      // Extract option details
      if (row["Strike Price"]) {
        strikePrice = row["Strike Price"];
      }
      if (row["Expiration Date"]) {
        expirationDate = row["Expiration Date"];
      }
      
      // Determine Call or Put
      if (optionSymbol.toLowerCase().includes("call") || symbol.includes(" C") || symbol.endsWith("C")) {
        assetType = "Call";
        optionType = "Call";
      } else if (optionSymbol.toLowerCase().includes("put") || symbol.includes(" P") || symbol.endsWith("P")) {
        assetType = "Put";
        optionType = "Put";
      } else {
        assetType = "Call"; // Default
      }
    }

    // Parse date
    let tradeDate = date;
    let tradeTime: string | undefined;
    
    if (date.includes(" ")) {
      const parts = date.split(" ");
      tradeDate = parts[0];
      tradeTime = parts[1]?.substring(0, 5); // HH:MM format
    }

    // Format date to YYYY-MM-DD
    if (tradeDate && !tradeDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parsed = new Date(tradeDate);
      if (!isNaN(parsed.getTime())) {
        tradeDate = parsed.toISOString().split("T")[0];
      } else {
        // Try MM/DD/YYYY format
        const parts = tradeDate.split("/");
        if (parts.length === 3) {
          tradeDate = `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
        }
      }
    }

    return {
      symbol: symbol.toUpperCase().split(" ")[0],
      side,
      quantity: parseFloat(quantity) || 0,
      price: parseFloat(price) || 0,
      fees: parseFloat(fees) || 0,
      tradeDate: tradeDate || new Date().toISOString().split("T")[0],
      tradeTime,
      assetType,
      expirationDate,
      strikePrice,
      optionType,
      orderType,
    };
  }).filter(t => t.symbol);

  // Match buy/sell pairs to create complete trades
  const trades: ParsedTrade[] = [];
  const pendingBuys = new Map<string, Array<typeof transactions[0]>>();

  for (const trans of transactions) {
    const key = `${trans.symbol}-${trans.expirationDate || ""}-${trans.strikePrice || ""}`;
    
    if (trans.side.includes("buy") || trans.side === "b") {
      // Add to pending buys
      if (!pendingBuys.has(key)) {
        pendingBuys.set(key, []);
      }
      pendingBuys.get(key)!.push(trans);
    } else if (trans.side.includes("sell") || trans.side === "s") {
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
          entryPrice: buy.price.toString(),
          exitPrice: trans.price.toString(),
          quantity: qty.toString(),
          contracts: buy.assetType !== "Stock" ? qty.toString() : undefined,
          totalInvested: entryCost.toString(),
          totalReturn: totalReturn.toString(),
          percentReturn: percentReturn.toString(),
          notes: `Robinhood ${buy.orderType || ""}`,
        });
      } else {
        // No matching buy, treat as standalone (maybe partial position)
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
          exitPrice: price.toString(),
          quantity: qty.toString(),
          contracts: trans.assetType !== "Stock" ? qty.toString() : undefined,
          totalInvested: totalInvested.toString(),
          totalReturn: (-fees).toString(), // Loss from fees
          percentReturn: "0",
          notes: `Robinhood ${trans.orderType || "Sell"} (no matching buy)`,
        });
      }
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
        entryPrice: price.toString(),
        exitPrice: undefined,
        quantity: qty.toString(),
        contracts: buy.assetType !== "Stock" ? qty.toString() : undefined,
        totalInvested: totalInvested.toString(),
        totalReturn: "0", // Open position
        percentReturn: "0",
        notes: `Robinhood ${buy.orderType || "Buy"} (open position)`,
      });
    }
  }

  return trades;
}

