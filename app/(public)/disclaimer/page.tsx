import Link from "next/link";

export const dynamic = "force-static";

export default function DisclaimerPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Financial & AI Disclaimer</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Educational Use Only</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Trading Lab provides journaling, analytics, and educational tools. Nothing on this platform constitutes
          investment advice, a recommendation, or an offer to buy or sell securities, options, or any financial instrument.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">No Financial Advisor Relationship</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Your use of the service does not create an advisor-client relationship. You are solely responsible for your
          investment decisions and verifying any information used.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Risk Disclosure</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Trading involves substantial risk, including possible loss of principal. Options trading may involve heightened
          risk and is not suitable for all investors. Past performance is not indicative of future results.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">AI Limitations</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          AI-generated outputs may be inaccurate, incomplete, fabricated, or outdated. Do not rely on AI output as a sole
          basis for trading decisions. Independently verify all information. See{" "}
          <Link className="underline" href="/ai-policy">AI Policy</Link>.
        </p>
      </section>

      <footer className="pt-6 border-t border-border/40 text-sm text-muted-foreground">
        Related: <Link className="underline" href="/terms">Terms</Link> ·{" "}
        <Link className="underline" href="/privacy">Privacy</Link> ·{" "}
        <Link className="underline" href="/ai-policy">AI Policy</Link>
      </footer>
    </main>
  );
}