"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import Link from "next/link";
import { CreateJournalEntry } from "./CreateJournalEntry";

interface JournalEntry {
  id: string;
  date: Date;
  breakfast?: string | null;
  caffeine?: string | null;
  sugar?: string | null;
  hydration?: string | null;
  sleepDuration?: string | null;
  sleepQuality?: string | null;
  bedtime?: string | null;
  wakeFeeling?: string | null;
  tradingQuality?: string | null;
  revengeTrading?: string | null;
  distractions?: string | null;
  overtrading?: string | null;
  timeSpentTrading?: string | null;
  stoppedWhenShouldHave?: string | null;
}

interface JournalEntryListProps {
  entries: JournalEntry[];
}

export function JournalEntryList({ entries }: JournalEntryListProps) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <p className="text-muted-foreground">
            No journal entries yet. Create your first entry to start tracking your trading journey!
          </p>
          <div className="flex justify-center">
            <CreateJournalEntry />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {entries.map((entry) => (
        <Card key={entry.id} className="h-auto">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {format(new Date(entry.date), "MMM d, yyyy")}
              </CardTitle>
              <Link
                href={`/calendar?year=${new Date(entry.date).getFullYear()}&month=${new Date(entry.date).getMonth() + 1}`}
                className="text-xs text-muted-foreground hover:underline"
              >
                View
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {entry.breakfast && (
                <span className="text-muted-foreground"><span className="font-medium">Breakfast:</span> {entry.breakfast}</span>
              )}
              {entry.sleepDuration && (
                <span className="text-muted-foreground"><span className="font-medium">Sleep:</span> {entry.sleepDuration}</span>
              )}
              {entry.tradingQuality && (
                <span className="text-muted-foreground"><span className="font-medium">Quality:</span> {entry.tradingQuality}</span>
              )}
              {entry.caffeine && (
                <span className="text-muted-foreground"><span className="font-medium">Caffeine:</span> {entry.caffeine}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

