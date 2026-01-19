"use client";

import { useState, useEffect } from "react";
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
import { Settings } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const ALL_QUESTIONS = [
  { id: "breakfast", label: "Breakfast", category: "nutrition" },
  { id: "caffeine", label: "Caffeine", category: "nutrition" },
  { id: "sugar", label: "Sugar", category: "nutrition" },
  { id: "hydration", label: "Hydration", category: "nutrition" },
  { id: "sleepDuration", label: "Sleep Duration", category: "sleep" },
  { id: "sleepQuality", label: "Sleep Quality", category: "sleep" },
  { id: "bedtime", label: "Bedtime", category: "sleep" },
  { id: "wakeFeeling", label: "Wake Feeling", category: "sleep" },
  { id: "tradingQuality", label: "Trading Quality", category: "trading" },
  { id: "revengeTrading", label: "Revenge Trading", category: "trading" },
  { id: "distractions", label: "Distractions", category: "trading" },
  { id: "overtrading", label: "Overtrading", category: "trading" },
  { id: "timeSpentTrading", label: "Time Spent Trading", category: "trading" },
  { id: "stoppedWhenShouldHave", label: "Stopped When Should Have", category: "trading" },
];

export function CreateJournalEntry() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [enabledQuestions, setEnabledQuestions] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("journalEnabledQuestions");
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    }
    return new Set(ALL_QUESTIONS.map(q => q.id));
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("journalEnabledQuestions", JSON.stringify(Array.from(enabledQuestions)));
    }
  }, [enabledQuestions]);

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
          <div className="flex items-center justify-between">
            <DialogTitle>Create Journal Entry</DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="h-8 w-8"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {settingsOpen && (
          <div className="border border-border/30 rounded-lg p-4 mb-4 bg-card">
            <h4 className="font-semibold mb-3 text-sm">Select Questions</h4>
            <div className="grid grid-cols-2 gap-2">
              {ALL_QUESTIONS.map((question) => (
                <div key={question.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={question.id}
                    checked={enabledQuestions.has(question.id)}
                    onCheckedChange={(checked) => {
                      const newSet = new Set(enabledQuestions);
                      if (checked) {
                        newSet.add(question.id);
                      } else {
                        newSet.delete(question.id);
                      }
                      setEnabledQuestions(newSet);
                    }}
                  />
                  <label
                    htmlFor={question.id}
                    className="text-sm cursor-pointer"
                  >
                    {question.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

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
            
            {enabledQuestions.has("breakfast") && (
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
            )}

            {enabledQuestions.has("caffeine") && (
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
            )}

            {enabledQuestions.has("sugar") && (
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
            )}

            {enabledQuestions.has("hydration") && (
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
            )}
          </div>

          {/* Sleep & Recovery */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">😴 Sleep & Recovery</h3>
            
            {enabledQuestions.has("sleepDuration") && (
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
            )}

            {enabledQuestions.has("sleepQuality") && (
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
            )}

            {enabledQuestions.has("bedtime") && (
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
            )}

            {enabledQuestions.has("wakeFeeling") && (
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
            )}
          </div>

          {/* Trading Behavior */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">📈 Trading Behavior</h3>
            
            {enabledQuestions.has("tradingQuality") && (
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
            )}

            {enabledQuestions.has("revengeTrading") && (
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
            )}

            {enabledQuestions.has("distractions") && (
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
            )}

            {enabledQuestions.has("overtrading") && (
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
            )}

            {enabledQuestions.has("timeSpentTrading") && (
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
            )}

            {enabledQuestions.has("stoppedWhenShouldHave") && (
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
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Entry"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
