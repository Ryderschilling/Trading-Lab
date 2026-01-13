"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTrade(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Get and validate required fields
  const tradeDateStr = formData.get("tradeDate") as string;
  if (!tradeDateStr) {
    throw new Error("Trade date is required");
  }
  
  const tradeDate = new Date(tradeDateStr);
  if (isNaN(tradeDate.getTime())) {
    throw new Error(`Invalid trade date: ${tradeDateStr}`);
  }

  const ticker = (formData.get("ticker") as string)?.trim();
  if (!ticker) {
    throw new Error("Ticker is required");
  }

  const assetType = (formData.get("assetType") as string) || "Stock";
  const entryPriceStr = formData.get("entryPrice") as string;
  const entryPrice = parseFloat(entryPriceStr);
  if (isNaN(entryPrice)) {
    throw new Error(`Invalid entry price: ${entryPriceStr}`);
  }

  const quantityStr = formData.get("quantity") as string;
  const quantity = parseInt(quantityStr);
  if (isNaN(quantity) || quantity <= 0) {
    throw new Error(`Invalid quantity: ${quantityStr}`);
  }

  const totalInvestedStr = formData.get("totalInvested") as string;
  const totalInvested = parseFloat(totalInvestedStr);
  if (isNaN(totalInvested)) {
    throw new Error(`Invalid total invested: ${totalInvestedStr}`);
  }

  const totalReturnStr = formData.get("totalReturn") as string;
  const totalReturn = parseFloat(totalReturnStr);
  if (isNaN(totalReturn)) {
    throw new Error(`Invalid total return: ${totalReturnStr}`);
  }

  const tradeTime = formData.get("tradeTime") as string | null;
  const exitPrice = formData.get("exitPrice") ? parseFloat(formData.get("exitPrice") as string) : null;
  const contracts = formData.get("contracts") ? parseInt(formData.get("contracts") as string) : null;
  const percentReturnStr = formData.get("percentReturn") as string;
  const percentReturn = percentReturnStr ? parseFloat(percentReturnStr) : (totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0);
  const notes = formData.get("notes") as string | null;
  
  let expirationDate: Date | null = null;
  const expirationDateStr = formData.get("expirationDate") as string;
  if (expirationDateStr) {
    expirationDate = new Date(expirationDateStr);
    if (isNaN(expirationDate.getTime())) {
      expirationDate = null; // Invalid date, ignore it
    }
  }
  
  const strikePriceStr = formData.get("strikePrice") as string;
  const strikePrice = strikePriceStr ? parseFloat(strikePriceStr) : null;

  // Combine date and time if time is provided
  let finalDate = tradeDate;
  if (tradeTime) {
    const [hours, minutes] = tradeTime.split(":");
    finalDate = new Date(tradeDate);
    finalDate.setHours(parseInt(hours), parseInt(minutes));
  }

  // Get status from form (default to CLOSED for manual entries, or from CSV)
  const statusStr = formData.get("status") as string | null;
  const status = statusStr === "OPEN" ? "OPEN" : "CLOSED";

  const trade = await prisma.trade.create({
    data: {
      userId: user.id,
      tradeDate: finalDate,
      tradeTime: tradeTime || null,
      ticker: ticker.toUpperCase(),
      assetType,
      entryPrice,
      exitPrice,
      quantity,
      contracts,
      totalInvested,
      totalReturn,
      percentReturn,
      notes: notes || null,
      ...(assetType !== "Stock" && expirationDate && strikePrice && {
        optionMetadata: {
          create: {
            expirationDate,
            strikePrice,
            is0DTE: expirationDate && new Date(expirationDate.getTime() - tradeDate.getTime()).getDate() === 0,
            isWeekly: false, // Calculate based on expiration
            isMonthly: false, // Calculate based on expiration
            timeOfDay: getTimeOfDay(tradeTime),
            dayOfWeek: getDayOfWeek(finalDate),
          },
        },
      }),
    },
    include: {
      optionMetadata: true,
    },
  });

  // Recalculate stats
  await recalculateStats(user.id, finalDate);

  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  revalidatePath("/goals");

  return trade;
}

function getTimeOfDay(time: string | null): string | null {
  if (!time) return null;
  const hour = parseInt(time.split(":")[0]);
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

function getDayOfWeek(date: Date): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getDay()];
}

export async function recalculateStats(userId: string, date?: Date) {
  // Recalculate daily performance for the trade date
  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  const dayStart = new Date(targetDate);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  // Only count CLOSED trades for daily performance
  const trades = await prisma.trade.findMany({
    where: {
      userId,
      tradeDate: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
  });

  // All P/L calculations use Amount-based totalReturn only
  const netPnl = trades.reduce((sum, t) => sum + t.totalReturn, 0);
  const winCount = trades.filter(t => t.totalReturn > 0).length;
  const lossCount = trades.filter(t => t.totalReturn < 0).length;
  const wins = trades.filter(t => t.totalReturn > 0).map(t => t.totalReturn);
  const losses = trades.filter(t => t.totalReturn < 0).map(t => Math.abs(t.totalReturn));
  const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : null;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : null;
  const largestWin = wins.length > 0 ? Math.max(...wins) : null;
  const largestLoss = losses.length > 0 ? Math.max(...losses) : null;
  const totalVolume = trades.reduce((sum, t) => sum + t.totalInvested, 0);

  await prisma.dailyPerformance.upsert({
    where: {
      userId_date: {
        userId,
        date: targetDate,
      },
    },
    update: {
      netPnl,
      tradeCount: trades.length,
      winCount,
      lossCount,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      totalVolume,
    },
    create: {
      userId,
      date: targetDate,
      netPnl,
      tradeCount: trades.length,
      winCount,
      lossCount,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      totalVolume,
    },
  });

  // Recalculate monthly performance
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  // Only count CLOSED trades for monthly performance
  const monthTrades = await prisma.trade.findMany({
    where: {
      userId,
      tradeDate: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  });

  // All P/L calculations use Amount-based totalReturn only
  const monthPnl = monthTrades.reduce((sum, t) => sum + t.totalReturn, 0);
  const monthWinCount = monthTrades.filter(t => t.totalReturn > 0).length;
  const monthLossCount = monthTrades.filter(t => t.totalReturn < 0).length;

  const dailyPerfs = await prisma.dailyPerformance.findMany({
    where: {
      userId,
      date: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  });

  const greenDays = dailyPerfs.filter(d => d.netPnl > 0).length;
  const redDays = dailyPerfs.filter(d => d.netPnl < 0).length;
  const bestDay = dailyPerfs.length > 0 ? Math.max(...dailyPerfs.map(d => d.netPnl)) : null;
  const worstDay = dailyPerfs.length > 0 ? Math.min(...dailyPerfs.map(d => d.netPnl)) : null;

  await prisma.monthlyPerformance.upsert({
    where: {
      userId_year_month: {
        userId,
        year,
        month,
      },
    },
    update: {
      netPnl: monthPnl,
      tradeCount: monthTrades.length,
      winCount: monthWinCount,
      lossCount: monthLossCount,
      greenDays,
      redDays,
      bestDay,
      worstDay,
    },
    create: {
      userId,
      year,
      month,
      netPnl: monthPnl,
      tradeCount: monthTrades.length,
      winCount: monthWinCount,
      lossCount: monthLossCount,
      greenDays,
      redDays,
      bestDay,
      worstDay,
    },
  });

  // Recalculate aggregated stats
  await recalculateAggregatedStats(userId);
}

async function recalculateAggregatedStats(userId: string) {
  // Only count CLOSED trades for all statistics
  const closedTrades = await prisma.trade.findMany({
    where: { 
      userId,
    },
    include: { optionMetadata: true },
    orderBy: { tradeDate: "asc" },
  });

  if (closedTrades.length === 0) {
    // If no closed trades, reset stats to defaults
    await prisma.aggregatedStats.upsert({
      where: { userId },
      update: {
        totalPnl: 0,
        totalTrades: 0,
        winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      avgTradePnl: 0,
      profitFactor: 0,
      bestTicker: null,
      worstTicker: null,
      largestWin: null,
      largestLoss: null,
      callsPnl: 0,
        putsPnl: 0,
        stocksPnl: 0,
        zeroDTEPnl: 0,
        weeklyPnl: 0,
        monthlyPnl: 0,
        morningPnl: 0,
        afternoonPnl: 0,
        eveningPnl: 0,
        mondayPnl: 0,
        tuesdayPnl: 0,
        wednesdayPnl: 0,
        thursdayPnl: 0,
        fridayPnl: 0,
        lastUpdated: new Date(),
      },
      create: {
        userId,
        totalPnl: 0,
        totalTrades: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        avgTradePnl: 0,
        profitFactor: 0,
        largestWin: null,
        largestLoss: null,
        callsPnl: 0,
        putsPnl: 0,
        stocksPnl: 0,
        zeroDTEPnl: 0,
        weeklyPnl: 0,
        monthlyPnl: 0,
        morningPnl: 0,
        afternoonPnl: 0,
        eveningPnl: 0,
        mondayPnl: 0,
        tuesdayPnl: 0,
        wednesdayPnl: 0,
        thursdayPnl: 0,
        fridayPnl: 0,
      },
    });
    return;
  }

  // All P/L calculations use Amount-based totalReturn only
  const totalPnl = closedTrades.reduce((sum, t) => sum + t.totalReturn, 0);
  const wins = closedTrades.filter(t => t.totalReturn > 0);
  const losses = closedTrades.filter(t => t.totalReturn < 0);
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
  const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.totalReturn, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.totalReturn, 0) / losses.length) : 0;
  
  // Average Trade P/L = Total realized P/L ÷ total number of closed trades
  const avgTradePnl = closedTrades.length > 0 ? totalPnl / closedTrades.length : 0;

  const profitFactor = avgLoss > 0 ? (avgWin * wins.length) / (avgLoss * losses.length) : 0;
  
  // Largest win and loss (using Amount-based P/L only)
  const largestWin = wins.length > 0 ? Math.max(...wins.map(t => t.totalReturn)) : null;
  const largestLoss = losses.length > 0 ? Math.abs(Math.min(...losses.map(t => t.totalReturn))) : null;

  // Best/worst tickers (using Amount-based P/L only)
  const tickerPnl = new Map<string, number>();
  closedTrades.forEach(trade => {
    tickerPnl.set(trade.ticker, (tickerPnl.get(trade.ticker) || 0) + trade.totalReturn);
  });
  const bestTicker = Array.from(tickerPnl.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const worstTicker = Array.from(tickerPnl.entries()).sort((a, b) => a[1] - b[1])[0]?.[0] || null;

  // Options-specific stats (using Amount-based P/L only)
  const calls = closedTrades.filter(t => t.assetType === "Call");
  const puts = closedTrades.filter(t => t.assetType === "Put");
  const stocks = closedTrades.filter(t => t.assetType === "Stock");
  const callsPnl = calls.reduce((sum, t) => sum + t.totalReturn, 0);
  const putsPnl = puts.reduce((sum, t) => sum + t.totalReturn, 0);
  const stocksPnl = stocks.reduce((sum, t) => sum + t.totalReturn, 0);

  const zeroDTE = closedTrades.filter(t => t.optionMetadata?.is0DTE);
  const weekly = closedTrades.filter(t => t.optionMetadata?.isWeekly);
  const monthly = closedTrades.filter(t => t.optionMetadata?.isMonthly);
  const zeroDTEPnl = zeroDTE.reduce((sum, t) => sum + t.totalReturn, 0);
  const weeklyPnl = weekly.reduce((sum, t) => sum + t.totalReturn, 0);
  const monthlyPnl = monthly.reduce((sum, t) => sum + t.totalReturn, 0);

  // Time-of-day stats (using Amount-based P/L only)
  const morning = closedTrades.filter(t => t.optionMetadata?.timeOfDay === "Morning");
  const afternoon = closedTrades.filter(t => t.optionMetadata?.timeOfDay === "Afternoon");
  const evening = closedTrades.filter(t => t.optionMetadata?.timeOfDay === "Evening");
  const morningPnl = morning.reduce((sum, t) => sum + t.totalReturn, 0);
  const afternoonPnl = afternoon.reduce((sum, t) => sum + t.totalReturn, 0);
  const eveningPnl = evening.reduce((sum, t) => sum + t.totalReturn, 0);

  // Day-of-week stats (using Amount-based P/L only)
  const monday = closedTrades.filter(t => t.optionMetadata?.dayOfWeek === "Monday");
  const tuesday = closedTrades.filter(t => t.optionMetadata?.dayOfWeek === "Tuesday");
  const wednesday = closedTrades.filter(t => t.optionMetadata?.dayOfWeek === "Wednesday");
  const thursday = closedTrades.filter(t => t.optionMetadata?.dayOfWeek === "Thursday");
  const friday = closedTrades.filter(t => t.optionMetadata?.dayOfWeek === "Friday");
  const mondayPnl = monday.reduce((sum, t) => sum + t.totalReturn, 0);
  const tuesdayPnl = tuesday.reduce((sum, t) => sum + t.totalReturn, 0);
  const wednesdayPnl = wednesday.reduce((sum, t) => sum + t.totalReturn, 0);
  const thursdayPnl = thursday.reduce((sum, t) => sum + t.totalReturn, 0);
  const fridayPnl = friday.reduce((sum, t) => sum + t.totalReturn, 0);

  await prisma.aggregatedStats.upsert({
    where: { userId },
    update: {
      totalPnl,
      totalTrades: closedTrades.length,
      winRate,
      avgWin,
      avgLoss,
      avgTradePnl,
      profitFactor,
      bestTicker,
      worstTicker,
      largestWin,
      largestLoss,
      callsPnl,
      putsPnl,
      stocksPnl,
      zeroDTEPnl,
      weeklyPnl,
      monthlyPnl,
      morningPnl,
      afternoonPnl,
      eveningPnl,
      mondayPnl,
      tuesdayPnl,
      wednesdayPnl,
      thursdayPnl,
      fridayPnl,
      lastUpdated: new Date(),
    },
    create: {
      userId,
      totalPnl,
      totalTrades: closedTrades.length,
      winRate,
      avgWin,
      avgLoss,
      avgTradePnl,
      profitFactor,
      bestTicker,
      worstTicker,
      largestWin,
      largestLoss,
      callsPnl,
      putsPnl,
      stocksPnl,
      zeroDTEPnl,
      weeklyPnl,
      monthlyPnl,
      morningPnl,
      afternoonPnl,
      eveningPnl,
      mondayPnl,
      tuesdayPnl,
      wednesdayPnl,
      thursdayPnl,
      fridayPnl,
    },
  });
}

export async function getTrades(limit?: number) {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    if (!process.env.DATABASE_URL) {
      return [];
    }

    // Fetch trades from Trade table (trades are now persisted from CSV uploads)
    return await prisma.trade.findMany({
      where: { userId: user.id },
      include: { optionMetadata: true },
      orderBy: { tradeDate: "desc" },
      take: limit,
    });
  } catch (error) {
    console.error("Error getting trades:", error);
    return [];
  }
}

export async function getStats() {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    if (!process.env.DATABASE_URL) {
      return null;
    }

    return await prisma.aggregatedStats.findUnique({
      where: { userId: user.id },
    });
  } catch (error) {
    console.error("Error getting stats:", error);
    return null;
  }
}

export async function getDailyPerformance(startDate?: Date, endDate?: Date) {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    if (!process.env.DATABASE_URL) {
      return [];
    }

    return await prisma.dailyPerformance.findMany({
      where: {
        userId: user.id,
        ...(startDate && endDate && {
          date: {
            gte: startDate,
            lte: endDate,
          },
        }),
      },
      orderBy: { date: "asc" },
    });
  } catch (error) {
    console.error("Error getting daily performance:", error);
    return [];
  }
}

export async function getTradeById(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    if (!process.env.DATABASE_URL) {
      return null;
    }

    const trade = await prisma.trade.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        optionMetadata: true,
      },
    });

    return trade;
  } catch (error) {
    console.error("Error getting trade:", error);
    return null;
  }
}

export async function updateTrade(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Verify trade belongs to user
  const existingTrade = await prisma.trade.findFirst({
    where: { id, userId: user.id },
  });

  if (!existingTrade) {
    throw new Error("Trade not found");
  }

  // Get and validate required fields
  const tradeDateStr = formData.get("tradeDate") as string;
  if (!tradeDateStr) {
    throw new Error("Trade date is required");
  }
  
  const tradeDate = new Date(tradeDateStr);
  if (isNaN(tradeDate.getTime())) {
    throw new Error(`Invalid trade date: ${tradeDateStr}`);
  }

  const ticker = (formData.get("ticker") as string)?.trim();
  if (!ticker) {
    throw new Error("Ticker is required");
  }

  const assetType = (formData.get("assetType") as string) || "Stock";
  const entryPriceStr = formData.get("entryPrice") as string;
  const entryPrice = parseFloat(entryPriceStr);
  if (isNaN(entryPrice)) {
    throw new Error(`Invalid entry price: ${entryPriceStr}`);
  }

  const quantityStr = formData.get("quantity") as string;
  const quantity = parseInt(quantityStr);
  if (isNaN(quantity) || quantity <= 0) {
    throw new Error(`Invalid quantity: ${quantityStr}`);
  }

  const totalInvestedStr = formData.get("totalInvested") as string;
  const totalInvested = parseFloat(totalInvestedStr);
  if (isNaN(totalInvested)) {
    throw new Error(`Invalid total invested: ${totalInvestedStr}`);
  }

  const totalReturnStr = formData.get("totalReturn") as string;
  const totalReturn = parseFloat(totalReturnStr);
  if (isNaN(totalReturn)) {
    throw new Error(`Invalid total return: ${totalReturnStr}`);
  }

  const tradeTime = formData.get("tradeTime") as string | null;
  const exitPrice = formData.get("exitPrice") ? parseFloat(formData.get("exitPrice") as string) : null;
  const contracts = formData.get("contracts") ? parseInt(formData.get("contracts") as string) : null;
  const percentReturnStr = formData.get("percentReturn") as string;
  const percentReturn = percentReturnStr ? parseFloat(percentReturnStr) : (totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0);
  const notes = formData.get("notes") as string | null;
  
  let expirationDate: Date | null = null;
  const expirationDateStr = formData.get("expirationDate") as string;
  if (expirationDateStr) {
    expirationDate = new Date(expirationDateStr);
    if (isNaN(expirationDate.getTime())) {
      expirationDate = null;
    }
  }
  
  const strikePriceStr = formData.get("strikePrice") as string;
  const strikePrice = strikePriceStr ? parseFloat(strikePriceStr) : null;

  // Combine date and time if time is provided
  let finalDate = tradeDate;
  if (tradeTime) {
    const [hours, minutes] = tradeTime.split(":");
    finalDate = new Date(tradeDate);
    finalDate.setHours(parseInt(hours), parseInt(minutes));
  }

  // Update trade
  const trade = await prisma.trade.update({
    where: { id },
    data: {
      tradeDate: finalDate,
      tradeTime: tradeTime || null,
      ticker: ticker.toUpperCase(),
      assetType,
      entryPrice,
      exitPrice,
      quantity,
      contracts,
      totalInvested,
      totalReturn,
      percentReturn,
      notes: notes || null,
    },
  });

  // Update option metadata if needed
  if (assetType !== "Stock" && expirationDate && strikePrice) {
    await prisma.optionMetadata.upsert({
      where: { tradeId: id },
      update: {
        expirationDate,
        strikePrice,
        is0DTE: expirationDate && new Date(expirationDate.getTime() - tradeDate.getTime()).getDate() === 0,
        timeOfDay: getTimeOfDay(tradeTime),
        dayOfWeek: getDayOfWeek(finalDate),
      },
      create: {
        tradeId: id,
        expirationDate,
        strikePrice,
        is0DTE: expirationDate && new Date(expirationDate.getTime() - tradeDate.getTime()).getDate() === 0,
        timeOfDay: getTimeOfDay(tradeTime),
        dayOfWeek: getDayOfWeek(finalDate),
      },
    });
  } else if (assetType === "Stock") {
    // Delete option metadata if switching to stock
    await prisma.optionMetadata.deleteMany({
      where: { tradeId: id },
    });
  }

  // Recalculate stats
  await recalculateStats(user.id, finalDate);

  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  revalidatePath("/goals");
  revalidatePath("/trades");

  return trade;
}

export async function deleteTrade(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Verify trade belongs to user
  const existingTrade = await prisma.trade.findFirst({
    where: { id, userId: user.id },
  });

  if (!existingTrade) {
    throw new Error("Trade not found");
  }

  const tradeDate = existingTrade.tradeDate;

  // Delete trade (cascade will delete option metadata)
  await prisma.trade.delete({
    where: { id },
  });

  // Recalculate stats
  await recalculateStats(user.id, tradeDate);

  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  revalidatePath("/goals");
  revalidatePath("/trades");

  return { success: true };
}

export async function deleteAllTrades() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  if (!process.env.DATABASE_URL) {
    throw new Error("Database not configured");
  }

  // Delete all trades for the user (cascade will delete option metadata)
  const result = await prisma.trade.deleteMany({
    where: { userId: user.id },
  });

  // Recalculate stats (will reset to empty)
  await recalculateStats(user.id);

  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  revalidatePath("/goals");
  revalidatePath("/trades");

  return { success: true, count: result.count };
}

