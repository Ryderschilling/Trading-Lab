"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CalendarDay } from "./CalendarDay";
import { DayDetailsModal } from "./DayDetailsModal";
import { formatCurrency, cn } from "@/lib/utils";

interface CalendarViewProps {
  year: number;
  month: number;
  calendarData: {
    days: any[];
    monthlyStats: any;
    streaks: {
      currentWinStreak: number;
      currentLossStreak: number;
      maxWinStreak: number;
      maxLossStreak: number;
    };
  };
}

export function CalendarView({ year: initialYear, month: initialMonth, calendarData: initialCalendarData }: CalendarViewProps) {
  const router = useRouter();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayDetails, setDayDetails] = useState<any>(null);
  const [loadingDayDetails, setLoadingDayDetails] = useState(false);

  async function handleDayClick(date: Date) {
    setSelectedDate(date);
    setLoadingDayDetails(true);
    try {
      const dateStr = date.toISOString().split("T")[0];
      const response = await fetch(`/api/calendar/day?date=${dateStr}`);
      if (!response.ok) {
        throw new Error("Failed to load day details");
      }
      const details = await response.json();
      setDayDetails(details);
    } catch (error) {
      console.error("Failed to load day details:", error);
    } finally {
      setLoadingDayDetails(false);
    }
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

  const { days, monthlyStats, streaks } = initialCalendarData;

  // Get first day of month to determine offset
  const firstDay = new Date(year, month - 1, 1);
  const startOffset = firstDay.getDay();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Trading Calendar</h1>
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handlePrevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xl font-semibold min-w-[200px] text-center">
            {monthNames[month - 1]} {year}
          </span>
          <Button variant="outline" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Monthly Stats */}
      {monthlyStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly P&L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                monthlyStats.netPnl > 0 ? "text-[#16C784]" : monthlyStats.netPnl < 0 ? "text-[#EA3943]" : "text-foreground"
              )}>
                {formatCurrency(monthlyStats.netPnl)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Green Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {monthlyStats.greenDays}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Red Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {monthlyStats.redDays}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Trades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {monthlyStats.tradeCount}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Streaks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Win Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {streaks.currentWinStreak}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Loss Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {streaks.currentLossStreak}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Best Win Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {streaks.maxWinStreak}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Worst Loss Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {streaks.maxLossStreak}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
            {Array.from({ length: startOffset }).map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square" />
            ))}
            {days.map((day: any) => (
              <CalendarDay
                key={day.day}
                day={day}
                onClick={() => handleDayClick(day.date)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <DayDetailsModal
          date={selectedDate}
          data={dayDetails}
          loading={loadingDayDetails}
          onClose={() => {
            setSelectedDate(null);
            setDayDetails(null);
          }}
        />
      )}
    </div>
  );
}

