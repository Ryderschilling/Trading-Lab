"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { getStats, getDailyPerformance } from "./trades";
import { getGoals } from "./goals";
import { getJournalEntries } from "./journal";

const MAX_QUESTION_LENGTH = 1000; // Maximum characters in user question
const MAX_TOKENS = 4000; // Maximum tokens for OpenAI response

// Sanitize user input to prevent injection attacks
function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters and limit length
  return input
    .trim()
    .slice(0, MAX_QUESTION_LENGTH)
    .replace(/[<>]/g, "") // Remove HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, ""); // Remove event handlers
}

// Get OpenAI client with validation
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("AI service is not configured. Please contact support.");
  }
  return new OpenAI({ apiKey });
}

export async function askAI(question: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Validate environment variable
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("AI service is not configured. Please contact support.");
  }

  // Sanitize and validate input
  const sanitizedQuestion = sanitizeInput(question);
  
  if (!sanitizedQuestion || sanitizedQuestion.trim().length === 0) {
    throw new Error("Please enter a question.");
  }

  if (sanitizedQuestion.length > MAX_QUESTION_LENGTH) {
    throw new Error(`Question is too long. Please keep it under ${MAX_QUESTION_LENGTH} characters.`);
  }

  // Get user data with error handling
  let stats, goals, journalEntries, dailyPerf;
  try {
    [stats, goals, journalEntries, dailyPerf] = await Promise.all([
      getStats(),
      getGoals(),
      getJournalEntries(),
      getDailyPerformance(),
    ]);
  } catch (error) {
    console.error("Error fetching user data for AI:", error);
    throw new Error("Failed to load your trading data. Please try again.");
  }

  // Build context (sanitize sensitive data)
  const context = {
    stats: stats || {},
    goals: (goals || []).map((g: { name: string | null; type: string | null; targetValue: number; currentValue: number }) => ({
      name: g.name || "",
      type: g.type || "",
      targetValue: g.targetValue || 0,
      currentValue: g.currentValue || 0,
    })),
    journalEntries: (journalEntries || []).slice(0, 10).map((j: any) => ({
      date: j.date || null,
      breakfast: j.breakfast || null,
      caffeine: j.caffeine || null,
      sugar: j.sugar || null,
      hydration: j.hydration || null,
      sleepDuration: j.sleepDuration || null,
      sleepQuality: j.sleepQuality || null,
      bedtime: j.bedtime || null,
      wakeFeeling: j.wakeFeeling || null,
      tradingQuality: j.tradingQuality || null,
      revengeTrading: j.revengeTrading || null,
      distractions: j.distractions || null,
      overtrading: j.overtrading || null,
      timeSpentTrading: j.timeSpentTrading || null,
      stoppedWhenShouldHave: j.stoppedWhenShouldHave || null,
    })),
    recentPerformance: (dailyPerf || []).slice(-30),
  };

  // Save user message (sanitized)
  try {
    await prisma.aIConversationHistory.create({
      data: {
        userId: user.id,
        role: "user",
        content: sanitizedQuestion,
      },
    });
  } catch (error) {
    console.error("Error saving user message:", error);
    // Continue even if saving fails
  }

  try {
    const openai = getOpenAIClient();
    
    const systemPrompt = `You are an educational trading analysis assistant. You provide educational insights and analysis based on trading data, but you MUST NOT:

1. Provide specific buy/sell recommendations or trade instructions
2. Give financial advice or investment recommendations
3. Suggest specific stocks, options, or securities to trade
4. Make predictions about market movements or price targets
5. Recommend specific entry/exit prices or timing

You CAN:
- Analyze trading patterns and performance metrics
- Provide educational insights about trading strategies
- Help identify strengths and weaknesses in trading approach
- Suggest general areas for improvement
- Explain trading concepts and terminology
- Review journal entries and provide feedback on trading psychology

Always include a disclaimer: "This is educational analysis only and not financial advice. Always do your own research and consult with a licensed financial advisor before making trading decisions."

You have access to the user's trading data including:
- Trading statistics (P&L, win rate, profit factor, etc.)
- Trading goals and their progress
- Recent journal entries
- Daily performance data

Provide personalized, data-driven educational feedback and insights based on the user's actual trading data. Be specific, actionable, and encouraging. Use the context data to give concrete examples and educational recommendations.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Context Data:
${JSON.stringify(context, null, 2)}

User Question: ${sanitizedQuestion}

Please provide a helpful, educational response based on the user's trading data. Remember: provide analysis and insights only, not specific trade recommendations.`,
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

    // Sanitize response before saving
    const sanitizedResponse = response.slice(0, 10000); // Limit response length

    // Save assistant response
    try {
      await prisma.aIConversationHistory.create({
        data: {
          userId: user.id,
          role: "assistant",
          content: sanitizedResponse,
        },
      });
    } catch (error) {
      console.error("Error saving assistant response:", error);
      // Continue even if saving fails
    }

    return sanitizedResponse;
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

