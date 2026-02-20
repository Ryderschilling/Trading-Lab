import Link from "next/link";

export const dynamic = "force-static";

export default function AIPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">AI Policy</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1) What AI Does Here</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          AI features may summarize your journal entries, highlight patterns in your trades, and provide educational explanations.
          AI does not execute trades and does not connect to your broker.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2) What AI Is Not</h2>
        <ul className="list-disc pl-5 text-sm leading-6 text-muted-foreground space-y-1">
          <li>Not a financial advisor.</li>
          <li>Not a signal service.</li>
          <li>Not guaranteed accurate.</li>
          <li>Not real-time market data.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">3) Your Responsibilities</h2>
        <ul className="list-disc pl-5 text-sm leading-6 text-muted-foreground space-y-1">
          <li>Verify AI output independently before acting.</li>
          <li>Do not input sensitive data (SSNs, account passwords, payment credentials).</li>
          <li>Use AI for education and journaling support—not trade execution.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">4) Data Handling</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          We may send portions of your prompts and relevant context to an AI provider to generate responses. We do not
          guarantee that AI output is correct. See <Link className="underline" href="/privacy">Privacy Policy</Link>.
        </p>
      </section>

      <footer className="pt-6 border-t border-border/40 text-sm text-muted-foreground">
        Related: <Link className="underline" href="/terms">Terms</Link> ·{" "}
        <Link className="underline" href="/privacy">Privacy</Link> ·{" "}
        <Link className="underline" href="/disclaimer">Disclaimer</Link>
      </footer>
    </main>
  );
}