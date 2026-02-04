import Header from "@/components/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page container (this is the key fix) */}
      <main className="w-full">
        <div className="mx-auto w-full max-w-7xl px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
