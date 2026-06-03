import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import WalletProvider from "@/components/WalletProvider";

export const metadata: Metadata = {
  title: "Omen — Trust Infrastructure for Autonomous Coordination",
  description: "Verifiable trust signals for agents, wallets, and autonomous systems on Ritual Chain.",
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
