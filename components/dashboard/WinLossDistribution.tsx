"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface WinLossDistributionProps {
  stats: {
    winRate: number;
    totalTrades: number;
  };
}

const COLORS = ["#00ff88", "#ef4444"];

export function WinLossDistribution({ stats }: WinLossDistributionProps) {
  const winCount = Math.round((stats.winRate / 100) * stats.totalTrades);
  const lossCount = stats.totalTrades - winCount;

  const data = [
    { name: "Wins", value: winCount },
    { name: "Losses", value: lossCount },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Win/Loss Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

