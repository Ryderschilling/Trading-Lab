"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

type Monthly = {
  year: number;
  month: number;
  netPnl: number;
  tradeCount: number;
  greenDays: number;
  redDays: number;
};

function label(m: Monthly) {
  const mm = String(m.month).padStart(2, "0");
  return `${mm}/${String(m.year).slice(-2)}`;
}

export function MonthlyBreakdown({ data }: { data: Monthly[] }) {
  const chartData = data.map((m) => ({
    name: label(m),
    pnl: m.netPnl,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Month-by-Month Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" opacity={0.3} />
            <XAxis
              dataKey="name"
              stroke="#B3B3B3"
              strokeWidth={1}
              tick={{ fontSize: 11, fill: "#B3B3B3" }}
              interval="preserveStartEnd"
              minTickGap={12}
            />
            <YAxis
              stroke="#B3B3B3"
              strokeWidth={1}
              tick={{ fontSize: 11, fill: "#B3B3B3" }}
              tickFormatter={(v) => formatCurrency(v)}
            />
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