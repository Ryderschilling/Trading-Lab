import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkWrapper } from "@/components/providers/ClerkWrapper";
import { ConditionalLayout } from "@/components/providers/ConditionalLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trading Lab",
  description: "Advanced trading performance tracking and analytics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClerkWrapper>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </ClerkWrapper>
      </body>
    </html>
  );
}

