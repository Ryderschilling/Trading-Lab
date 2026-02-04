import { NextRequest, NextResponse } from "next/server";
import { getDayDetails } from "@/lib/actions/calendar";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const dateStr = request.nextUrl.searchParams.get("date");

  if (!dateStr) {
    return NextResponse.json({
      trades: [],
      dailyPerf: null,
      journal: null,
    });
  }

  const date = new Date(`${dateStr}T00:00:00`);

  if (isNaN(date.getTime())) {
    return NextResponse.json({
      trades: [],
      dailyPerf: null,
      journal: null,
    });
  }

  const data = await getDayDetails(date);

  return NextResponse.json(
    data ?? {
      trades: [],
      dailyPerf: null,
      journal: null,
    }
  );
}