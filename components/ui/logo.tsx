"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type LogoProps = {
  size?: "lg" | "md";
  className?: string;
};

export function Logo({ size = "md", className }: LogoProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sizes = {
    md: mounted ? "h-12" : "h-20", // sidebar default
    lg: mounted ? "h-20" : "h-28", // splash / loading
  };

  return (
    <img
      src="/logo.png"
      alt="Trading Lab"
      className={cn(
        "w-auto object-contain transition-all duration-300",
        sizes[size],
        className
      )}
    />
  );
}
