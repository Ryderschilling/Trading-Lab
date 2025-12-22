"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import Link from "next/link";

interface JournalEntry {
  id: string;
  date: Date;
  preMarketPlan?: string | null;
  marketBias?: string | null;
  emotionalState?: string | null;
  whatWentWell?: string | null;
  whatWentWrong?: string | null;
  lessonsLearned?: string | null;
}

interface JournalEntryListProps {
  entries: JournalEntry[];
}

export function JournalEntryList({ entries }: JournalEntryListProps) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No journal entries yet. Create your first entry to start tracking your trading journey!
          </p>
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
            {entry.preMarketPlan && (
              <div>
                <h3 className="font-semibold mb-2">Pre-Market Plan</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {entry.preMarketPlan}
                </p>
              </div>
            )}
            {entry.marketBias && (
              <div>
                <h3 className="font-semibold mb-2">Market Bias</h3>
                <p className="text-sm text-muted-foreground">{entry.marketBias}</p>
              </div>
            )}
            {entry.emotionalState && (
              <div>
                <h3 className="font-semibold mb-2">Emotional State</h3>
                <p className="text-sm text-muted-foreground">{entry.emotionalState}</p>
              </div>
            )}
            {entry.whatWentWell && (
              <div>
                <h3 className="font-semibold mb-2">What Went Well</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {entry.whatWentWell}
                </p>
              </div>
            )}
            {entry.whatWentWrong && (
              <div>
                <h3 className="font-semibold mb-2">What Went Wrong</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {entry.whatWentWrong}
                </p>
              </div>
            )}
            {entry.lessonsLearned && (
              <div>
                <h3 className="font-semibold mb-2">Lessons Learned</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {entry.lessonsLearned}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

