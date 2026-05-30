import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import WalletProvider from "@/components/WalletProvider";

export const metadata: Metadata = {
  title: "Omen — Attested AI Judgment on Ritual",
  description: "Signs read from evidence. Verdicts that persist. Agents that act on what they know.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ background: "#0a0a0a" }}>
        <WalletProvider>
          <Nav />
          <main style={{ minHeight: "calc(100vh - 60px)" }}>
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}
