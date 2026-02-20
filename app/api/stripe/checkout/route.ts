import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getOrCreateStripeCustomer } from "@/lib/stripeCustomer";

export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return new NextResponse("User not found", { status: 404 });

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) return new NextResponse("STRIPE_PRICE_ID is not set", { status: 500 });

    const stripe = getStripe();

    const customerId = await getOrCreateStripeCustomer({
      userId: user.id,
      clerkId,
      email: user.email,
    });

    const appUrl = process.env.APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${appUrl}/settings?stripe=success`,
      cancel_url: `${appUrl}/settings?stripe=cancel`,
      subscription_data: {
        metadata: { appUserId: user.id, clerkId },
      },
      metadata: { appUserId: user.id, clerkId },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("Stripe checkout error:", e);
    return new NextResponse("Failed to create checkout session", { status: 500 });
  }
}