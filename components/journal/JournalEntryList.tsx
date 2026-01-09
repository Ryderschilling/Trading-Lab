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
    <div className="space-y-4">
      {entries.map((entry) => (
        <Card key={entry.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {format(new Date(entry.date), "EEEE, MMMM d, yyyy")}
              </CardTitle>
              <Link
                href={`/calendar?year=${new Date(entry.date).getFullYear()}&month=${new Date(entry.date).getMonth() + 1}`}
                className="text-sm text-primary hover:underline"
              >
                View in Calendar
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nutrition & Stimulants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entry.breakfast && (
                <div>
                  <h3 className="font-semibold mb-1 text-sm">Breakfast</h3>
                  <p className="text-sm text-muted-foreground">{entry.breakfast}</p>
                </div>
              )}
              {entry.caffeine && (
                <div>
                  <h3 className="font-semibold mb-1 text-sm">Caffeine</h3>
                  <p className="text-sm text-muted-foreground">{entry.caffeine}</p>
                </div>
              )}
              {entry.sugar && (
                <div>
                  <h3 className="font-semibold mb-1 text-sm">Sugar</h3>
                  <p className="text-sm text-muted-foreground">{entry.sugar}</p>
                </div>
              )}
              {entry.hydration && (
                <div>
                  <h3 className="font-semibold mb-1 text-sm">Hydration</h3>
                  <p className="text-sm text-muted-foreground">{entry.hydration}</p>
                </div>
              )}
            </div>

            {/* Sleep & Recovery */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entry.sleepDuration && (
                <div>
                  <h3 className="font-semibold mb-1 text-sm">Sleep Duration</h3>
                  <p className="text-sm text-muted-foreground">{entry.sleepDuration}</p>
                </div>
              )}
              {entry.sleepQuality && (
                <div>
                  <h3 className="font-semibold mb-1 text-sm">Sleep Quality</h3>
                  <p className="text-sm text-muted-foreground">{entry.sleepQuality}</p>
                </div>
              )}
              {entry.bedtime && (
                <div>
                  <h3 className="font-semibold mb-1 text-sm">Bedtime</h3>
                  <p className="text-sm text-muted-foreground">{entry.bedtime}</p>
                </div>
              )}
              {entry.wakeFeeling && (
                <div>
                  <h3 className="font-semibold mb-1 text-sm">Wake Feeling</h3>
                  <p className="text-sm text-muted-foreground">{entry.wakeFeeling}</p>
                </div>
              )}
            </div>

            {/* Trading Behavior */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entry.tradingQuality && (
                <div>
                  <h3 className="font-semibold mb-1 text-sm">Trading Quality</h3>
                  <p className="text-sm text-muted-foreground">{entry.tradingQuality}</p>
                </div>
              )}
              {entry.revengeTrading && (
                <div>
                  <h3 className="font-semibold mb-1 text-sm">Revenge Trading</h3>
                  <p className="text-sm text-muted-foreground">{entry.revengeTrading}</p>
                </div>
              )}
              {entry.distractions && (
                <div>
                  <h3 className="font-semibold mb-1 text-sm">Distractions</h3>
                  <p className="text-sm text-muted-foreground">{entry.distractions}</p>
                </div>
              )}
              {entry.overtrading && (
                <div>
                  <h3 className="font-semibold mb-1 text-sm">Overtrading</h3>
                  <p className="text-sm text-muted-foreground">{entry.overtrading}</p>
                </div>
              )}
              {entry.timeSpentTrading && (
                <div>
                  <h3 className="font-semibold mb-1 text-sm">Time Spent Trading</h3>
                  <p className="text-sm text-muted-foreground">{entry.timeSpentTrading}</p>
                </div>
              )}
              {entry.stoppedWhenShouldHave && (
                <div>
                  <h3 className="font-semibold mb-1 text-sm">Stopped When Should Have</h3>
                  <p className="text-sm text-muted-foreground">{entry.stoppedWhenShouldHave}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

