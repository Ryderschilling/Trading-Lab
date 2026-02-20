import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Global helper for coloring P&L-like numbers across the app.
 * Positive => green, Negative => red, Zero => neutral/foreground.
 */
export function pnlTextClass(
  value: number,
  opts?: { zero?: "foreground" | "muted" }
): string {
  const zero = opts?.zero ?? "foreground";
  if (value > 0) return "text-green-500";
  if (value < 0) return "text-red-500";
  return zero === "muted" ? "text-muted-foreground" : "text-foreground";
}