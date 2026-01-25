"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, Bot, Bell, User } from "lucide-react";
import NavigationMenu from "@/components/NavigationMenu";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full h-20 md:h-24 bg-background px-6">
      <div className="grid grid-cols-3 items-center h-full">

        {/* LEFT: App Name */}
        <div className="flex items-center gap-4">
          <Menu
            className="w-7 h-7 cursor-pointer transition-transform hover:scale-105"
            onClick={() => setOpen(true)}
          />
          <span className="font-semibold text-xl md:text-2xl">
            Trading Lab
          </span>
        </div>

        {/* CENTER: LOGO */}
        <div className="flex justify-center">
          <Image
            src="/logo.png"
            alt="Trading Lab"
            width={56}
            height={56}
            className="object-contain"
          />
        </div>

        {/* RIGHT: ICONS */}
        <div className="flex justify-end items-center gap-5">
          <Bot className="w-6 h-6 cursor-pointer transition-opacity hover:opacity-70" />
          <Bell className="w-6 h-6 cursor-pointer transition-opacity hover:opacity-70" />
          <User className="w-6 h-6 cursor-pointer transition-opacity hover:opacity-70" />

        </div>

      </div>

      {open && <NavigationMenu onClose={() => setOpen(false)} />}
    </header>
  );
}
