"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

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
              <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" opacity={0.3} />
              <XAxis dataKey="name" stroke="#B3B3B3" strokeWidth={1} tick={{ fontSize: 11, fill: "#B3B3B3" }} />
              <YAxis stroke="#B3B3B3" strokeWidth={1} tick={{ fontSize: 11, fill: "#B3B3B3" }} tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#141414",
                  border: "1px solid #1F1F1F",
                  borderRadius: "0.5rem",
                  color: "#F2F2F2",
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                {timeOfDayData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.pnl >= 0 ? "#16C784" : "#EA3943"}
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
              <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" opacity={0.3} />
              <XAxis dataKey="name" stroke="#B3B3B3" strokeWidth={1} tick={{ fontSize: 11, fill: "#B3B3B3" }} />
              <YAxis stroke="#B3B3B3" strokeWidth={1} tick={{ fontSize: 11, fill: "#B3B3B3" }} tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#141414",
                  border: "1px solid #1F1F1F",
                  borderRadius: "0.5rem",
                  color: "#F2F2F2",
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                {dayOfWeekData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.pnl >= 0 ? "#16C784" : "#EA3943"}
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

