"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "header" | "page" | "default";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function Logo({ variant = "default", size = "md", className }: LogoProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Size configurations based on variant and size prop
  const sizeConfig = {
    header: {
      container: "w-8 h-8",
      image: mounted ? 32 : 40,
    },
    page: {
      container: "w-24 h-24",
      image: mounted ? 80 : 120,
    },
    default: {
      container: size === "sm" ? "w-6 h-6" : size === "lg" ? "w-16 h-16" : "w-10 h-10",
      image: size === "sm" ? 24 : size === "lg" ? 64 : 40,
    },
  };

  const config = sizeConfig[variant] || sizeConfig.default;

  return (
    <div className={cn("flex items-center justify-center", config.container, className)}>
      <Image
        src="/logo.png"
        alt="Trading Lab"
        width={config.image}
        height={config.image}
        className={cn(
          "object-contain transition-all duration-300",
          !mounted && "opacity-0"
        )}
        priority={variant === "page"}
      />
    </div>
  );
}
