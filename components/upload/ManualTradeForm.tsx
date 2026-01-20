"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTrade } from "@/lib/actions/trades";
import { useToast } from "@/components/ui/use-toast";

export function ManualTradeForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [assetType, setAssetType] = useState<"Stock" | "Call" | "Put">("Stock");
  
  // Form state
  const [tradeDate, setTradeDate] = useState("");
  const [ticker, setTicker] = useState("");
  const [strikePrice, setStrikePrice] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [contracts, setContracts] = useState("");

  // Auto-calculated values
  const [totalInvested, setTotalInvested] = useState("");
  const [realizedProfit, setRealizedProfit] = useState("");
  const [percentProfit, setPercentProfit] = useState("");

  // Auto-calculate when inputs change
  useEffect(() => {
    const entry = parseFloat(entryPrice) || 0;
    const exit = parseFloat(exitPrice) || entry;
    
    if (assetType === "Call" || assetType === "Put") {
      const contractsNum = parseFloat(contracts) || 0;
      const totalInv = entry * contractsNum * 100;
      const profit = (exit - entry) * contractsNum * 100;
      const percent = totalInv > 0 ? (profit / totalInv) * 100 : 0;
      
      setTotalInvested(totalInv.toFixed(2));
      setRealizedProfit(profit.toFixed(2));
      setPercentProfit(percent.toFixed(2));
    } else {
      const qty = parseFloat(quantity) || 0;
      const totalInv = entry * qty;
      const profit = (exit - entry) * qty;
      const percent = totalInv > 0 ? (profit / totalInv) * 100 : 0;
      
      setTotalInvested(totalInv.toFixed(2));
      setRealizedProfit(profit.toFixed(2));
      setPercentProfit(percent.toFixed(2));
    }
  }, [entryPrice, exitPrice, quantity, contracts, assetType]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      
      // Use tradeDate (date-only)
      const finalTradeDate = tradeDate || new Date().toISOString().split("T")[0];
      formData.append("tradeDate", finalTradeDate);
      
      formData.append("ticker", ticker.toUpperCase());
      formData.append("assetType", assetType);
      formData.append("entryPrice", entryPrice);
      formData.append("exitPrice", exitPrice || entryPrice);
      
      if (assetType === "Call" || assetType === "Put") {
        formData.append("quantity", contracts); // Use contracts as quantity for options
        formData.append("contracts", contracts);
        if (strikePrice) formData.append("strikePrice", strikePrice);
      } else {
        formData.append("quantity", quantity);
      }
      
      formData.append("totalInvested", totalInvested);
      formData.append("totalReturn", realizedProfit);
      formData.append("percentReturn", percentProfit);
      
      try {
        await createTrade(formData);
      
        toast({
          title: "Trade Saved",
          description: "Your trade has been successfully saved.",
          variant: "success",
        });
      
        router.refresh();
        // reset form ...
      } catch (err: any) {
        console.error("createTrade error:", err);
        toast({
          title: "Error saving trade",
          description: err?.message ? String(err.message) : "An error occurred while saving the trade.",
          variant: "destructive",
        });
        // do not rethrow — we handled the error and will let the UI continue
      }
      setTradeDate("");
      setTicker("");
      setStrikePrice("");
      setEntryPrice("");
      setExitPrice("");
      setQuantity("");
      setContracts("");
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save trade",
        variant: "destructive",
      });
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
          {/* Asset Type Selector */}
          <div className="space-y-2">
            <Label htmlFor="assetType">Asset Type *</Label>
            <Select value={assetType} onValueChange={(value) => setAssetType(value as "Stock" | "Call" | "Put")} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Stock">Stock</SelectItem>
                <SelectItem value="Call">Call</SelectItem>
                <SelectItem value="Put">Put</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trade Date */}
            <div className="space-y-2">
              <Label htmlFor="tradeDate">Trade Date *</Label>
              <Input 
                id="tradeDate" 
                type="date" 
                value={tradeDate}
                onChange={(e) => setTradeDate(e.target.value)}
                required 
              />
            </div>

            {/* Ticker */}
            <div className="space-y-2">
              <Label htmlFor="ticker">Ticker *</Label>
              <Input 
                id="ticker" 
                placeholder="AAPL" 
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                required 
              />
            </div>

            {/* Strike Price (Options only) */}
            {(assetType === "Call" || assetType === "Put") && (
              <div className="space-y-2">
                <Label htmlFor="strikePrice">Strike Price *</Label>
                <Input 
                  id="strikePrice" 
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9.]*"
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="150.00"
                  value={strikePrice}
                  onChange={(e) => setStrikePrice(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Entry Price */}
            <div className="space-y-2">
              <Label htmlFor="entryPrice">Entry Price *</Label>
              <Input 
                id="entryPrice" 
                type="text"
                inputMode="decimal"
                pattern="[0-9.]*"
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="150.00"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                required 
              />
            </div>

            {/* Exit Price */}
            <div className="space-y-2">
              <Label htmlFor="exitPrice">Exit Price</Label>
              <Input 
                id="exitPrice" 
                type="text"
                inputMode="decimal"
                pattern="[0-9.]*"
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="155.00"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
              />
            </div>

            {/* Quantity (Stock) or Contracts (Option) */}
            {assetType === "Stock" ? (
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input 
                  id="quantity" 
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="100"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required 
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="contracts">Number of Contracts *</Label>
                <Input 
                  id="contracts" 
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="5"
                  value={contracts}
                  onChange={(e) => setContracts(e.target.value)}
                  required 
                />
              </div>
            )}

            {/* Auto-calculated: Total Invested */}
            <div className="space-y-2">
              <Label htmlFor="totalInvested">Total Invested</Label>
              <Input 
                id="totalInvested" 
                type="text" 
                value={`$${totalInvested}`}
                readOnly
                className="bg-muted"
              />
            </div>

            {/* Auto-calculated: Realized Profit */}
            <div className="space-y-2">
              <Label htmlFor="realizedProfit">Realized Profit</Label>
              <Input 
                id="realizedProfit" 
                type="text" 
                value={`$${realizedProfit}`}
                readOnly
                className={`bg-muted ${parseFloat(realizedProfit) >= 0 ? "text-green-500" : "text-red-500"}`}
              />
            </div>

            {/* Auto-calculated: Percent Profit */}
            <div className="space-y-2">
              <Label htmlFor="percentProfit">Percent Profit</Label>
              <Input 
                id="percentProfit" 
                type="text" 
                value={`${percentProfit}%`}
                readOnly
                className={`bg-muted ${parseFloat(percentProfit) >= 0 ? "text-green-500" : "text-red-500"}`}
              />
            </div>

          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Trade"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
