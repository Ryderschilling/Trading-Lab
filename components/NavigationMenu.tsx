"use client";

import Link from "next/link";

export default function NavigationMenu({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="absolute top-14 left-0 w-56 bg-background border border-border shadow-lg z-50">
      <nav className="flex flex-col">
        {[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/analytics", label: "Analytics" },
          { href: "/trades", label: "Trades" },
          { href: "/journal", label: "Journal" },
          { href: "/calendar", label: "Calendar" },
          { href: "/goals", label: "Goals" },
          { href: "/upload", label: "Upload" },
          { href: "/assistant", label: "AI" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="px-4 py-2 hover:bg-muted"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}