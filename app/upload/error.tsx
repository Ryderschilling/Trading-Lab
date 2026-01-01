"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Upload page error:", error);
  }, [error]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Upload Trades</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Upload Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {error.message || "An unexpected error occurred while loading the upload page."}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
          <Button onClick={reset} variant="default">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

