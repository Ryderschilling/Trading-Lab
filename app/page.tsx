"use client";

import { useRouter } from "next/navigation";
import { useUser, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { user, isLoaded } = useUser();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (mounted && isLoaded && user) {
      router.push("/dashboard");
    }
  }, [mounted, user, isLoaded, router]);
  
  // Prevent hydration mismatch by not rendering Clerk hooks until mounted
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold mb-4">Welcome to Trading Lab</h1>
          <p className="text-muted-foreground mb-6">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold mb-4">Welcome to Trading Lab</h1>
        <p className="text-muted-foreground mb-6">Please sign in to continue</p>
        <div className="space-y-4">
          <SignedOut>
            <SignInButton mode="modal">
              <Button>Sign In</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <p>Redirecting to dashboard...</p>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}

