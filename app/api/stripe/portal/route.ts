import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user?.stripeCustomerId) {
      return new NextResponse("No Stripe customer found", { status: 400 });
    }

    const stripe = getStripe();
    const appUrl = process.env.APP_URL || "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("Stripe portal error:", e);
    return new NextResponse("Failed to create portal session", { status: 500 });
  }
}