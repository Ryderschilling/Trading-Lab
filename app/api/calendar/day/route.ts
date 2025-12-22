import { NextRequest, NextResponse } from "next/server";
import { getDayDetails } from "@/lib/actions/calendar";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    const data = await getDayDetails(date);

    if (!data) {
      return NextResponse.json(
        { error: "Day not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching day details:", error);
    return NextResponse.json(
      { error: "Failed to fetch day details" },
      { status: 500 }
    );
  }
}

