import Link from "next/link";

export function LegalLinks() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <Link className="underline hover:text-foreground" href="/terms">
        Terms
      </Link>
      <span className="opacity-60">·</span>
      <Link className="underline hover:text-foreground" href="/privacy">
        Privacy
      </Link>
      <span className="opacity-60">·</span>
      <Link className="underline hover:text-foreground" href="/disclaimer">
        Disclaimer
      </Link>
      <span className="opacity-60">·</span>
      <Link className="underline hover:text-foreground" href="/ai-policy">
        AI Policy
      </Link>
    </div>
  );
}