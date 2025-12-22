"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createTrade } from "@/lib/actions/trades";
import { formatCurrency } from "@/lib/utils";

export function ManualTradeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Calculate total return and percent return if not provided
      const entryPrice = parseFloat(formData.get("entryPrice") as string);
      const exitPrice = formData.get("exitPrice") ? parseFloat(formData.get("exitPrice") as string) : entryPrice;
      const quantity = parseInt(formData.get("quantity") as string);
      const contracts = formData.get("contracts") ? parseInt(formData.get("contracts") as string) : 0;
      const totalInvestedInput = formData.get("totalInvested") as string;
      
      let totalInvested = totalInvestedInput ? parseFloat(totalInvestedInput) : entryPrice * quantity * (contracts || 1);
      let totalReturn = totalInvestedInput ? parseFloat(formData.get("totalReturn") as string) : (exitPrice - entryPrice) * quantity * (contracts || 1);
      let percentReturn = totalInvestedInput && formData.get("percentReturn") 
        ? parseFloat(formData.get("percentReturn") as string)
        : totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

      formData.set("totalInvested", totalInvested.toString());
      formData.set("totalReturn", totalReturn.toString());
      formData.set("percentReturn", percentReturn.toString());

      await createTrade(formData);
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trade");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Trade Entry</CardTitle>
        <CardDescription>Enter your trade details below</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="tradeDate">Trade Date *</Label>
              <Input id="tradeDate" name="tradeDate" type="date" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tradeTime">Trade Time</Label>
              <Input id="tradeTime" name="tradeTime" type="time" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticker">Ticker *</Label>
              <Input id="ticker" name="ticker" placeholder="AAPL" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assetType">Asset Type *</Label>
              <Select name="assetType" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select asset type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stock">Stock</SelectItem>
                  <SelectItem value="Call">Call</SelectItem>
                  <SelectItem value="Put">Put</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expirationDate">Expiration Date (Options only)</Label>
              <Input id="expirationDate" name="expirationDate" type="date" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strikePrice">Strike Price (Options only)</Label>
              <Input id="strikePrice" name="strikePrice" type="number" step="0.01" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryPrice">Entry Price *</Label>
              <Input id="entryPrice" name="entryPrice" type="number" step="0.01" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exitPrice">Exit Price</Label>
              <Input id="exitPrice" name="exitPrice" type="number" step="0.01" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input id="quantity" name="quantity" type="number" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contracts">Contracts (Options only)</Label>
              <Input id="contracts" name="contracts" type="number" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalInvested">Total Invested ($)</Label>
              <Input id="totalInvested" name="totalInvested" type="number" step="0.01" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalReturn">Total Return ($)</Label>
              <Input id="totalReturn" name="totalReturn" type="number" step="0.01" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="percentReturn">Percent Return (%)</Label>
              <Input id="percentReturn" name="percentReturn" type="number" step="0.01" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strategyTag">Strategy Tag</Label>
              <Input id="strategyTag" name="strategyTag" placeholder="e.g., Scalping, Swing" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={4} placeholder="Additional notes about this trade..." />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Trade"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

