"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
  Target,
  BookOpen,
  MessageSquare,
  Upload,
  Home,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { List } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "AI", href: "/assistant", icon: MessageSquare },
  { name: "Upload", href: "/upload", icon: Upload },
  { name: "Trades", href: "/trades", icon: List },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Journal", href: "/journal", icon: BookOpen },
  { name: "Goals", href: "/goals", icon: Target },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-20 bg-card border-r border-border flex flex-col items-center py-6 space-y-8">
      <div className="flex items-center justify-center">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center neon-glow-green">
          <Zap className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>
      <nav className="flex-1 space-y-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground neon-glow-green"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              title={item.name}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

