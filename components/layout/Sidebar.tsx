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
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "AI", href: "/ai", icon: MessageSquare },
  { name: "Upload", href: "/upload", icon: Upload },
  { name: "Trades", href: "/trades", icon: List },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Journal", href: "/journal", icon: BookOpen },
  { name: "Goals", href: "/goals", icon: Target },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-20 bg-card border-r border-border/30 flex flex-col items-center py-6 space-y-10">
      {/* Logo */}
      <Logo variant="header" />

      {/* Navigation */}
      <nav className="flex-1 space-y-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-lg transition-colors",
                isActive
                  ? "bg-accent text-foreground"
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