"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface OptionsStatsProps {
  stats: {
    callsPnl: number;
    putsPnl: number;
    stocksPnl: number;
    zeroDTEPnl: number;
    weeklyPnl: number;
    monthlyPnl: number;
  };
}

// Removed COLORS - using red/green only for performance values

export function OptionsStats({ stats }: OptionsStatsProps) {
  const assetData = [
    { name: "Calls", pnl: stats.callsPnl },
    { name: "Puts", pnl: stats.putsPnl },
    { name: "Stocks", pnl: stats.stocksPnl },
  ];

  const expiryData = [
    { name: "0DTE", pnl: stats.zeroDTEPnl },
    { name: "Weekly", pnl: stats.weeklyPnl },
    { name: "Monthly", pnl: stats.monthlyPnl },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance by Asset Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={assetData}>
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
                {assetData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "#22C55E" : "#EF4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance by Expiry</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expiryData}>
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
                {expiryData.map((entry, index) => (
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

