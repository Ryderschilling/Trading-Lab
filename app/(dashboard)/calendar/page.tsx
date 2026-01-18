import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CalendarView } from "@/components/calendar/CalendarView";
import { getCalendarData } from "@/lib/actions/calendar";

export const dynamic = 'force-dynamic';

interface CalendarPageProps {
  searchParams: {
    year?: string;
    month?: string;
  };
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const now = new Date();
  const year = searchParams.year ? parseInt(searchParams.year) : now.getFullYear();
  const month = searchParams.month ? parseInt(searchParams.month) : now.getMonth() + 1;

  const calendarData = await getCalendarData(year, month);

  // Ensure calendarData has all required fields
  const normalizedCalendarData = {
    days: calendarData.days || [],
    monthlyStats: calendarData.monthlyStats || null,
    streaks: calendarData.streaks || {
      currentWinStreak: 0,
      currentLossStreak: 0,
      maxWinStreak: 0,
      maxLossStreak: 0,
    },
  };

  return <CalendarView year={year} month={month} calendarData={normalizedCalendarData} />;
}

