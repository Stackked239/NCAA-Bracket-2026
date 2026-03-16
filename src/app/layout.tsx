import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "March Madness 2026 — Family Bracket Challenge",
  description: "Warren family NCAA bracket challenge",
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
