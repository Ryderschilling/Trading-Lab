import Link from "next/link";

export const dynamic = "force-static";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1) Overview</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Trading Lab provides educational trading journaling and analytics tools.
          It does not provide investment advice, trade signals, brokerage services,
          or execution of trades.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2) Not Investment Advice</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          All content and AI outputs are for educational purposes only.
          You are solely responsible for your trading decisions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">3) Limitation of Liability</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, TRADING LAB SHALL NOT BE LIABLE
          FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, EXEMPLARY, OR
          PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO TRADING LOSSES,
          LOSS OF PROFITS, LOSS OF DATA, OR BUSINESS INTERRUPTION.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">4) Arbitration Agreement</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Any dispute arising out of or relating to these Terms or the use of
          the Service shall be resolved by binding individual arbitration
          under the Federal Arbitration Act.
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          You agree to waive any right to participate in a class action lawsuit
          or class-wide arbitration.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">5) Governing Law</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          These Terms are governed by the laws of the State of Florida,
          without regard to conflict of law principles.
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          Any legal action not subject to arbitration shall be brought
          exclusively in courts located in Florida.
        </p>
      </section>

      <footer className="pt-6 border-t border-border/40 text-sm text-muted-foreground">
        Related: <Link className="underline" href="/privacy">Privacy</Link> ·{" "}
        <Link className="underline" href="/disclaimer">Disclaimer</Link> ·{" "}
        <Link className="underline" href="/ai-policy">AI Policy</Link>
      </footer>
    </main>
  );
}