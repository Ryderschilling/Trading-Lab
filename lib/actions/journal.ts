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

  const preMarketPlan = formData.get("preMarketPlan") as string | null;
  const marketBias = formData.get("marketBias") as string | null;
  const emotionalState = formData.get("emotionalState") as string | null;
  const whatWentWell = formData.get("whatWentWell") as string | null;
  const whatWentWrong = formData.get("whatWentWrong") as string | null;
  const lessonsLearned = formData.get("lessonsLearned") as string | null;

  const entry = await prisma.journalEntry.upsert({
    where: {
      userId_date: {
        userId: user.id,
        date,
      },
    },
    update: {
      preMarketPlan: preMarketPlan || null,
      marketBias: marketBias || null,
      emotionalState: emotionalState || null,
      whatWentWell: whatWentWell || null,
      whatWentWrong: whatWentWrong || null,
      lessonsLearned: lessonsLearned || null,
    },
    create: {
      userId: user.id,
      date,
      preMarketPlan: preMarketPlan || null,
      marketBias: marketBias || null,
      emotionalState: emotionalState || null,
      whatWentWell: whatWentWell || null,
      whatWentWrong: whatWentWrong || null,
      lessonsLearned: lessonsLearned || null,
    },
  });

  revalidatePath("/journal");
  revalidatePath("/calendar");
  return entry;
}

