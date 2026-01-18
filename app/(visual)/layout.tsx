// Nested layout for (visual) route group
// This wraps children without html/body tags to preserve root layout with ClerkProvider
export default function VisualLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}

