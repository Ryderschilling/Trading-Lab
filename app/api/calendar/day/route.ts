import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isValidYMD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// Store “date-only” as UTC noon to prevent timezone rollovers
function utcNoonFromYMD(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateKey = (searchParams.get("date") ?? "").trim();

  if (!isValidYMD(dateKey)) {
    return NextResponse.json({ error: "Invalid date. Expected YYYY-MM-DD" }, { status: 400 });
  }

  const start = new Date(`${dateKey}T00:00:00.000Z`);
  const end = new Date(`${dateKey}T23:59:59.999Z`);
  const dayKeyDate = utcNoonFromYMD(dateKey);

  const [trades, dailyPerf, journal] = await Promise.all([
    prisma.trade.findMany({
      where: { userId: user.id, tradeDate: { gte: start, lte: end } },
      include: { optionMetadata: true },
      orderBy: { tradeDate: "desc" },
    }),
    prisma.dailyPerformance.findFirst({
      where: { userId: user.id, date: dayKeyDate },
    }),
    prisma.journalEntry.findFirst({
      where: { userId: user.id, date: dayKeyDate },
    }),
  ]);

  return NextResponse.json({ trades, dailyPerf, journal });
}
