import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "March Madness 2026 — Family Bracket Challenge",
  description: "Warren family NCAA bracket challenge",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
  themeColor: "#0f172a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MM26",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
