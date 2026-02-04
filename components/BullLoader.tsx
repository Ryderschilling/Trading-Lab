"use client";

export default function BullLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
      <div className="relative">
        {/* Soft ring */}
        <div className="absolute inset-0 rounded-full blur-xl opacity-40 bull-pulse-ring" />
        {/* Logo */}
        <img
          src="/logo.svg"
          alt="Trading Lab"
          className="w-16 h-16 opacity-90 bull-pulse"
          draggable={false}
        />
      </div>

      <div className="mt-4 text-sm tracking-wide bull-shimmer-text">Loading…</div>
    </div>
  );
}