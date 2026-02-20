import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function getOrCreateStripeCustomer(params: {
  userId: string; // Prisma User.id
  clerkId: string;
  email: string;
}) {
  const user = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!user) throw new Error("User not found.");

  if (user.stripeCustomerId) return user.stripeCustomerId;

  const stripe = getStripe();

  const customer = await stripe.customers.create({
    email: params.email,
    metadata: { clerkId: params.clerkId, appUserId: params.userId },
  });

  await prisma.user.update({
    where: { id: params.userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}