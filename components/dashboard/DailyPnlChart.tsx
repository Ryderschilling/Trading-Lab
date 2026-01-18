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
            <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" opacity={0.3} />
            <XAxis dataKey="date" stroke="#B3B3B3" strokeWidth={1} tick={{ fontSize: 11, fill: "#B3B3B3" }} />
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
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "#16C784" : "#EA3943"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

