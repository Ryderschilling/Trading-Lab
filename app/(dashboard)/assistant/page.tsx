import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { AIAssistant } from "@/components/assistant/AIAssistant";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function AIDisclaimerBanner() {
  return (
    <Card className="border-border/40">
      <CardContent className="p-4 space-y-2">
        <div className="text-sm font-medium text-foreground">
          Educational only — not financial advice.
        </div>
        <div className="text-sm text-muted-foreground leading-6">
          AI outputs can be inaccurate or incomplete. Verify anything before acting.{" "}
          <Link className="underline hover:text-foreground" href="/ai-policy">
            AI Policy
          </Link>{" "}
          ·{" "}
          <Link className="underline hover:text-foreground" href="/disclaimer">
            Disclaimer
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AssistantPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return (
    <div className="space-y-6 pb-28">
      <h1 className="text-3xl font-bold">AI</h1>

      {/* Step 3: AI disclaimer banner goes HERE */}
      <AIDisclaimerBanner />

      <AIAssistant />
    </div>
  );
}