import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CalendarView } from "@/components/calendar/CalendarView";
import { getCalendarData } from "@/lib/actions/calendar";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  

  const now = new Date();
  const year = Number(searchParams.year) || now.getFullYear();
  const month = Number(searchParams.month) || now.getMonth() + 1;

  const calendarData = await getCalendarData(year, month);

  return (
    <CalendarView
      year={year}
      month={month}
      calendarData={{
        days: calendarData.days ?? [],
        monthlyStats: calendarData.monthlyStats ?? null,
        streaks: calendarData.streaks,
      }}
    />
  );
}
