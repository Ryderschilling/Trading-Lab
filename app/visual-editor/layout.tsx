// Nested layout for visual-editor routes
// This wraps children without html/body tags to preserve root layout with ClerkProvider
export default function VisualEditorLayout({
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

