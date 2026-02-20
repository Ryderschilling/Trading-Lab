import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Delete related data first
    await prisma.aIConversationHistory.deleteMany({
      where: { userId: user.id },
    });

    await prisma.trade.deleteMany({
      where: { userId: user.id },
    });

    await prisma.journalEntry.deleteMany({
      where: { userId: user.id },
    });

    await prisma.goal.deleteMany({
      where: { userId: user.id },
    });

    // Delete main user
    await prisma.user.delete({
      where: { id: user.id },
    });

    // Delete Clerk user
    await clerkClient.users.deleteUser(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion error:", error);
    return new NextResponse("Failed to delete account.", { status: 500 });
  }
}