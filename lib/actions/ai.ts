"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { getStats, getDailyPerformance } from "./trades";
import { getGoals } from "./goals";
import { getJournalEntries } from "./journal";

const MAX_QUESTION_LENGTH = 1000;
const MAX_TOKENS = 4000;
const MAX_USER_REQUESTS_PER_MINUTE = 6;

function isLikelyPersonalizedTradeAdvice(input: string): boolean {
  const q = input.toLowerCase();

  const direct =
    /(what should i|should i|tell me|give me|recommend).*(buy|sell|short|long|enter|exit)/.test(q) ||
    /(buy|sell|short|long).*(now|today|tomorrow|this week)/.test(q) ||
    /(entry|exit|price target|stop loss|take profit)/.test(q);

  const hasTickerLike = /\b[A-Z]{1,5}\b/.test(input);
  const hasAction = /(buy|sell|short|long|call|put)/.test(q);

  return direct || (hasTickerLike && hasAction);
}

function sanitizeInput(input: string): string {
  return input
    .trim()
    .slice(0, MAX_QUESTION_LENGTH)
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "");
}

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

  // Rate limit based on recent user messages stored in DB
  try {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentCount = await prisma.aIConversationHistory.count({
      where: { userId: user.id, role: "user", createdAt: { gte: oneMinuteAgo } },
    });

    if (recentCount >= MAX_USER_REQUESTS_PER_MINUTE) {
      throw new Error("Too many requests. Please wait a minute and try again.");
    }
  } catch (error) {
    console.warn("AI rate limit check failed:", error);
  }

  const sanitizedQuestion = sanitizeInput(question);

  if (!sanitizedQuestion || sanitizedQuestion.trim().length === 0) {
    throw new Error("Please enter a question.");
  }

  if (sanitizedQuestion.length > MAX_QUESTION_LENGTH) {
    throw new Error(`Question is too long. Please keep it under ${MAX_QUESTION_LENGTH} characters.`);
  }

  // Hard refuse personalized trade advice
  if (isLikelyPersonalizedTradeAdvice(sanitizedQuestion)) {
    const refusal =
      "I can’t provide personalized buy/sell recommendations, entries/exits, or price targets. " +
      "If you share your rules, risk limits, and what happened in the trade, I can help you analyze it, " +
      "identify mistakes/patterns, and suggest *educational* improvements.\n\n" +
      "This is educational analysis only and not financial advice.";

    try {
      await prisma.aIConversationHistory.create({
        data: { userId: user.id, role: "user", content: sanitizedQuestion },
      });
      await prisma.aIConversationHistory.create({
        data: { userId: user.id, role: "assistant", content: refusal },
      });
    } catch (e) {
      console.error("Error saving AI refusal:", e);
    }

    return refusal;
  }

  // Fetch context data
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

  const context = {
    stats: stats || {},
    goals: (goals || []).map((g: any) => ({
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

  // Save user message
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

Always include a disclaimer: "This is educational analysis only and not financial advice. Always do your own research and consult with a licensed financial advisor before making trading decisions."`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
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

    const response =
      completion.choices[0]?.message?.content ||
      "I'm sorry, I couldn't generate a response.";

    if (!response || response.trim().length === 0) {
      throw new Error("The AI assistant couldn't generate a response. Please try again.");
    }

    const sanitizedResponse = response.slice(0, 10000);

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
    }

    return sanitizedResponse;
  } catch (error) {
    console.error("OpenAI API error:", error);

    if (error instanceof Error) {
      if (error.message.includes("rate limit")) {
        throw new Error("Too many requests. Please wait a moment and try again.");
      }
      if (error.message.includes("insufficient_quota")) {
        throw new Error("AI service is temporarily unavailable. Please try again later.");
      }
      if (error.message.includes("invalid_api_key")) {
        throw new Error("AI service configuration error. Please contact support.");
      }
      if (
        error.message.includes("Please enter") ||
        error.message.includes("too long") ||
        error.message.includes("couldn't generate")
      ) {
        throw error;
      }
    }

    throw new Error(
      "Failed to get AI response. Please try again or contact support if the problem persists."
    );
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