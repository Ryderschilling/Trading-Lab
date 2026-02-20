import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

/**
 * Stripe health check endpoint (backend-only).
 *
 * What it verifies:
 * - You are authenticated (Clerk)
 * - Required env vars exist (STRIPE_SECRET_KEY, STRIPE_PRICE_ID)
 * - Stripe API key works (retrieves the Price object)
 * - Confirms whether the current user has a stripeCustomerId stored
 *
 * How to use:
 * - While logged in: GET /api/stripe/health
 * - Returns JSON with status + details
 *
 * NOTE: Does NOT create a customer, does NOT create a checkout session.
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) return new NextResponse("STRIPE_PRICE_ID is not set", { status: 500 });

    // If STRIPE_SECRET_KEY is missing, getStripe() throws.
    const stripe = getStripe();

    // Confirm DB user exists
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return new NextResponse("User not found", { status: 404 });

    // Confirm Stripe key works and the Price exists
    const price = await stripe.prices.retrieve(priceId, {
      expand: ["product"],
    });

    const product =
      typeof price.product === "string"
        ? { id: price.product }
        : { id: price.product.id, name: price.product.name };

    return NextResponse.json({
      ok: true,
      env: {
        STRIPE_PRICE_ID: priceId,
        STRIPE_WEBHOOK_SECRET_set: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
        APP_URL: process.env.APP_URL || null,
      },
      stripe: {
        price: {
          id: price.id,
          currency: price.currency,
          unit_amount: price.unit_amount,
          recurring: price.recurring || null,
          active: price.active,
        },
        product,
      },
      user: {
        id: user.id,
        clerkId: user.clerkId,
        hasStripeCustomerId: Boolean(user.stripeCustomerId),
        subscriptionStatus: user.subscriptionStatus || null,
      },
    });
  } catch (e) {
    console.error("Stripe health check error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return new NextResponse(`Stripe health check failed: ${message}`, { status: 500 });
  }
}