import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexus — Competitor Analysis & Lead Gen Platform",
  description: "Identify competitors, compare features, generate B2B sales leads, and access actionable startup product and market recommendations in real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="bg-grid" />
        <div className="bg-pattern" />
        {children}
      </body>
    </html>
  );
}
