"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { upsertJournalEntry } from "@/lib/actions/journal";

export function CreateJournalEntry() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.set("date", selectedDate);
      await upsertJournalEntry(formData);
      router.refresh();
      setOpen(false);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Failed to save journal entry:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New Entry</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Journal Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preMarketPlan">Pre-Market Plan</Label>
            <Textarea
              id="preMarketPlan"
              name="preMarketPlan"
              rows={4}
              placeholder="What's your plan for today's trading session?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="marketBias">Market Bias</Label>
            <Select name="marketBias">
              <SelectTrigger>
                <SelectValue placeholder="Select market bias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bullish">Bullish</SelectItem>
                <SelectItem value="Bearish">Bearish</SelectItem>
                <SelectItem value="Neutral">Neutral</SelectItem>
                <SelectItem value="Uncertain">Uncertain</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emotionalState">Emotional State</Label>
            <Select name="emotionalState">
              <SelectTrigger>
                <SelectValue placeholder="How were you feeling?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Confident">Confident</SelectItem>
                <SelectItem value="Cautious">Cautious</SelectItem>
                <SelectItem value="Frustrated">Frustrated</SelectItem>
                <SelectItem value="Excited">Excited</SelectItem>
                <SelectItem value="Calm">Calm</SelectItem>
                <SelectItem value="Anxious">Anxious</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatWentWell">What Went Well</Label>
            <Textarea
              id="whatWentWell"
              name="whatWentWell"
              rows={4}
              placeholder="What strategies or decisions worked well today?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatWentWrong">What Went Wrong</Label>
            <Textarea
              id="whatWentWrong"
              name="whatWentWrong"
              rows={4}
              placeholder="What mistakes did you make? What could you have done better?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lessonsLearned">Lessons Learned</Label>
            <Textarea
              id="lessonsLearned"
              name="lessonsLearned"
              rows={4}
              placeholder="What key insights or lessons did you learn from today's trading?"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Entry"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

