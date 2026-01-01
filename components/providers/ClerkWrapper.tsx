"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

export function ClerkWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Skip ClerkProvider for visual editor
  if (pathname?.includes("/visual-editor")) {
    return <>{children}</>;
  }

  // Check if Clerk keys are available
  const hasClerkKeys = !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  );

  // Only render ClerkProvider if keys are available
  if (!hasClerkKeys) {
    console.warn("Clerk keys not configured. Running without authentication.");
    return <>{children}</>;
  }

  return <ClerkProvider>{children}</ClerkProvider>;
}

