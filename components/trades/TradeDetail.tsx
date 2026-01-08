"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { format } from "date-fns";
import { updateTrade, deleteTrade } from "@/lib/actions/trades";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Edit, Trash2, Save, X } from "lucide-react";
import Link from "next/link";

interface TradeDetailProps {
  trade: {
    id: string;
    ticker: string;
    assetType: string;
    tradeDate: Date;
    tradeTime: string | null;
    entryPrice: number;
    exitPrice: number | null;
    quantity: number;
    contracts: number | null;
    totalInvested: number;
    totalReturn: number;
    percentReturn: number;
    strategyTag: string | null;
    notes: string | null;
    optionMetadata?: {
      strikePrice: number | null;
      expirationDate: Date | null;
    } | null;
  };
}

export function TradeDetail({ trade: initialTrade }: TradeDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [assetType, setAssetType] = useState(initialTrade.assetType);
  const [entryDate, setEntryDate] = useState(
    format(new Date(initialTrade.tradeDate), "yyyy-MM-dd")
  );
  const [entryTime, setEntryTime] = useState(initialTrade.tradeTime || "");
  const [ticker, setTicker] = useState(initialTrade.ticker);
  const [strikePrice, setStrikePrice] = useState(
    initialTrade.optionMetadata?.strikePrice?.toString() || ""
  );
  const [entryPrice, setEntryPrice] = useState(initialTrade.entryPrice.toString());
  const [exitPrice, setExitPrice] = useState(initialTrade.exitPrice?.toString() || "");
  const [quantity, setQuantity] = useState(initialTrade.quantity.toString());
  const [contracts, setContracts] = useState(initialTrade.contracts?.toString() || "");
  const [strategy, setStrategy] = useState(initialTrade.strategyTag || "");

  // Auto-calculated values
  const [totalInvested, setTotalInvested] = useState("");
  const [realizedProfit, setRealizedProfit] = useState("");
  const [percentProfit, setPercentProfit] = useState("");

  // Auto-calculate when inputs change
  useState(() => {
    const entry = parseFloat(entryPrice) || 0;
    const exit = parseFloat(exitPrice) || entry;
    
    if (assetType === "Option") {
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
  });

  async function handleUpdate() {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("tradeDate", entryDate);
      if (entryTime) formData.append("tradeTime", entryTime);
      formData.append("ticker", ticker.toUpperCase());
      formData.append("assetType", assetType);
      formData.append("entryPrice", entryPrice);
      formData.append("exitPrice", exitPrice || entryPrice);
      
      if (assetType === "Option") {
        formData.append("quantity", contracts);
        formData.append("contracts", contracts);
        if (strikePrice) formData.append("strikePrice", strikePrice);
        if (entryDate) formData.append("expirationDate", entryDate);
      } else {
        formData.append("quantity", quantity);
      }
      
      formData.append("totalInvested", totalInvested);
      formData.append("totalReturn", realizedProfit);
      formData.append("percentReturn", percentProfit);
      
      if (strategy) formData.append("strategyTag", strategy);

      await updateTrade(initialTrade.id, formData);
      
      toast({
        title: "Trade Updated",
        description: "Your trade has been successfully updated.",
        variant: "success",
      });
      
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update trade",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this trade? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      await deleteTrade(initialTrade.id);
      
      toast({
        title: "Trade Deleted",
        description: "Your trade has been successfully deleted.",
        variant: "success",
      });
      
      router.push("/trades");
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete trade",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/trades">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Trades
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit Trade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Asset Type *</Label>
                <Select value={assetType} onValueChange={(value) => setAssetType(value as "Stock" | "Option")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Stock">Stock</SelectItem>
                    <SelectItem value="Option">Option</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Entry Date *</Label>
                <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label>Entry Time</Label>
                <Input type="time" value={entryTime} onChange={(e) => setEntryTime(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Ticker *</Label>
                <Input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} required />
              </div>

              {assetType === "Option" && (
                <div className="space-y-2">
                  <Label>Strike Price *</Label>
                  <Input type="number" step="0.01" value={strikePrice} onChange={(e) => setStrikePrice(e.target.value)} required />
                </div>
              )}

              <div className="space-y-2">
                <Label>Entry Price *</Label>
                <Input type="number" step="0.01" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label>Exit Price</Label>
                <Input type="number" step="0.01" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} />
              </div>

              {assetType === "Stock" ? (
                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Number of Contracts *</Label>
                  <Input type="number" value={contracts} onChange={(e) => setContracts(e.target.value)} required />
                </div>
              )}

              <div className="space-y-2">
                <Label>Total Invested</Label>
                <Input type="text" value={`$${totalInvested}`} readOnly className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label>Realized Profit</Label>
                <Input 
                  type="text" 
                  value={`$${realizedProfit}`} 
                  readOnly 
                  className={`bg-muted ${parseFloat(realizedProfit) >= 0 ? "text-neon-green" : "text-red-500"}`}
                />
              </div>

              <div className="space-y-2">
                <Label>Percent Profit</Label>
                <Input 
                  type="text" 
                  value={`${percentProfit}%`} 
                  readOnly 
                  className={`bg-muted ${parseFloat(percentProfit) >= 0 ? "text-neon-green" : "text-red-500"}`}
                />
              </div>

              <div className="space-y-2">
                <Label>Strategy</Label>
                <Select value={strategy} onValueChange={setStrategy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Day Trade">Day Trade</SelectItem>
                    <SelectItem value="Swing Trade">Swing Trade</SelectItem>
                    <SelectItem value="Long-Term">Long-Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/trades">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trades
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trade Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-muted-foreground">Date</Label>
              <p className="text-lg font-semibold">
                {format(new Date(initialTrade.tradeDate), "MMM dd, yyyy")}
                {initialTrade.tradeTime && ` at ${initialTrade.tradeTime}`}
              </p>
            </div>

            <div>
              <Label className="text-muted-foreground">Ticker</Label>
              <p className="text-lg font-semibold">{initialTrade.ticker}</p>
            </div>

            <div>
              <Label className="text-muted-foreground">Asset Type</Label>
              <p className="text-lg font-semibold">{initialTrade.assetType}</p>
            </div>

            {initialTrade.optionMetadata?.strikePrice && (
              <div>
                <Label className="text-muted-foreground">Strike Price</Label>
                <p className="text-lg font-semibold">${initialTrade.optionMetadata.strikePrice}</p>
              </div>
            )}

            <div>
              <Label className="text-muted-foreground">Entry Price</Label>
              <p className="text-lg font-semibold">${initialTrade.entryPrice.toFixed(2)}</p>
            </div>

            <div>
              <Label className="text-muted-foreground">Exit Price</Label>
              <p className="text-lg font-semibold">
                {initialTrade.exitPrice ? `$${initialTrade.exitPrice.toFixed(2)}` : "N/A"}
              </p>
            </div>

            {initialTrade.assetType === "Stock" ? (
              <div>
                <Label className="text-muted-foreground">Quantity</Label>
                <p className="text-lg font-semibold">{initialTrade.quantity}</p>
              </div>
            ) : (
              <div>
                <Label className="text-muted-foreground">Contracts</Label>
                <p className="text-lg font-semibold">{initialTrade.contracts || 0}</p>
              </div>
            )}

            <div>
              <Label className="text-muted-foreground">Total Invested</Label>
              <p className="text-lg font-semibold">{formatCurrency(initialTrade.totalInvested)}</p>
            </div>

            <div>
              <Label className="text-muted-foreground">Realized Profit</Label>
              <p className={`text-lg font-semibold ${initialTrade.totalReturn >= 0 ? "text-neon-green" : "text-red-500"}`}>
                {formatCurrency(initialTrade.totalReturn)}
              </p>
            </div>

            <div>
              <Label className="text-muted-foreground">Percent Profit</Label>
              <p className={`text-lg font-semibold ${initialTrade.percentReturn >= 0 ? "text-neon-green" : "text-red-500"}`}>
                {formatPercent(initialTrade.percentReturn)}
              </p>
            </div>

            <div>
              <Label className="text-muted-foreground">Strategy</Label>
              <p className="text-lg font-semibold">{initialTrade.strategyTag || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

