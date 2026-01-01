"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

export function ClerkWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Skip ClerkProvider for visual editor
  if (pathname?.includes("/visual-editor")) {
    return <>{children}</>;
  }

  return <ClerkProvider>{children}</ClerkProvider>;
}

