"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Papa from "papaparse";
import { createTrade } from "@/lib/actions/trades";

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`CSV parsing errors: ${results.errors.map(e => e.message).join(", ")}`);
          return;
        }
        setPreview(results.data.slice(0, 5)); // Show first 5 rows
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
      Papa.parse<CSVRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            for (const row of results.data) {
              const formData = new FormData();
              
              // Map CSV columns to form data
              Object.entries(row).forEach(([key, value]) => {
                if (value) formData.append(key, value);
              });

              // Calculate missing fields
              const entryPrice = parseFloat(row.entryPrice);
              const exitPrice = row.exitPrice ? parseFloat(row.exitPrice) : entryPrice;
              const quantity = parseInt(row.quantity);
              const contracts = row.contracts ? parseInt(row.contracts) : 0;
              
              if (!row.totalInvested) {
                const totalInvested = entryPrice * quantity * (contracts || 1);
                formData.append("totalInvested", totalInvested.toString());
              }
              
              if (!row.totalReturn) {
                const totalReturn = (exitPrice - entryPrice) * quantity * (contracts || 1);
                formData.append("totalReturn", totalReturn.toString());
              }
              
              if (!row.percentReturn && row.totalInvested) {
                const totalInvested = parseFloat(row.totalInvested);
                const totalReturn = row.totalReturn ? parseFloat(row.totalReturn) : (exitPrice - entryPrice) * quantity * (contracts || 1);
                const percentReturn = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
                formData.append("percentReturn", percentReturn.toString());
              }

              await createTrade(formData);
            }

            router.refresh();
            setPreview([]);
            fileInput.value = "";
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to upload trades");
          } finally {
            setLoading(false);
          }
        },
        error: (error) => {
          setError(`Failed to parse CSV: ${error.message}`);
          setLoading(false);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
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
          Upload your trades via CSV file. Download the template below to get started.
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
              <h3 className="font-semibold">Preview (first 5 rows)</h3>
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

