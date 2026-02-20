import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const terms = Boolean(body?.terms);
    const privacy = Boolean(body?.privacy);
    const disclaimer = Boolean(body?.disclaimer);
    const aiPolicy = Boolean(body?.aiPolicy);

    if (!terms || !privacy || !disclaimer || !aiPolicy) {
      return new NextResponse("All policies must be accepted.", { status: 400 });
    }

    const now = new Date();

    await prisma.user.update({
      where: { clerkId: userId },
      data: {
        acceptedTermsAt: now,
        acceptedPrivacyAt: now,
        acceptedDisclaimerAt: now,
        acceptedAIPolicyAt: now,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("/api/legal/accept error:", error);
    return new NextResponse("Failed to save acceptance.", { status: 500 });
  }
}