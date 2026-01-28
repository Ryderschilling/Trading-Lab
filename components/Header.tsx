"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, Bot, Bell, User } from "lucide-react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close hamburger menu when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="relative w-full h-28 md:h-32 bg-background px-8 flex items-center z-40">
      <div className="grid grid-cols-3 items-center w-full">

        {/* LEFT — Hamburger + Title */}
        <div className="relative flex items-center gap-4" ref={menuRef}>
          <Menu
            className="w-8 h-8 cursor-pointer hover:opacity-70 transition"
            onClick={() => setMenuOpen(!menuOpen)}
          />

          <span className="font-semibold text-2xl md:text-3xl">
            Trading Lab
          </span>

          {menuOpen && (
            <div
              className="
                absolute left-0 top-14 w-80
                rounded-2xl bg-background
                border border-border
                shadow-2xl
                z-50
                animate-in fade-in slide-in-from-top-2 duration-200
              "
            >
              <nav className="flex flex-col py-2">
                {[
                  { href: "/dashboard", label: "Dashboard" },
                  { href: "/analytics", label: "Analytics" },
                  { href: "/trades", label: "Trades" },
                  { href: "/journal", label: "Journal" },
                  { href: "/calendar", label: "Calendar" },
                  { href: "/upload", label: "Upload" },
                  { href: "/assistant", label: "AI" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="
                      px-6 py-3 text-lg
                      hover:bg-muted
                      transition
                    "
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* CENTER — Logo */}
        <div className="flex justify-center">
          <Link href="/dashboard">
          <Image
            src="/logo.png"
            alt="Trading Lab Logo"
            width={220}
            height={220}
            priority
            className="cursor-pointer"
          />
          </Link>
        </div>

        {/* RIGHT — Icons */}
        <div className="flex justify-end items-center gap-6 relative">

          {/* AI (Visual Editor) */}
          <Link href="/assistant">
            <Bot className="w-7 h-7 text-foreground cursor-pointer hover:opacity-80 transition" />
          </Link>

          {/* Notifications */}
          <div className="relative">
            <Bell
              className="w-7 h-7 cursor-pointer hover:opacity-70 transition"
              onClick={() => setNotifOpen(!notifOpen)}
            />

            {notifOpen && (
              <div
                className="
                  absolute right-0 mt-4 w-72
                  rounded-xl bg-background
                  border border-border
                  shadow-xl p-4
                  z-50
                  animate-in fade-in slide-in-from-top-2 duration-200
                "
              >
                <p className="text-sm opacity-70">
                  No notifications yet
                </p>
              </div>
            )}
          </div>

          {/* Account (disabled until page exists) */}
          <Link href="/profile">
          <User className="w-7 h-7 test-foreground cursor-pointer hover:opacity-80 transition" />   
         </Link>
        </div>
      </div>
    </header>
  );
}
