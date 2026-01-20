import { BrokerExecution } from "@prisma/client";

export interface AggregatedTrade {
  id: string; // Composite key for grouping
  ticker: string;
  assetType: string; // "Stock", "Call", "Put"
  tradeDate: Date; // Date of first execution (entry)
  entryDate: Date;
  exitDate: Date | null;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number; // Total quantity traded
  contracts: number | null; // For options
  totalInvested: number; // Total cost basis
  totalReturn: number; // Realized P&L (total sell proceeds - total buy cost)
  percentReturn: number;
  expirationDate: Date | null;
  strikePrice: number | null;
  executions: BrokerExecution[]; // Underlying executions for drill-down
}

/**
 * Parse option details from description/instrument
 * Format: "SPY 12/31/2025 Put $684.00" or "SPY 12/31/2025 Call $684.00"
 */
function parseOptionDetails(description: string | null | undefined, instrument: string | null): {
  ticker: string;
  assetType: string;
  expirationDate: Date | null;
  strikePrice: number | null;
} {
  const desc = (description || "").trim();
  const instr = (instrument || "").trim();
  
  // Check if it's an option (has Call or Put in description)
  const isOption = desc.toLowerCase().includes("call") || desc.toLowerCase().includes("put");
  
  if (!isOption) {
    return {
      ticker: instr.toUpperCase(),
      assetType: "Stock",
      expirationDate: null,
      strikePrice: null,
    };
  }
  
  // Parse option format: TICKER MM/DD/YYYY Call/Put $STRIKE
  const optionMatch = desc.match(/^([A-Z]+)\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(Call|Put)\s+\$?([\d,]+\.?\d*)/i);
  
  if (optionMatch) {
    const [, ticker, expDate, callPut, strike] = optionMatch;
    const assetType = callPut.toLowerCase() === "put" ? "Put" : "Call";
    
    // Format expiration date to Date
    const dateParts = expDate.split("/");
    let expirationDate: Date | null = null;
    if (dateParts.length === 3) {
      const month = parseInt(dateParts[0]) - 1; // JS months are 0-indexed
      const day = parseInt(dateParts[1]);
      const year = dateParts[2].length === 2 ? 2000 + parseInt(dateParts[2]) : parseInt(dateParts[2]);
      expirationDate = new Date(year, month, day);
    }
    
    const strikePrice = parseFloat(strike.replace(/,/g, "")) || null;
    
    return {
      ticker: ticker.toUpperCase(),
      assetType,
      expirationDate,
      strikePrice,
    };
  }
  
  // Fallback: try to extract ticker from instrument
  return {
    ticker: instr.toUpperCase(),
    assetType: desc.toLowerCase().includes("put") ? "Put" : "Call",
    expirationDate: null,
    strikePrice: null,
  };
}

/**
 * Create a position key for grouping executions
 * For stocks: "TICKER-Stock"
 * For options: "TICKER-Call-150-2025-12-31" or "TICKER-Put-150-2025-12-31"
 */
function createPositionKey(
  ticker: string,
  assetType: string,
  expirationDate: Date | null,
  strikePrice: number | null
): string {
  if (assetType === "Stock") {
    return `${ticker}-Stock`;
  }
  
  const expStr = expirationDate 
    ? expirationDate.toISOString().split("T")[0] 
    : "unknown";
  const strikeStr = strikePrice?.toString() || "unknown";
  
  return `${ticker}-${assetType}-${strikeStr}-${expStr}`;
}

/**
 * Determine if a transaction type opens a position (buy)
 */
function isOpeningTransaction(transactionType: string): boolean {
  return ["BTO", "BUY"].includes(transactionType.toUpperCase());
}

/**
 * Determine if a transaction type closes a position (sell)
 */
function isClosingTransaction(transactionType: string): boolean {
  return ["STC", "SELL"].includes(transactionType.toUpperCase());
}

/**
 * Aggregate broker executions into logical trades
 * Groups executions by position and calculates trade metrics
 */
export function buildTradesFromExecutions(executions: BrokerExecution[]): AggregatedTrade[] {
  if (executions.length === 0) {
    return [];
  }
  
  // Group executions by position
  const positionGroups = new Map<string, {
    ticker: string;
    assetType: string;
    expirationDate: Date | null;
    strikePrice: number | null;
    executions: BrokerExecution[];
  }>();
  
  // First pass: group executions by position
  for (const execution of executions) {
    const optionDetails = parseOptionDetails(execution.description || null, execution.instrument);
    const positionKey = createPositionKey(
      optionDetails.ticker,
      optionDetails.assetType,
      optionDetails.expirationDate,
      optionDetails.strikePrice
    );
    
    if (!positionGroups.has(positionKey)) {
      positionGroups.set(positionKey, {
        ticker: optionDetails.ticker,
        assetType: optionDetails.assetType,
        expirationDate: optionDetails.expirationDate,
        strikePrice: optionDetails.strikePrice,
        executions: [],
      });
    }
    
    positionGroups.get(positionKey)!.executions.push(execution);
  }
  
  // Second pass: build trades from position groups
  const trades: AggregatedTrade[] = [];
  
  for (const [positionKey, position] of Array.from(positionGroups.entries())) {
    // Sort executions by date (oldest first)
    position.executions.sort((a, b) => 
      a.activityDate.getTime() - b.activityDate.getTime()
    );
    
    // Separate opening and closing transactions
    const openingExecutions = position.executions.filter(e => 
      isOpeningTransaction(e.transactionType)
    );
    const closingExecutions = position.executions.filter(e => 
      isClosingTransaction(e.transactionType)
    );
    
    // Calculate total buy quantity and cost
    const totalBuyQuantity = openingExecutions.reduce(
      (sum, e) => sum + Math.abs(e.quantity || 0),
      0
    );
    const totalBuyCost = openingExecutions.reduce(
      (sum, e) => sum + Math.abs(e.amount || 0),
      0
    );
    
    // Calculate total sell quantity and proceeds
    const totalSellQuantity = closingExecutions.reduce(
      (sum, e) => sum + Math.abs(e.quantity || 0),
      0
    );
    const totalSellProceeds = closingExecutions.reduce(
      (sum, e) => sum + Math.abs(e.amount || 0),
      0
    );
    
    // Determine if position is open or closed
    const openQuantity = totalBuyQuantity - totalSellQuantity;
    const isClosed = totalBuyQuantity > 0 && totalSellQuantity >= totalBuyQuantity;
    
    // Calculate average prices per unit (per share for stocks, per contract for options)
    // Use the price field from executions, weighted by quantity
    // This gives us the premium per contract for options, price per share for stocks
    let weightedEntryPriceSum = 0;
    let weightedEntryQuantitySum = 0;
    
    for (const exec of openingExecutions) {
      if (exec.price != null) {
        weightedEntryPriceSum += exec.price * Math.abs(exec.quantity);
        weightedEntryQuantitySum += Math.abs(exec.quantity);
      }
    }
    
    const avgEntryPrice = weightedEntryQuantitySum > 0
      ? weightedEntryPriceSum / weightedEntryQuantitySum
      : 0;
    
    let weightedExitPriceSum = 0;
    let weightedExitQuantitySum = 0;
    
    for (const exec of closingExecutions) {
      if (exec.price != null) {
        weightedExitPriceSum += exec.price * Math.abs(exec.quantity);
        weightedExitQuantitySum += Math.abs(exec.quantity);
      }
    }
    
    const avgExitPrice = weightedExitQuantitySum > 0 && isClosed
      ? weightedExitPriceSum / weightedExitQuantitySum
      : null;
    
    // Calculate P&L
    // For closed positions: P&L = total sell proceeds - total buy cost
    // totalBuyCost is the absolute value of buy amounts (cash outflow)
    // totalSellProceeds is the absolute value of sell amounts (cash inflow)
    // P&L = what we received - what we paid
    const realizedPnL = isClosed 
      ? [...openingExecutions, ...closingExecutions]
          .reduce((sum, e) => sum + (e.amount || 0), 0)
      : 0;
    
    const percentReturn = totalBuyCost > 0 && isClosed
      ? (realizedPnL / totalBuyCost) * 100
      : 0;
    
    // Get dates
    const entryDate = position.executions[0]?.activityDate || new Date();
    const exitDate = isClosed && closingExecutions.length > 0
      ? closingExecutions[closingExecutions.length - 1].activityDate
      : null;
    
    // Use first execution date as tradeDate (entry date)
    const tradeDate = entryDate;
    
    // Determine closed quantity (min of buy and sell quantities for closed trades)
    // For closed trades, use the closed quantity; for open, use the current open quantity
    const closedQuantity = isClosed 
      ? totalBuyQuantity
      : openQuantity;
    
    // Only create trade if there are valid executions and we bought something
    if (position.executions.length > 0 && totalBuyQuantity > 0) {
      const trade: AggregatedTrade = {
        id: positionKey, // Use position key as trade ID for grouping
        ticker: position.ticker,
        assetType: position.assetType,
        tradeDate,
        entryDate,
        exitDate,
        entryPrice: avgEntryPrice, // Price per share (stocks) or per contract (options)
        exitPrice: avgExitPrice, // Price per share (stocks) or per contract (options)
        quantity: closedQuantity, // Use closed quantity for closed trades, open quantity for open
        contracts: position.assetType !== "Stock" ? Math.round(closedQuantity) : null,
        totalInvested: totalBuyCost, // Total cash invested (absolute value)
        totalReturn: realizedPnL, // Realized P&L (sell proceeds - buy cost)
        percentReturn,
        expirationDate: position.expirationDate,
        strikePrice: position.strikePrice,
        executions: position.executions,
      };
      
      trades.push(trade);
    }
  }
  
  // Sort trades by trade date (most recent first)
  trades.sort((a, b) => b.tradeDate.getTime() - a.tradeDate.getTime());
  
  return trades;
}

