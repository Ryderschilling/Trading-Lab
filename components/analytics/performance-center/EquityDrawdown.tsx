"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type Point = {
  date: string; // YYYY-MM-DD
  equity: number;
  drawdown: number; // negative or 0
};

function shortDate(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${m}/${d}`;
}

export function EquityDrawdown({ data }: { data: Point[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Equity Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="#B3B3B3"
                strokeWidth={1}
                tick={{ fontSize: 11, fill: "#B3B3B3" }}
                tickFormatter={shortDate}
                minTickGap={20}
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
                labelFormatter={(l) => `Date: ${l}`}
              />
              <Line
                type="monotone"
                dataKey="equity"
                stroke="#16C784"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Drawdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="#B3B3B3"
                strokeWidth={1}
                tick={{ fontSize: 11, fill: "#B3B3B3" }}
                tickFormatter={shortDate}
                minTickGap={20}
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
                labelFormatter={(l) => `Date: ${l}`}
              />
              <Line
                type="monotone"
                dataKey="drawdown"
                stroke="#EA3943"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}