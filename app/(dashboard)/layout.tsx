import Header from "@/components/Header";
import { LegalLinks } from "@/components/LegalLinks";
import { LegalAcceptanceModal } from "@/components/legal/LegalAcceptanceModal";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  const needsLegalAcceptance =
    !!user &&
    (!user.acceptedTermsAt ||
      !user.acceptedPrivacyAt ||
      !user.acceptedDisclaimerAt ||
      !user.acceptedAIPolicyAt);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="w-full flex-1">
        <div className="mx-auto w-full max-w-7xl px-6 py-8">{children}</div>
      </main>

      <footer className="border-t border-border/40 py-6">
        <div className="mx-auto w-full max-w-7xl px-6">
          <LegalLinks />
        </div>
      </footer>

      {/* Blocks interaction until accepted; stored server-side */}
      <LegalAcceptanceModal open={needsLegalAcceptance} />
    </div>
  );
}