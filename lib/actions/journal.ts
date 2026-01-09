"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getJournalEntries(startDate?: Date, endDate?: Date) {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.journalEntry.findMany({
    where: {
      userId: user.id,
      ...(startDate && endDate && {
        date: {
          gte: startDate,
          lte: endDate,
        },
      }),
    },
    orderBy: { date: "desc" },
  });
}

export async function getJournalEntry(date: Date) {
  const user = await getCurrentUser();
  if (!user) return null;

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  return prisma.journalEntry.findUnique({
    where: {
      userId_date: {
        userId: user.id,
        date: dateOnly,
      },
    },
  });
}

export async function upsertJournalEntry(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const date = new Date(formData.get("date") as string);
  date.setHours(0, 0, 0, 0);

  // Nutrition & Stimulants
  const breakfast = formData.get("breakfast") as string | null;
  const caffeine = formData.get("caffeine") as string | null;
  const sugar = formData.get("sugar") as string | null;
  const hydration = formData.get("hydration") as string | null;
  
  // Sleep & Recovery
  const sleepDuration = formData.get("sleepDuration") as string | null;
  const sleepQuality = formData.get("sleepQuality") as string | null;
  const bedtime = formData.get("bedtime") as string | null;
  const wakeFeeling = formData.get("wakeFeeling") as string | null;
  
  // Trading Behavior
  const tradingQuality = formData.get("tradingQuality") as string | null;
  const revengeTrading = formData.get("revengeTrading") as string | null;
  const distractions = formData.get("distractions") as string | null;
  const overtrading = formData.get("overtrading") as string | null;
  const timeSpentTrading = formData.get("timeSpentTrading") as string | null;
  const stoppedWhenShouldHave = formData.get("stoppedWhenShouldHave") as string | null;

  const entry = await prisma.journalEntry.upsert({
    where: {
      userId_date: {
        userId: user.id,
        date,
      },
    },
    update: {
      breakfast: breakfast || null,
      caffeine: caffeine || null,
      sugar: sugar || null,
      hydration: hydration || null,
      sleepDuration: sleepDuration || null,
      sleepQuality: sleepQuality || null,
      bedtime: bedtime || null,
      wakeFeeling: wakeFeeling || null,
      tradingQuality: tradingQuality || null,
      revengeTrading: revengeTrading || null,
      distractions: distractions || null,
      overtrading: overtrading || null,
      timeSpentTrading: timeSpentTrading || null,
      stoppedWhenShouldHave: stoppedWhenShouldHave || null,
    },
    create: {
      userId: user.id,
      date,
      breakfast: breakfast || null,
      caffeine: caffeine || null,
      sugar: sugar || null,
      hydration: hydration || null,
      sleepDuration: sleepDuration || null,
      sleepQuality: sleepQuality || null,
      bedtime: bedtime || null,
      wakeFeeling: wakeFeeling || null,
      tradingQuality: tradingQuality || null,
      revengeTrading: revengeTrading || null,
      distractions: distractions || null,
      overtrading: overtrading || null,
      timeSpentTrading: timeSpentTrading || null,
      stoppedWhenShouldHave: stoppedWhenShouldHave || null,
    },
  });

  revalidatePath("/journal");
  revalidatePath("/calendar");
  return entry;
}

