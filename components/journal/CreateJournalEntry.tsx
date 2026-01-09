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

          {/* Nutrition & Stimulants */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">🍳 Nutrition & Stimulants</h3>
            
            <div className="space-y-2">
              <Label htmlFor="breakfast">Breakfast</Label>
              <Select name="breakfast">
                <SelectTrigger>
                  <SelectValue placeholder="Select breakfast" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Skipped">Skipped</SelectItem>
                  <SelectItem value="Light">Light</SelectItem>
                  <SelectItem value="Balanced">Balanced</SelectItem>
                  <SelectItem value="Heavy">Heavy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caffeine">Caffeine</Label>
              <Select name="caffeine">
                <SelectTrigger>
                  <SelectValue placeholder="Select caffeine intake" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="1 serving">1 serving</SelectItem>
                  <SelectItem value="2–3 servings">2–3 servings</SelectItem>
                  <SelectItem value="4+ servings">4+ servings</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sugar">Sugar</Label>
              <Select name="sugar">
                <SelectTrigger>
                  <SelectValue placeholder="Select sugar intake" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="Some">Some</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hydration">Hydration</Label>
              <Select name="hydration">
                <SelectTrigger>
                  <SelectValue placeholder="Select hydration level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Well hydrated">Well hydrated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sleep & Recovery */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">😴 Sleep & Recovery</h3>
            
            <div className="space-y-2">
              <Label htmlFor="sleepDuration">Sleep Duration</Label>
              <Select name="sleepDuration">
                <SelectTrigger>
                  <SelectValue placeholder="Select sleep duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<5h">&lt;5h</SelectItem>
                  <SelectItem value="5–6h">5–6h</SelectItem>
                  <SelectItem value="6–7h">6–7h</SelectItem>
                  <SelectItem value="7–8h">7–8h</SelectItem>
                  <SelectItem value="8+h">8+h</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sleepQuality">Sleep Quality</Label>
              <Select name="sleepQuality">
                <SelectTrigger>
                  <SelectValue placeholder="Select sleep quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Poor">Poor</SelectItem>
                  <SelectItem value="Okay">Okay</SelectItem>
                  <SelectItem value="Great">Great</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bedtime">Bedtime</Label>
              <Select name="bedtime">
                <SelectTrigger>
                  <SelectValue placeholder="Select bedtime" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Before 10pm">Before 10pm</SelectItem>
                  <SelectItem value="10–12">10–12</SelectItem>
                  <SelectItem value="After 12">After 12</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wakeFeeling">Wake Feeling</Label>
              <Select name="wakeFeeling">
                <SelectTrigger>
                  <SelectValue placeholder="Select wake feeling" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tired">Tired</SelectItem>
                  <SelectItem value="Neutral">Neutral</SelectItem>
                  <SelectItem value="Energized">Energized</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Trading Behavior */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">📈 Trading Behavior</h3>
            
            <div className="space-y-2">
              <Label htmlFor="tradingQuality">Trading Quality</Label>
              <Select name="tradingQuality">
                <SelectTrigger>
                  <SelectValue placeholder="Select trading quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Disciplined">Disciplined</SelectItem>
                  <SelectItem value="Average">Average</SelectItem>
                  <SelectItem value="Sloppy">Sloppy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="revengeTrading">Revenge Trading</Label>
              <Select name="revengeTrading">
                <SelectTrigger>
                  <SelectValue placeholder="Select revenge trading" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="distractions">Distractions</Label>
              <Select name="distractions">
                <SelectTrigger>
                  <SelectValue placeholder="Select distractions level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="Minor">Minor</SelectItem>
                  <SelectItem value="Frequent">Frequent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="overtrading">Overtrading</Label>
              <Select name="overtrading">
                <SelectTrigger>
                  <SelectValue placeholder="Select overtrading" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeSpentTrading">Time Spent Trading</Label>
              <Select name="timeSpentTrading">
                <SelectTrigger>
                  <SelectValue placeholder="Select time spent trading" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<30 min">&lt;30 min</SelectItem>
                  <SelectItem value="30–60 min">30–60 min</SelectItem>
                  <SelectItem value="1–2 hrs">1–2 hrs</SelectItem>
                  <SelectItem value="2+ hrs">2+ hrs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stoppedWhenShouldHave">Stopped Trading When You Should Have</Label>
              <Select name="stoppedWhenShouldHave">
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Entry"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
