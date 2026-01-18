"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface TimePerformanceProps {
  stats: {
    morningPnl: number;
    afternoonPnl: number;
    eveningPnl: number;
    mondayPnl: number;
    tuesdayPnl: number;
    wednesdayPnl: number;
    thursdayPnl: number;
    fridayPnl: number;
  };
}

export function TimePerformance({ stats }: TimePerformanceProps) {
  const timeOfDayData = [
    { name: "Morning", pnl: stats.morningPnl },
    { name: "Afternoon", pnl: stats.afternoonPnl },
    { name: "Evening", pnl: stats.eveningPnl },
  ];

  const dayOfWeekData = [
    { name: "Mon", pnl: stats.mondayPnl },
    { name: "Tue", pnl: stats.tuesdayPnl },
    { name: "Wed", pnl: stats.wednesdayPnl },
    { name: "Thu", pnl: stats.thursdayPnl },
    { name: "Fri", pnl: stats.fridayPnl },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance by Time of Day</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeOfDayData}>
              <XAxis dataKey="name" stroke="#000" strokeWidth={1} tick={{ fontSize: 11, fill: "#000" }} />
              <YAxis stroke="#000" strokeWidth={1} tick={{ fontSize: 11, fill: "#000" }} tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #000",
                  borderRadius: "0.25rem",
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {timeOfDayData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.pnl >= 0 ? "#22C55E" : "#EF4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance by Day of Week</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dayOfWeekData}>
              <XAxis dataKey="name" stroke="#000" strokeWidth={1} tick={{ fontSize: 11, fill: "#000" }} />
              <YAxis stroke="#000" strokeWidth={1} tick={{ fontSize: 11, fill: "#000" }} tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #000",
                  borderRadius: "0.25rem",
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {dayOfWeekData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.pnl >= 0 ? "#22C55E" : "#EF4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

