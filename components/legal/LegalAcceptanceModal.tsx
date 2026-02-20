"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function LegalAcceptanceModal({ open }: { open: boolean }) {
  const router = useRouter();

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptDisclaimer, setAcceptDisclaimer] = useState(false);
  const [acceptAIPolicy, setAcceptAIPolicy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return acceptTerms && acceptPrivacy && acceptDisclaimer && acceptAIPolicy && !submitting;
  }, [acceptTerms, acceptPrivacy, acceptDisclaimer, acceptAIPolicy, submitting]);

  async function onAccept() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/legal/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          terms: true,
          privacy: true,
          disclaimer: true,
          aiPolicy: true,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to accept legal terms.");
      }

      // Refresh server components so getCurrentUser() re-runs and modal closes.
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Accept Terms to Continue</DialogTitle>
          <DialogDescription>
            Before using Trading Lab, you must review and accept the following policies.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-border/40 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox checked={acceptTerms} onCheckedChange={(v) => setAcceptTerms(Boolean(v))} />
              <div className="text-sm">
                I agree to the{" "}
                <Link className="underline" href="/terms" target="_blank">
                  Terms of Service
                </Link>
                .
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox checked={acceptPrivacy} onCheckedChange={(v) => setAcceptPrivacy(Boolean(v))} />
              <div className="text-sm">
                I agree to the{" "}
                <Link className="underline" href="/privacy" target="_blank">
                  Privacy Policy
                </Link>
                .
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                checked={acceptDisclaimer}
                onCheckedChange={(v) => setAcceptDisclaimer(Boolean(v))}
              />
              <div className="text-sm">
                I acknowledge the{" "}
                <Link className="underline" href="/disclaimer" target="_blank">
                  Financial &amp; AI Disclaimer
                </Link>
                .
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox checked={acceptAIPolicy} onCheckedChange={(v) => setAcceptAIPolicy(Boolean(v))} />
              <div className="text-sm">
                I agree to the{" "}
                <Link className="underline" href="/ai-policy" target="_blank">
                  AI Policy
                </Link>
                .
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground leading-5">
            Trading Lab is an educational journaling/analytics product. It does not provide investment advice.
            AI outputs can be incorrect. You are responsible for verifying information before acting.
          </div>

          {error ? <div className="text-sm text-red-500">{error}</div> : null}

          <div className="flex items-center justify-end gap-2">
            <Button onClick={onAccept} disabled={!canSubmit}>
              {submitting ? "Saving..." : "I Agree"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}