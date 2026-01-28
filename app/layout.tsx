import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trading Lab",
  description: "Advanced trading performance tracking and analytics",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

// Ensure Clerk publishable key is configured
// Required environment variable: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
// Note: Validation happens at runtime, not build time, to allow successful builds
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <html lang="en">
        <body className={inter.className}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}