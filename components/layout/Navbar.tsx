"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Bell, MessageCircle, User, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Link from "next/link";

export function Navbar() {
  let user;
  try {
    const userResult = useUser();
    user = userResult.user;
  } catch (error) {
    // ClerkProvider not available during prerender, continue without user
    user = null;
  }
  const router = useRouter();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="border-b border-border/20 bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg border border-border/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Trading Lab</h1>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push("/assistant")}
            title="AI Assistant"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
            </Button>
            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border/20 rounded-md z-50">
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Notifications</h3>
                  <p className="text-sm text-foreground">No new notifications</p>
                </div>
              </div>
            )}
          </div>
          {user && (
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="rounded-full" title="Profile">
                <User className="w-5 h-5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

