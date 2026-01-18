"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface DailyPnlChartProps {
  data: Array<{
    date: Date;
    netPnl: number;
  }>;
}

export function DailyPnlChart({ data }: DailyPnlChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily P&L (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    pnl: item.netPnl,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily P&L (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="date" stroke="#000" strokeWidth={1} tick={{ fontSize: 11, fill: "#000" }} />
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
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "#22C55E" : "#EF4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

