"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

export function ClerkWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Skip ClerkProvider for visual editor
  if (pathname?.includes("/visual-editor")) {
    return <>{children}</>;
  }

  // Check if Clerk keys are available (NEXT_PUBLIC_ vars are available in client)
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Only render ClerkProvider if keys are available
  if (!publishableKey) {
    console.warn("Clerk keys not configured. Running without authentication.");
    return <>{children}</>;
  }

  try {
    return <ClerkProvider>{children}</ClerkProvider>;
  } catch (error) {
    console.error("ClerkProvider error:", error);
    return <>{children}</>;
  }
}

