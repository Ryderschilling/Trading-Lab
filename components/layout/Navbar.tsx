"use client";

import { useUser } from "@clerk/nextjs";
import { Search, Bell, MessageCircle, User, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user } = useUser();

  return (
    <header className="border-b border-border bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <h1 className="text-2xl font-bold">Trading Lab</h1>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Start Search Here..."
              className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => window.open("/visual-editor", "_blank", "width=1400,height=900")}
            title="Open Visual Editor"
          >
            <Palette className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MessageCircle className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="w-5 h-5" />
          </Button>
          {user && (
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

