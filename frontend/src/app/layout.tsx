import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers/WalletProvider";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "FairPlay | Trustless World Cup Prediction Market",
  description:
    "A decentralized prediction market powered by TxLINE real-time data streams and Solana smart contracts. Bet on World Cup outcomes and settle results cryptographically with Merkle proofs.",
  keywords: "Solana, prediction market, World Cup, TxLINE, betting, DeFi, crypto",
  openGraph: {
    title: "FairPlay — Trustless World Cup Predictions",
    description: "Bet on World Cup outcomes. Settle results via TxLINE cryptographic proofs anchored on Solana.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#050811] min-h-screen flex flex-col pt-[88px]">
        <Providers>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-white/[0.04] mt-auto py-6 px-4">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-500">FairPlay</span>
                <span>·</span>
                <span>Powered by TxLINE + Solana</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Devnet · Program: {process.env.NEXT_PUBLIC_PROGRAM_ID ? `${process.env.NEXT_PUBLIC_PROGRAM_ID.slice(0, 6)}…${process.env.NEXT_PUBLIC_PROGRAM_ID.slice(-4)}` : "7Ao2A1…gXm8"}
                </span>
                <a
                  href="https://github.com/Theboyfisco/TXcool-Prediction-Markets-and-Settlement"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-gray-400 transition-colors"
                >
                  GitHub ↗
                </a>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
