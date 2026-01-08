"use client";

import { useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export function HomeContent() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  
  useEffect(() => {
    if (isLoaded && user) {
      router.push("/dashboard");
    }
  }, [user, isLoaded, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold mb-4">Welcome to Trading Lab</h1>
        <p className="text-muted-foreground mb-6">Please sign in to continue</p>
        <div className="space-y-4">
          {isLoaded && user ? (
            <p>Redirecting to dashboard...</p>
          ) : (
            <SignInButton mode="modal">
              <Button>Sign In</Button>
            </SignInButton>
          )}
        </div>
      </div>
    </div>
  );
}

