import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing stripe-signature header", { status: 400 });

  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!whSecret) return new NextResponse("STRIPE_WEBHOOK_SECRET is not set", { status: 500 });

  const stripe = getStripe();
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, whSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const appUserId = session.metadata?.appUserId;
        if (!appUserId) break;

        const customerId = session.customer as string | null;
        const subscriptionId = session.subscription as string | null;

        if (!customerId || !subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);

        await prisma.user.update({
          where: { id: appUserId },
          data: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: sub.items.data[0]?.price?.id || null,
            subscriptionStatus: sub.status,
            stripeCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        });

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        await prisma.user.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            subscriptionStatus: sub.status,
            stripePriceId: sub.items.data[0]?.price?.id || null,
            stripeCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        });

        break;
      }

      default:
        // Intentionally ignore other events
        break;
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("Webhook handler error:", e);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}