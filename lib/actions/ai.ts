"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { getStats, getDailyPerformance } from "./trades";
import { getGoals } from "./goals";
import { getJournalEntries } from "./journal";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function askAI(question: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Get user data
  const [stats, goals, journalEntries, dailyPerf] = await Promise.all([
    getStats(),
    getGoals(),
    getJournalEntries(),
    getDailyPerformance(),
  ]);

  // Build context
  const context = {
    stats: stats || {},
    goals: goals.map(g => ({
      name: g.name,
      type: g.type,
      targetValue: g.targetValue,
      currentValue: g.currentValue,
      status: g.status,
    })),
    journalEntries: journalEntries.slice(0, 10).map(j => ({
      date: j.date,
      whatWentWell: j.whatWentWell,
      whatWentWrong: j.whatWentWrong,
      lessonsLearned: j.lessonsLearned,
    })),
    recentPerformance: dailyPerf.slice(-30),
  };

  // Save user message
  await prisma.aIConversationHistory.create({
    data: {
      userId: user.id,
      role: "user",
      content: question,
    },
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert trading coach AI assistant. You have access to the user's trading data including:
- Trading statistics (P&L, win rate, profit factor, etc.)
- Trading goals and their progress
- Recent journal entries
- Daily performance data

Provide personalized, data-driven feedback and insights based on the user's actual trading data. Be specific, actionable, and encouraging. Use the context data to give concrete examples and recommendations.`,
        },
        {
          role: "user",
          content: `Context Data:
${JSON.stringify(context, null, 2)}

User Question: ${question}

Please provide a helpful, personalized response based on the user's trading data.`,
        },
      ],
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    // Save assistant response
    await prisma.aIConversationHistory.create({
      data: {
        userId: user.id,
        role: "assistant",
        content: response,
      },
    });

    return response;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to get AI response");
  }
}

export async function getConversationHistory(limit: number = 20) {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.aIConversationHistory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

