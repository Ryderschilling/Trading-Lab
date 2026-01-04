"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import Papa from "papaparse";
import { createTrade } from "@/lib/actions/trades";
import { parseBrokerCSV, ParsedTrade } from "@/lib/utils/brokerCSVParser";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ROWS = 10000; // Maximum number of rows to process

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
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [csvType, setCsvType] = useState<"broker" | "custom">("broker");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalTrades, setTotalTrades] = useState(0);

  const isBrokerCSV = (headers: string[]): boolean => {
    // Check for standard broker CSV format columns
    const brokerColumns = [
      "Activity Date", "Process Date", "Settle Date", "Instrument", 
      "Description", "Trans Code", "Quantity", "Price", "Amount"
    ];
    const oldFormatColumns = ["Symbol", "Side", "Quantity", "Price", "Fees", "Date", "Time"];
    
    // Check if it has the new format columns
    const hasNewFormat = brokerColumns.some(col => 
      headers.some(h => h.toLowerCase() === col.toLowerCase())
    );
    
    // Check if it has the old format columns
    const hasOldFormat = oldFormatColumns.some(col => 
      headers.some(h => h.toLowerCase() === col.toLowerCase())
    );
    
    // Also check for Robinhood-specific indicators
    const hasRobinhoodIndicator = headers.some(h => 
      h.toLowerCase().includes("robinhood") || 
      h.toLowerCase().includes("activity date") ||
      h.toLowerCase().includes("trans code")
    );
    
    return hasNewFormat || hasOldFormat || hasRobinhoodIndicator;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      const errorMsg = "Please select a CSV file (.csv extension required)";
      setError(errorMsg);
      toast({
        title: "Invalid File Type",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const errorMsg = `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit. Please select a smaller file.`;
      setError(errorMsg);
      toast({
        title: "File Too Large",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    setError(null);
    setUploadProgress(0);
    setPreview([]);
    
    try {
      const fileText = await file.text();
      
      // First, try to detect if it's broker format
      Papa.parse(fileText, {
      header: true,
      skipEmptyLines: true,
      preview: 1, // Just check first row
      complete: (results) => {
        if (results.errors.length > 0 && results.errors[0].row !== 0) {
          // Ignore errors if we're just previewing
        }

        const headers = Object.keys(results.data[0] || {});
        console.log("CSV Headers detected:", headers);
        const isBroker = isBrokerCSV(headers);
        console.log("Is Broker CSV:", isBroker);
        setCsvType(isBroker ? "broker" : "custom");

        if (isBroker) {
          try {
            const parsed = parseBrokerCSV(fileText);
            console.log("Parsed trades:", parsed.length);
            if (parsed.length > 0) {
              setPreview(parsed.slice(0, 5).map(t => ({
                tradeDate: t.tradeDate,
                tradeTime: t.tradeTime,
                ticker: t.ticker,
                assetType: t.assetType,
                expirationDate: t.expirationDate,
                strikePrice: t.strikePrice,
                entryPrice: t.entryPrice,
                exitPrice: t.exitPrice,
                quantity: t.quantity,
                contracts: t.contracts,
                totalInvested: t.totalInvested,
                totalReturn: t.totalReturn,
                percentReturn: t.percentReturn,
                strategyTag: t.strategyTag,
                notes: t.notes,
              })));
              setError(null);
            } else {
              const errorMsg = "No valid trades found in CSV file. Please check the file format.";
              setError(errorMsg);
              toast({
                title: "No Trades Found",
                description: errorMsg,
                variant: "destructive",
              });
            }
          } catch (err) {
            console.error("Parse error:", err);
            const errorMsg = err instanceof Error ? err.message : "Failed to parse broker CSV";
            setError(errorMsg);
            toast({
              title: "Parse Error",
              description: errorMsg,
              variant: "destructive",
            });
          }
        } else {
          // Parse as custom format
          Papa.parse<CSVRow>(fileText, {
            header: true,
            skipEmptyLines: true,
            complete: (fullResults) => {
              if (fullResults.data.length === 0) {
                const errorMsg = "CSV file appears to be empty or has no valid rows.";
                setError(errorMsg);
                toast({
                  title: "Empty File",
                  description: errorMsg,
                  variant: "destructive",
                });
              } else {
                setTotalTrades(fullResults.data.length);
                setPreview(fullResults.data.slice(0, 5));
                setError(null);
              }
            },
            error: (parseError: Error) => {
              const errorMsg = `Failed to parse CSV: ${parseError.message}`;
              setError(errorMsg);
              toast({
                title: "Parse Error",
                description: errorMsg,
                variant: "destructive",
              });
            },
          });
        }
      },
      error: (error: Error) => {
        console.error("CSV parse error:", error);
        const errorMsg = `Failed to parse CSV: ${error.message}`;
        setError(errorMsg);
        toast({
          title: "Parse Error",
          description: errorMsg,
          variant: "destructive",
        });
      },
    });
    } catch (err) {
      const errorMsg = "Failed to read file. Please try again.";
      setError(errorMsg);
      toast({
        title: "File Read Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
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

      if (csvType === "broker") {
        // Parse broker CSV
        try {
          tradesToUpload = parseBrokerCSV(fileText);
        } catch (parseError) {
          const errorMessage = parseError instanceof Error ? parseError.message : "Failed to parse broker CSV";
          console.error("CSV Parse Error:", parseError);
          setError(`CSV Parsing Error: ${errorMessage}. Please ensure your CSV file is a valid broker export.`);
          setLoading(false);
          return;
        }
      } else {
        // Parse custom CSV format
        const parsePromise = new Promise<ParsedTrade[]>((resolve, reject) => {
          Papa.parse<CSVRow>(fileText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              const trades: ParsedTrade[] = results.data.map((row) => ({
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
                totalReturn: row.totalReturn || "0",
                percentReturn: row.percentReturn,
                strategyTag: row.strategyTag,
                notes: row.notes,
              }));
              resolve(trades);
            },
            error: (error: Error) => reject(error),
          });
        });
        tradesToUpload = await parsePromise;
        setTotalTrades(tradesToUpload.length);
      }

      if (tradesToUpload.length === 0) {
        const errorMsg = "No valid trades found in CSV file";
        setError(errorMsg);
        toast({
          title: "No Trades Found",
          description: errorMsg,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Limit number of trades to process
      if (tradesToUpload.length > MAX_ROWS) {
        const errorMsg = `File contains ${tradesToUpload.length} trades, but maximum ${MAX_ROWS} trades are allowed per upload. Please split your file.`;
        setError(errorMsg);
        toast({
          title: "Too Many Trades",
          description: errorMsg,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setTotalTrades(tradesToUpload.length);
      setUploadProgress(0);

      // Upload all trades
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      
      for (let i = 0; i < tradesToUpload.length; i++) {
        const trade = tradesToUpload[i];
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
          
          // Update progress
          setUploadProgress(Math.round(((i + 1) / tradesToUpload.length) * 100));
        } catch (err) {
          console.error("Error creating trade:", err);
          errorCount++;
          const errorMsg = err instanceof Error ? err.message : "Unknown error";
          errors.push(`${trade.ticker || "Unknown"}: ${errorMsg}`);
          
          // Update progress even on error
          setUploadProgress(Math.round(((i + 1) / tradesToUpload.length) * 100));
        }
      }

      setUploadProgress(100);

      if (errorCount > 0) {
        const errorMessage = `${successCount} trades uploaded successfully, ${errorCount} failed.${errors.length > 0 ? ` Errors: ${errors.slice(0, 3).join("; ")}${errors.length > 3 ? "..." : ""}` : ""}`;
        setError(errorMessage);
        toast({
          title: "Upload Completed with Errors",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        setError(null);
        toast({
          title: "Upload Successful",
          description: `Successfully uploaded ${successCount} trade${successCount !== 1 ? 's' : ''}.`,
          variant: "success",
        });
        
        // Clear form and refresh
        setTimeout(() => {
          router.refresh();
          setPreview([]);
          fileInput.value = "";
          setUploadProgress(0);
          setTotalTrades(0);
        }, 2000);
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
          Upload your trades via CSV file. Supports standard broker CSV exports or custom format.
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
                {csvType === "broker" && (
                  <span className="text-xs bg-neon-green/20 text-neon-green px-2 py-1 rounded">
                    ✓ Broker Format Detected
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

          {loading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploading trades...</span>
                <span className="text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              {totalTrades > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  {Math.round((uploadProgress / 100) * totalTrades)} of {totalTrades} trades processed
                </p>
              )}
            </div>
          )}

          <Button onClick={handleUpload} disabled={loading || preview.length === 0} className="w-full">
            {loading ? "Uploading..." : `Upload Trades${totalTrades > 0 ? ` (${totalTrades} found)` : ''}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

