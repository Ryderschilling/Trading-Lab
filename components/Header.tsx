"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, Bot, Bell, User } from "lucide-react";
import NavigationMenu from "@/components/NavigationMenu";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      <header className="relative w-full h-28 md:h-32 bg-background px-8 flex items-center">
        <div className="grid grid-cols-3 items-center w-full">

          {/* LEFT */}
          <div className="flex items-center gap-4">
            <Menu
              className="w-8 h-8 cursor-pointer transition-transform hover:scale-110"
              onClick={() => setOpen(true)}
            />
            <span className="font-semibold text-2xl md:text-3xl">
              Trading Lab
            </span>
          </div>

          {/* CENTER LOGO */}
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="Trading Lab Logo"
              width={240}
              height={240}
              priority
              className="object-contain"
            />
          </div>

          {/* RIGHT ICONS */}
          <div className="flex justify-end items-center gap-6 relative">
  {/* AI */}
  <Link href="/ai">
    <Bot className="w-7 h-7 cursor-pointer hover:opacity-70" />
  </Link>

  {/* Notifications */}
  <div className="relative">
    <Bell
      className="w-7 h-7 cursor-pointer hover:opacity-70"
      onClick={() => setShowNotifications(!showNotifications)}
    />

    {showNotifications && (
      <div className="absolute right-0 mt-4 w-72 rounded-xl bg-background border border-border shadow-xl p-4 z-50">
        <p className="text-sm opacity-70">No notifications yet</p>
      </div>
    )}
  </div>

  {/* Account */}
  <Link href="/profile">
    <User className="w-7 h-7 cursor-pointer hover:opacity-70" />
  </Link>
</div>

        </div>
      </header>

      {/* MENU */}
      {open && <NavigationMenu onClose={() => setOpen(false)} />}
    </>
  );
}
