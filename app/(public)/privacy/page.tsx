import Link from "next/link";

export const dynamic = "force-static";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1) What We Collect</h2>
        <ul className="list-disc pl-5 text-sm leading-6 text-muted-foreground space-y-1">
          <li>Account information (email, authentication identifiers).</li>
          <li>Trade/journal data you submit (symbols, timestamps, P&amp;L, notes, attachments if enabled).</li>
          <li>Usage data (pages visited, feature usage, basic diagnostics).</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2) How We Use Data</h2>
        <ul className="list-disc pl-5 text-sm leading-6 text-muted-foreground space-y-1">
          <li>Operate the service (store, render, analyze your trades).</li>
          <li>Provide AI-assisted summaries/insights when you request them.</li>
          <li>Improve reliability, prevent abuse, and support customers.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">3) AI Processing</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          When you use AI features, portions of your prompt and relevant context may be sent to an AI provider
          to generate outputs. Do not include sensitive personal information (SSNs, banking credentials, etc.)
          in prompts or notes. See <Link className="underline" href="/ai-policy">AI Policy</Link>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">4) Data Sharing</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          We do not sell your personal information. We may share data with service providers who help us run the
          app (hosting, analytics, authentication, AI) under contractual obligations.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">5) Data Retention</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          We retain your data for as long as your account is active. You may request deletion by contacting support.
          Some logs may be retained for security and compliance purposes for a limited time.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">6) Security</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          We use reasonable administrative, technical, and physical safeguards. No system is 100% secure.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">7) Your Rights</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Depending on your location, you may have rights to access, correct, export, or delete your data.
          Contact support to exercise these rights.
        </p>
      </section>

      <footer className="pt-6 border-t border-border/40 text-sm text-muted-foreground">
        Related: <Link className="underline" href="/terms">Terms</Link> ·{" "}
        <Link className="underline" href="/disclaimer">Disclaimer</Link> ·{" "}
        <Link className="underline" href="/ai-policy">AI Policy</Link>
      </footer>
    </main>
  );
}