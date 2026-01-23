"use client";

import { useState } from "react";
import NavigationMenu from "@/components/NavigationMenu";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full h-14 border-b border-border bg-background flex items-center px-4">
      {/* Hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="mr-4 text-xl"
        aria-label="Open navigation menu"
      >
        ☰
      </button>

      {/* App Title */}
      <span className="font-semibold text-lg">Trading Lab</span>

      {/* Navigation Dropdown */}
      {open && <NavigationMenu onClose={() => setOpen(false)} />}
    </header>
  );
}
