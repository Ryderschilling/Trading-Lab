import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function getCurrentUser() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL not configured - user authentication will be limited");
      return null;
    }

    // Get or create user in database
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
        },
      });
    }

    return user;
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    // Return null if database error, but don't crash the app
    return null;
  }
}

