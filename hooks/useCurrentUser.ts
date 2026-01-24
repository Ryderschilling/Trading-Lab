"use client";

import { useUser } from "@clerk/nextjs";

export function useCurrentUser() {
  const { user, isLoaded } = useUser();

  return {
    isLoaded,
    clerkUser: user,
    clerkId: user?.id,
    email: user?.primaryEmailAddress?.emailAddress,
    imageUrl: user?.imageUrl,
    fullName: user?.fullName,
  };
}