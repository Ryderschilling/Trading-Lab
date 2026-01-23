import Header from "@/components/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="w-full min-h-screen p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

