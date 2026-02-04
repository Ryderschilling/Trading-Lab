"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CalendarDay } from "./CalendarDay";
import { formatCurrency, cn } from "@/lib/utils";

// ✅ Critical: prevent SSR hydration mismatch with Radix Portal Dialog
const DayDetailsModal = dynamic(() => import("./DayDetailsModal").then(m => m.DayDetailsModal), {
  ssr: false,
});

interface CalendarViewProps {
  year: number;
  month: number;
  calendarData: {
    days: Array<{
      dateKey: string; // YYYY-MM-DD
      day: number;
      netPnl: number;
      tradeCount: number;
      hasTrades: boolean;
    }>;
    monthlyStats: any;
    streaks: {
      currentWinStreak: number;
      currentLossStreak: number;
      maxWinStreak: number;
      maxLossStreak: number;
    };
  };
}

function isValidYMD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function dateForDisplay(ymd: string) {
  // Noon UTC avoids visual day rollover
  return new Date(`${ymd}T12:00:00.000Z`);
}

export function CalendarView({ year: initialYear, month: initialMonth, calendarData }: CalendarViewProps) {
  const router = useRouter();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [dayDetails, setDayDetails] = useState<any>(null);
  const [loadingDayDetails, setLoadingDayDetails] = useState(false);
  const [dayDetailsError, setDayDetailsError] = useState<string | null>(null);

  async function handleDayClick(dateKey: string) {
    if (!isValidYMD(dateKey)) {
      setSelectedDateKey(dateKey);
      setDayDetails(null);
      setDayDetailsError("Invalid date");
      return;
    }

    setSelectedDateKey(dateKey);
    setDayDetails(null);
    setDayDetailsError(null);
    setLoadingDayDetails(true);

    try {
      const res = await fetch(`/api/calendar/day?date=${dateKey}`, { cache: "no-store" });
      const body = await res.json().catch(() => null);

      if (!res.ok) throw new Error(body?.error || "Failed to load day details");
      setDayDetails(body);
    } catch (e) {
      setDayDetails(null);
      setDayDetailsError(e instanceof Error ? e.message : "Failed to load day details");
    } finally {
      setLoadingDayDetails(false);
    }
  }

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  function handlePrevMonth() {
    const newMonth = month === 1 ? 12 : month - 1;
    const newYear = month === 1 ? year - 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    router.push(`/calendar?year=${newYear}&month=${newMonth}`);
  }

  function handleNextMonth() {
    const newMonth = month === 12 ? 1 : month + 1;
    const newYear = month === 12 ? year + 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    router.push(`/calendar?year=${newYear}&month=${newMonth}`);
  }

  const { days, monthlyStats, streaks } = calendarData;

  // Only for layout alignment
  const firstDay = new Date(year, month - 1, 1);
  const startOffset = firstDay.getDay();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Trading Calendar</h1>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handlePrevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-lg font-semibold min-w-[180px] text-center">
            {monthNames[month - 1]} {year}
          </span>
          <Button variant="outline" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {monthlyStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly P&L</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className={cn(
                "text-2xl font-bold",
                monthlyStats.netPnl > 0 ? "text-green-500" : monthlyStats.netPnl < 0 ? "text-red-500" : "text-foreground"
              )}>
                {formatCurrency(monthlyStats.netPnl)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Green Days</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{monthlyStats.greenDays}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Red Days</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{monthlyStats.redDays}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Trades</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{monthlyStats.tradeCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Current Win Streak", value: streaks.currentWinStreak },
          { label: "Current Loss Streak", value: streaks.currentLossStreak },
          { label: "Best Win Streak", value: streaks.maxWinStreak },
          { label: "Worst Loss Streak", value: streaks.maxLossStreak },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Smaller calendar to reduce scroll */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-1.5">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-1">
                {day}
              </div>
            ))}

            {Array.from({ length: startOffset }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-[84px] md:h-[92px]" />
            ))}

            {days.map((day) => (
              <CalendarDay key={day.dateKey} day={day} onClick={() => handleDayClick(day.dateKey)} />
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedDateKey && (
        <DayDetailsModal
          date={dateForDisplay(selectedDateKey)}
          data={dayDetails}
          loading={loadingDayDetails}
          error={dayDetailsError}
          onClose={() => {
            setSelectedDateKey(null);
            setDayDetails(null);
            setDayDetailsError(null);
          }}
        />
      )}
    </div>
  );
}
