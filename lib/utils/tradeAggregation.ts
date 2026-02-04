import { BrokerExecution } from "@prisma/client";

export interface AggregatedTrade {
  id: string;
  ticker: string;
  assetType: string; // "Stock", "Call", "Put"
  tradeDate: Date;
  entryDate: Date;
  exitDate: Date | null;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  contracts: number | null;
  totalInvested: number;
  totalReturn: number;
  percentReturn: number;
  expirationDate: Date | null;
  strikePrice: number | null;
  executions: BrokerExecution[];
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function ymdFromDateUTC(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

/** Use UTC-midday for “date-only” semantics */
function dateFromMDYToUTCNoon(mdy: string): Date | null {
  const parts = mdy.split("/");
  if (parts.length !== 3) return null;
  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  const year = parts[2].length === 2 ? 2000 + parseInt(parts[2], 10) : parseInt(parts[2], 10);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function parseOptionDetails(
  description: string | null | undefined,
  instrument: string | null
): {
  ticker: string;
  assetType: string;
  expirationDate: Date | null;
  strikePrice: number | null;
} {
  const desc = (description || "").trim();
  const instr = (instrument || "").trim();

  const isOption = desc.toLowerCase().includes("call") || desc.toLowerCase().includes("put");
  if (!isOption) {
    return { ticker: instr.toUpperCase(), assetType: "Stock", expirationDate: null, strikePrice: null };
  }

  const optionMatch = desc.match(/^([A-Z]+)\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(Call|Put)\s+\$?([\d,]+\.?\d*)/i);
  if (optionMatch) {
    const [, ticker, expDate, callPut, strike] = optionMatch;
    const assetType = callPut.toLowerCase() === "put" ? "Put" : "Call";
    const expirationDate = dateFromMDYToUTCNoon(expDate);
    const strikePrice = parseFloat(strike.replace(/,/g, "")) || null;

    return { ticker: ticker.toUpperCase(), assetType, expirationDate, strikePrice };
  }

  return {
    ticker: instr.toUpperCase(),
    assetType: desc.toLowerCase().includes("put") ? "Put" : "Call",
    expirationDate: null,
    strikePrice: null,
  };
}

function createPositionKey(ticker: string, assetType: string, expirationDate: Date | null, strikePrice: number | null): string {
  if (assetType === "Stock") return `${ticker}-Stock`;
  const expStr = expirationDate ? ymdFromDateUTC(expirationDate) : "unknown";
  const strikeStr = strikePrice?.toString() || "unknown";
  return `${ticker}-${assetType}-${strikeStr}-${expStr}`;
}

function isOpeningTransaction(transactionType: string): boolean {
  return ["BTO", "BUY"].includes(transactionType.toUpperCase());
}

function isClosingTransaction(transactionType: string): boolean {
  return ["STC", "SELL"].includes(transactionType.toUpperCase());
}

export function buildTradesFromExecutions(executions: BrokerExecution[]): AggregatedTrade[] {
  if (executions.length === 0) return [];

  const positionGroups = new Map<
    string,
    { ticker: string; assetType: string; expirationDate: Date | null; strikePrice: number | null; executions: BrokerExecution[] }
  >();

  for (const execution of executions) {
    const optionDetails = parseOptionDetails(execution.description || null, execution.instrument);
    const positionKey = createPositionKey(optionDetails.ticker, optionDetails.assetType, optionDetails.expirationDate, optionDetails.strikePrice);

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

  const trades: AggregatedTrade[] = [];

  for (const [positionKey, position] of Array.from(positionGroups.entries())) {
    position.executions.sort((a, b) => a.activityDate.getTime() - b.activityDate.getTime());

    const openingExecutions = position.executions.filter((e) => isOpeningTransaction(e.transactionType));
    const closingExecutions = position.executions.filter((e) => isClosingTransaction(e.transactionType));

    const totalBuyQuantity = openingExecutions.reduce((sum, e) => sum + Math.abs(e.quantity || 0), 0);
    const totalBuyCost = openingExecutions.reduce((sum, e) => sum + Math.abs(e.amount || 0), 0);

    const totalSellQuantity = closingExecutions.reduce((sum, e) => sum + Math.abs(e.quantity || 0), 0);

    const remainingQuantity = totalBuyQuantity - totalSellQuantity;
    const isClosed = remainingQuantity <= 0;
    const openQuantity = Math.max(remainingQuantity, 0);

    let weightedEntryPriceSum = 0;
    let weightedEntryQuantitySum = 0;

    for (const exec of openingExecutions) {
      if (exec.price != null) {
        weightedEntryPriceSum += exec.price * Math.abs(exec.quantity);
        weightedEntryQuantitySum += Math.abs(exec.quantity);
      }
    }

    const avgEntryPrice = weightedEntryQuantitySum > 0 ? weightedEntryPriceSum / weightedEntryQuantitySum : 0;

    let weightedExitPriceSum = 0;
    let weightedExitQuantitySum = 0;

    for (const exec of closingExecutions) {
      if (exec.price != null) {
        weightedExitPriceSum += exec.price * Math.abs(exec.quantity);
        weightedExitQuantitySum += Math.abs(exec.quantity);
      }
    }

    const avgExitPrice = weightedExitQuantitySum > 0 && isClosed ? weightedExitPriceSum / weightedExitQuantitySum : null;

    const closingProceeds = closingExecutions.reduce((sum, e) => sum + Math.abs(e.amount || 0), 0);
    const closedQuantityForPnL = isClosed ? totalBuyQuantity : totalSellQuantity;
    const closedCost = closedQuantityForPnL > 0 ? (totalBuyCost * closedQuantityForPnL) / totalBuyQuantity : 0;
    const realizedPnL = closingProceeds - closedCost;

    const percentReturn = closedCost > 0 ? (realizedPnL / closedCost) * 100 : 0;

    const entryDate = position.executions[0]?.activityDate || new Date();
    const exitDate = isClosed && closingExecutions.length > 0 ? closingExecutions[closingExecutions.length - 1].activityDate : null;
    const tradeDate = entryDate;

    const closedQuantity = isClosed ? totalBuyQuantity : openQuantity;

    if (position.executions.length > 0 && totalBuyQuantity > 0) {
      trades.push({
        id: positionKey,
        ticker: position.ticker,
        assetType: position.assetType,
        tradeDate,
        entryDate,
        exitDate,
        entryPrice: avgEntryPrice,
        exitPrice: avgExitPrice,
        quantity: closedQuantity,
        contracts: position.assetType !== "Stock" ? Math.round(closedQuantity) : null,
        totalInvested: totalBuyCost,
        totalReturn: realizedPnL,
        percentReturn,
        expirationDate: position.expirationDate,
        strikePrice: position.strikePrice,
        executions: position.executions,
      });
    }
  }

  trades.sort((a, b) => b.tradeDate.getTime() - a.tradeDate.getTime());
  return trades;
}
