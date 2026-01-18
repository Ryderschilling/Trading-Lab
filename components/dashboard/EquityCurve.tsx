"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface EquityCurveProps {
  data: Array<{
    date: Date;
    netPnl: number;
  }>;
}

export function EquityCurve({ data }: EquityCurveProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Equity Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  let runningTotal = 0;
  const chartData = data.map((item) => {
    runningTotal += item.netPnl;
    return {
      date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      equity: runningTotal,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equity Curve</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
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
            <Line
              type="monotone"
              dataKey="equity"
              stroke="#F2F2F2"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

