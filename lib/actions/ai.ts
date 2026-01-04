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

const MAX_QUESTION_LENGTH = 1000; // Maximum characters in user question
const MAX_TOKENS = 4000; // Maximum tokens for OpenAI response

export async function askAI(question: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Validate input length
  if (!question || question.trim().length === 0) {
    throw new Error("Please enter a question.");
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    throw new Error(`Question is too long. Please keep it under ${MAX_QUESTION_LENGTH} characters.`);
  }

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
      max_tokens: MAX_TOKENS,
    });

    const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    // Validate response length
    if (!response || response.trim().length === 0) {
      throw new Error("The AI assistant couldn't generate a response. Please try again.");
    }

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
    
    // Provide user-friendly error messages
    if (error instanceof Error) {
      // Check for specific OpenAI API errors
      if (error.message.includes("rate limit")) {
        throw new Error("Too many requests. Please wait a moment and try again.");
      }
      if (error.message.includes("insufficient_quota")) {
        throw new Error("AI service is temporarily unavailable. Please try again later.");
      }
      if (error.message.includes("invalid_api_key")) {
        throw new Error("AI service configuration error. Please contact support.");
      }
      // Re-throw user-friendly errors
      if (error.message.includes("Please enter") || error.message.includes("too long") || error.message.includes("couldn't generate")) {
        throw error;
      }
    }
    
    throw new Error("Failed to get AI response. Please try again or contact support if the problem persists.");
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

