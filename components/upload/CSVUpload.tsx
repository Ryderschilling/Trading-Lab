"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Papa from "papaparse";
import { createTrade } from "@/lib/actions/trades";
import { parseRobinhoodCSV, ParsedTrade } from "@/lib/utils/robinhoodParser";

interface CSVRow {
  tradeDate: string;
  tradeTime?: string;
  ticker: string;
  assetType: string;
  expirationDate?: string;
  strikePrice?: string;
  entryPrice: string;
  exitPrice?: string;
  quantity: string;
  contracts?: string;
  totalInvested?: string;
  totalReturn?: string;
  percentReturn?: string;
  strategyTag?: string;
  notes?: string;
}

export function CSVUpload() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [csvType, setCsvType] = useState<"robinhood" | "custom">("robinhood");

  const isRobinhoodCSV = (headers: string[]): boolean => {
    const robinhoodColumns = ["Symbol", "Side", "Quantity", "Price", "Fees", "Date", "Time"];
    return robinhoodColumns.some(col => headers.includes(col)) || 
           headers.some(h => h.toLowerCase().includes("robinhood"));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileText = await file.text();
    
      // First, try to detect if it's Robinhood format
      Papa.parse(fileText, {
        header: true,
        skipEmptyLines: true,
        preview: 1, // Just check first row
        complete: (results) => {
          if (results.errors.length > 0 && results.errors[0].row !== 0) {
            // Ignore errors if we're just previewing
          }

          const headers = Object.keys(results.data[0] || {});
          const isRobinhood = isRobinhoodCSV(headers);
          setCsvType(isRobinhood ? "robinhood" : "custom");

          if (isRobinhood) {
            try {
              const parsed = parseRobinhoodCSV(fileText);
              setPreview(parsed.slice(0, 5));
              setError(null);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to parse Robinhood CSV");
            }
          } else {
            // Parse as custom format
            Papa.parse<CSVRow>(fileText, {
              header: true,
              skipEmptyLines: true,
              complete: (fullResults) => {
                setPreview(fullResults.data.slice(0, 5));
                setError(null);
              },
            });
          }
        },
        error: (error) => {
          setError(`Failed to parse CSV: ${error.message}`);
        },
      });
  };

  const handleUpload = async () => {
    const fileInput = document.getElementById("csvFile") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fileText = await file.text();
      let tradesToUpload: ParsedTrade[] = [];

      if (csvType === "robinhood") {
        // Parse Robinhood CSV
        tradesToUpload = parseRobinhoodCSV(fileText);
      } else {
        // Parse custom CSV format
        const parsePromise = new Promise<ParsedTrade[]>((resolve, reject) => {
          Papa.parse<CSVRow>(fileText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              const trades = results.data.map((row) => ({
                tradeDate: row.tradeDate,
                tradeTime: row.tradeTime,
                ticker: row.ticker,
                assetType: row.assetType,
                expirationDate: row.expirationDate,
                strikePrice: row.strikePrice,
                entryPrice: row.entryPrice,
                exitPrice: row.exitPrice,
                quantity: row.quantity,
                contracts: row.contracts,
                totalInvested: row.totalInvested,
                totalReturn: row.totalReturn,
                percentReturn: row.percentReturn,
                strategyTag: row.strategyTag,
                notes: row.notes,
              }));
              resolve(trades);
            },
            error: reject,
          });
        });
        tradesToUpload = await parsePromise;
      }

      if (tradesToUpload.length === 0) {
        setError("No valid trades found in CSV file");
        setLoading(false);
        return;
      }

      // Upload all trades
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      
      for (const trade of tradesToUpload) {
        try {
          const formData = new FormData();
          
          // Ensure all required fields are present with valid values
          formData.append("tradeDate", trade.tradeDate || new Date().toISOString().split("T")[0]);
          if (trade.tradeTime) formData.append("tradeTime", trade.tradeTime);
          formData.append("ticker", trade.ticker || "");
          formData.append("assetType", trade.assetType || "Stock");
          formData.append("entryPrice", trade.entryPrice || "0");
          if (trade.exitPrice) formData.append("exitPrice", trade.exitPrice);
          formData.append("quantity", trade.quantity || "0");
          if (trade.contracts) formData.append("contracts", trade.contracts);
          formData.append("totalInvested", trade.totalInvested || "0");
          formData.append("totalReturn", trade.totalReturn || "0");
          if (trade.percentReturn) formData.append("percentReturn", trade.percentReturn);
          if (trade.strategyTag) formData.append("strategyTag", trade.strategyTag);
          if (trade.notes) formData.append("notes", trade.notes);
          if (trade.expirationDate) formData.append("expirationDate", trade.expirationDate);
          if (trade.strikePrice) formData.append("strikePrice", trade.strikePrice);

          // Validate required fields
          if (!trade.ticker || !trade.tradeDate || !trade.entryPrice) {
            throw new Error(`Missing required fields for trade: ${trade.ticker || "Unknown"}`);
          }

          await createTrade(formData);
          successCount++;
        } catch (err) {
          console.error("Error creating trade:", err);
          errorCount++;
          const errorMsg = err instanceof Error ? err.message : "Unknown error";
          errors.push(`${trade.ticker || "Unknown"}: ${errorMsg}`);
        }
      }

      if (errorCount > 0) {
        const errorMessage = `${successCount} trades uploaded successfully, ${errorCount} failed.${errors.length > 0 ? ` Errors: ${errors.slice(0, 3).join("; ")}${errors.length > 3 ? "..." : ""}` : ""}`;
        setError(errorMessage);
      } else {
        setError(null);
        // Show success message briefly
        setTimeout(() => {
          router.refresh();
          setPreview([]);
          fileInput.value = "";
        }, 1000);
      }

      if (errorCount === 0) {
        router.refresh();
        setPreview([]);
        fileInput.value = "";
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload trades. Please check the CSV format.");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "tradeDate",
      "tradeTime",
      "ticker",
      "assetType",
      "expirationDate",
      "strikePrice",
      "entryPrice",
      "exitPrice",
      "quantity",
      "contracts",
      "totalInvested",
      "totalReturn",
      "percentReturn",
      "strategyTag",
      "notes",
    ];

    const csv = [headers.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trades_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSV Upload</CardTitle>
        <CardDescription>
          Upload your trades via CSV file. Supports Robinhood CSV exports or custom format.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Button onClick={downloadTemplate} variant="outline">
            Download CSV Template
          </Button>

          <div className="space-y-2">
            <Label htmlFor="csvFile">Select CSV File</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
            />
          </div>

          {preview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Preview (first 5 rows)</h3>
                {csvType === "robinhood" && (
                  <span className="text-xs bg-neon-green/20 text-neon-green px-2 py-1 rounded">
                    ✓ Robinhood Format Detected
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border border-border rounded-lg">
                  <thead>
                    <tr className="bg-muted">
                      {Object.keys(preview[0]).map((key) => (
                        <th key={key} className="p-2 text-left text-sm">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((value, vIdx) => (
                          <td key={vIdx} className="p-2 text-sm border-t border-border">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Button onClick={handleUpload} disabled={loading || preview.length === 0} className="w-full">
            {loading ? "Uploading..." : "Upload Trades"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

