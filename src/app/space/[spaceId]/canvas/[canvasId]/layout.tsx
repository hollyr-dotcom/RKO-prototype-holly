export default function CanvasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Full-bleed layout — no sidebar, no top bar.
  // The canvas takes the entire viewport.
  return <div className="h-screen w-screen">{children}</div>;
}
