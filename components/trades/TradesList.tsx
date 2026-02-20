"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { format } from "date-fns";
import { Search, Filter, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteAllTrades } from "@/lib/actions/trades";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateUTC } from "@/lib/utils/formatDateUTC"

interface Trade {
  id: string;
  ticker: string;
  assetType: string;
  tradeDate: Date;
  totalReturn: number;
  percentReturn: number;
  optionMetadata?: {
    strikePrice: number | null;
    expirationDate: Date | null;
  } | null;
}

interface TradesListProps {
  trades: Trade[];
}

export function TradesList({ trades }: TradesListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>("all");
  const [profitFilter, setProfitFilter] = useState<string>("all");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  async function handleDeleteAll() {
    setDeleting(true);
    try {
      const result = await deleteAllTrades();
      toast({
        title: "Trades Deleted",
        description: `Successfully deleted ${result.count} trade${result.count !== 1 ? 's' : ''}.`,
        variant: "success",
      });
      setDeleteDialogOpen(false);
      router.refresh();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete trades",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      // Search filter (ticker only)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTicker = trade.ticker.toLowerCase().includes(query);
        if (!matchesTicker) return false;
      }

      // Asset type filter
      if (assetTypeFilter !== "all") {
        if (assetTypeFilter === "Stock" && trade.assetType !== "Stock") return false;
        if (assetTypeFilter === "Option" && trade.assetType === "Stock") return false;
      }

      // Profit filter
      if (profitFilter !== "all") {
        if (profitFilter === "win" && trade.totalReturn <= 0) return false;
        if (profitFilter === "loss" && trade.totalReturn >= 0) return false;
      }

      // Date range filter
      if (dateRangeStart) {
        const startDate = new Date(dateRangeStart);
        if (new Date(trade.tradeDate) < startDate) return false;
      }
      if (dateRangeEnd) {
        const endDate = new Date(dateRangeEnd);
        endDate.setHours(23, 59, 59, 999);
        if (new Date(trade.tradeDate) > endDate) return false;
      }

      return true;
    });
  }, [trades, searchQuery, assetTypeFilter, profitFilter, dateRangeStart, dateRangeEnd]);

  if (trades.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <p className="text-muted-foreground">
            No trades yet. Start by adding your first trade!
          </p>
          <div className="flex justify-center">
            <Link href="/upload">
              <Button>Add Trade</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Delete All button */}
      {trades.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={deleting}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? "Deleting..." : "Delete All Trades"}
          </Button>
        </div>
      )}

      {/* Delete All Trades Modal */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete all trades?</DialogTitle>
            <DialogDescription>
              This action permanently deletes all trade history and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={deleting}
            >
              Delete all trades
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by ticker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Asset Type</label>
                <Select value={assetTypeFilter} onValueChange={setAssetTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Stock">Stock</SelectItem>
                    <SelectItem value="Option">Option</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Profit</label>
                <Select value={profitFilter} onValueChange={setProfitFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="win">Wins</SelectItem>
                    <SelectItem value="loss">Losses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                />
              </div>
            </div>

            {/* Clear Filters */}
            {(searchQuery || assetTypeFilter !== "all" || profitFilter !== "all" || dateRangeStart || dateRangeEnd) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setAssetTypeFilter("all");
                  setProfitFilter("all");
                  setDateRangeStart("");
                  setDateRangeEnd("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trades Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-4 text-left text-sm font-medium">Date</th>
                  <th className="p-4 text-left text-sm font-medium">Ticker</th>
                  <th className="p-4 text-left text-sm font-medium">Asset Type</th>
                  <th className="p-4 text-right text-sm font-medium">Profit $</th>
                  <th className="p-4 text-right text-sm font-medium">% Profit</th>
                  <th className="p-4 text-center text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No trades match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredTrades.map((trade) => (
                    <tr key={trade.id} className="border-t border-border hover:bg-muted/50">
                      <td className="p-4 text-sm">
                        {formatDateUTC(trade.tradeDate)}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold">{trade.ticker}</div>
                        {trade.assetType === "Option" && trade.optionMetadata?.strikePrice && (
                          <div className="text-xs text-muted-foreground">
                            ${trade.optionMetadata.strikePrice}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm">{trade.assetType}</td>
                      <td className={`p-4 text-right font-semibold ${trade.totalReturn >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {formatCurrency(trade.totalReturn)}
                      </td>
                      <td className={`p-4 text-right ${trade.percentReturn >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {formatPercent(trade.percentReturn)}
                      </td>
                      <td className="p-4 text-center">
                        <Link href={`/trades/${trade.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

