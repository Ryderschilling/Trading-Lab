// app/api/stripe/health/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getStripe } from "@/lib/stripe";

export async function GET() {
  try {
    const stripe = getStripe();

    // Lightweight sanity check: fetch one active recurring price
    const prices = await stripe.prices.list({
      active: true,
      limit: 1,
      expand: ["data.product"],
    });

    const price = prices.data[0];

    if (!price) {
      return NextResponse.json({
        ok: true,
        stripe: true,
        price: null,
        product: null,
      });
    }

    const product =
      typeof price.product === "string"
        ? { id: price.product }
        : (price.product as Stripe.DeletedProduct).deleted
          ? { id: price.product.id }
          : { id: price.product.id, name: (price.product as Stripe.Product).name };

    return NextResponse.json({
      ok: true,
      stripe: true,
      price: {
        id: price.id,
        active: price.active,
        type: price.type,
        currency: price.currency,
        unit_amount: price.unit_amount,
        recurring: price.recurring
          ? {
              interval: price.recurring.interval,
              interval_count: price.recurring.interval_count,
              usage_type: price.recurring.usage_type,
              trial_period_days: price.recurring.trial_period_days ?? null,
            }
          : null,
      },
      product,
    });
  } catch (e) {
    console.error("Stripe health check failed:", e);
    return new NextResponse("Stripe health check failed", { status: 500 });
  }
}