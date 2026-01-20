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
import { parseBrokerCSV } from "@/lib/utils/brokerCSVParser";
import { uploadBrokerExecutions } from "@/lib/actions/executions";

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
  status?: string;
  notes?: string;
}

export function CSVUpload() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
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
    setWarnings([]);
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
            // Parse broker CSV - returns { executions, warnings }
            const parseResult = parseBrokerCSV(fileText);
            console.log("Parsed executions:", parseResult.executions.length);
            setWarnings(parseResult.warnings);
            
            if (parseResult.executions.length > 0) {
              // Show preview of executions (convert to CSVRow-like format for display)
              setPreview(parseResult.executions.slice(0, 5).map(e => ({
                tradeDate: e.activityDate,
                ticker: e.instrument,
                assetType: e.transactionType,
                quantity: e.quantity.toString(),
                entryPrice: e.price.toString(),
                totalReturn: e.amount.toString(),
                description: e.description || "",
              } as CSVRow)));
              setTotalTrades(parseResult.executions.length);
              setError(null);
            } else {
              // Zero valid rows is still valid - just show warnings
              setError(null);
              if (parseResult.warnings.length > 0) {
                toast({
                  title: "Preview Complete",
                  description: `No valid executions found. ${parseResult.warnings.length} warning(s).`,
                  variant: "default",
                });
              }
            }
          } catch (err) {
            console.error("Parse error:", err);
            // Parse should never throw now, but handle just in case
            const errorMsg = err instanceof Error ? err.message : "Failed to parse broker CSV";
            setWarnings([errorMsg]);
            setError(null); // Don't show as fatal error
            toast({
              title: "Parse Warnings",
              description: errorMsg,
              variant: "default",
            });
          }
        } else {
          // Parse as custom format (legacy support)
          Papa.parse<CSVRow>(fileText, {
            header: true,
            skipEmptyLines: true,
            complete: (fullResults) => {
              if (fullResults.data.length === 0) {
                setError(null); // Don't show as fatal error
                setWarnings(["CSV file appears to be empty or has no valid rows."]);
              } else {
                setTotalTrades(fullResults.data.length);
                setPreview(fullResults.data.slice(0, 5));
                setError(null);
              }
            },
            error: (parseError: Error) => {
              const errorMsg = `Failed to parse CSV: ${parseError.message}`;
              setError(null); // Don't show as fatal error
              setWarnings([errorMsg]);
            },
          });
        }
      },
      error: (error: Error) => {
        console.error("CSV parse error:", error);
        const errorMsg = `Failed to parse CSV: ${error.message}`;
        setError(null); // Don't show as fatal error
        setWarnings([errorMsg]);
      },
    });
    } catch (err) {
      const errorMsg = "Failed to read file. Please try again.";
      setError(null); // Don't show as fatal error
      setWarnings([errorMsg]);
      toast({
        title: "File Read Warning",
        description: errorMsg,
        variant: "default",
      });
    }
  };

  const handleUpload = async () => {
    const fileInput = document.getElementById("csvFile") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      setWarnings(["Please select a file"]);
      return;
    }

    setLoading(true);
    setError(null);
    setWarnings([]);
    setUploadProgress(50);

    try {
      const fileText = await file.text();

      if (csvType === "broker") {
        // Use broker CSV upload (server-side parsing, creates trades from executions)
        try {
          const result = await uploadBrokerExecutions(fileText);
          
          setUploadProgress(100);
          
          // Collect all warnings and errors
          const allWarnings = [...result.warnings];
          const allErrors = [...result.errors];
          
          if (allWarnings.length > 0) {
            setWarnings(allWarnings);
          }
          
          if (allErrors.length > 0) {
            setError(allErrors.join("; "));
          }

          // Zero valid rows is still a successful upload (just with warnings)
          if (result.success) {
            // Update the trade count to reflect actual trades created (not execution count)
            setTotalTrades(result.tradesCreated);
            
            const message = result.tradesCreated > 0
              ? `Successfully uploaded ${result.tradesCreated} trade${result.tradesCreated !== 1 ? 's' : ''}.`
              : "Upload completed (no valid trades found).";
            
            toast({
              title: "Upload Complete",
              description: message + (allWarnings.length > 0 ? ` ${allWarnings.length} warning(s).` : ""),
              variant: allErrors.length > 0 ? "destructive" : "default",
            });

            // Clear form and navigate if successful
            if (allErrors.length === 0) {
              setTimeout(() => {
                router.push("/dashboard");
                setPreview([]);
                fileInput.value = "";
                setUploadProgress(0);
                setTotalTrades(0);
                setWarnings([]);
              }, 2000);
            }
          } else {
            toast({
              title: "Upload Failed",
              description: allErrors.join("; ") || "Upload failed. Please check the CSV format.",
              variant: "destructive",
            });
          }
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          const errorMsg = uploadError instanceof Error ? uploadError.message : "Failed to upload trades";
          setWarnings([errorMsg]);
          toast({
            title: "Upload Error",
            description: errorMsg,
            variant: "default",
          });
        }
      } else {
        // Legacy custom CSV format (still supported for backward compatibility)
        const parsePromise = new Promise<CSVRow[]>((resolve, reject) => {
          Papa.parse<CSVRow>(fileText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              resolve(results.data);
            },
            error: (error: Error) => reject(error),
          });
        });
        
        const customRows = await parsePromise;
        setTotalTrades(customRows.length);

        if (customRows.length === 0) {
          setWarnings(["No valid rows found in CSV file"]);
          setLoading(false);
          return;
        }

        // Limit number of rows to process
        if (customRows.length > MAX_ROWS) {
          setWarnings([`File contains ${customRows.length} rows, but maximum ${MAX_ROWS} rows are allowed per upload. Please split your file.`]);
          setLoading(false);
          return;
        }

        // Upload all trades (legacy behavior)
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];
        
        for (let i = 0; i < customRows.length; i++) {
          const row = customRows[i];
          try {
            const formData = new FormData();
            
            formData.append("tradeDate", row.tradeDate || new Date().toISOString().split("T")[0]);
            if (row.tradeTime) formData.append("tradeTime", row.tradeTime);
            formData.append("ticker", row.ticker || "");
            formData.append("assetType", row.assetType || "Stock");
            formData.append("entryPrice", row.entryPrice || "0");
            if (row.exitPrice) formData.append("exitPrice", row.exitPrice);
            formData.append("quantity", row.quantity || "0");
            if (row.contracts) formData.append("contracts", row.contracts);
            formData.append("totalInvested", row.totalInvested || "0");
            formData.append("totalReturn", row.totalReturn || "0");
            if (row.percentReturn) formData.append("percentReturn", row.percentReturn);
            if (row.status) formData.append("status", row.status);
            if (row.notes) formData.append("notes", row.notes);
            if (row.expirationDate) formData.append("expirationDate", row.expirationDate);
            if (row.strikePrice) formData.append("strikePrice", row.strikePrice);

            if (!row.ticker || !row.tradeDate || !row.entryPrice) {
              throw new Error(`Missing required fields for trade: ${row.ticker || "Unknown"}`);
            }

            await createTrade(formData);
            successCount++;
            
            setUploadProgress(Math.round(((i + 1) / customRows.length) * 100));
          } catch (err) {
            console.error("Error creating trade:", err);
            errorCount++;
            const errorMsg = err instanceof Error ? err.message : "Unknown error";
            errors.push(`${row.ticker || "Unknown"}: ${errorMsg}`);
            setUploadProgress(Math.round(((i + 1) / customRows.length) * 100));
          }
        }

        setUploadProgress(100);

        if (errorCount > 0) {
          const errorMessage = `${successCount} trades uploaded successfully, ${errorCount} failed.${errors.length > 0 ? ` Errors: ${errors.slice(0, 3).join("; ")}${errors.length > 3 ? "..." : ""}` : ""}`;
          setWarnings(errors);
          toast({
            title: "Upload Completed with Errors",
            description: errorMessage,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Upload Successful",
            description: `Successfully uploaded ${successCount} trade${successCount !== 1 ? 's' : ''}.`,
            variant: "success",
          });
          
          setTimeout(() => {
            router.push("/dashboard");
            setPreview([]);
            fileInput.value = "";
            setUploadProgress(0);
            setTotalTrades(0);
            setWarnings([]);
          }, 2000);
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to upload. Please check the CSV format.";
      setWarnings([errorMsg]);
      toast({
        title: "Upload Error",
        description: errorMsg,
        variant: "default",
      });
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
      "status",
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
            <p className="font-semibold mb-1">Errors:</p>
            <p>{error}</p>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg text-yellow-700 dark:text-yellow-400">
            <p className="font-semibold mb-2">Warnings ({warnings.length}):</p>
            <ul className="list-disc list-inside space-y-1 text-sm max-h-40 overflow-y-auto">
              {warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
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
                  {Math.round((uploadProgress / 100) * totalTrades)} of {totalTrades} {csvType === "broker" ? "rows" : "trades"} processed
                </p>
              )}
            </div>
          )}

          <Button 
            onClick={handleUpload} 
            disabled={loading} 
            className="w-full"
          >
            {loading 
              ? "Uploading..." 
              : `Upload Trades${totalTrades > 0 ? ` (${totalTrades} found)` : ''}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

