"use client";

import { useEffect, useState } from "react";

export function BullLogo({ className, src = "/logo.svg" }: { className?: string; src?: string }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(src);
        const text = await res.text();
        if (!cancelled) setSvg(text);
      } catch {
        if (!cancelled) setSvg(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!svg) return <div className={className} aria-hidden="true" />;

  return <div className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}