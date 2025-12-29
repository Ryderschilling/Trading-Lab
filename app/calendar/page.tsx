import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CalendarView } from "@/components/calendar/CalendarView";

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

  return <CalendarView year={year} month={month} />;
}

