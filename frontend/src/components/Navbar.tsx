"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import DevnetFaucet from "./DevnetFaucet";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { Activity, Zap } from "lucide-react";
import { useSSEStream } from "@/hooks/useSSEStream";

export default function Navbar() {
  const { connected } = useWallet();
  const [eventCount, setEventCount] = useState(0);

  const { connected: sseConnected, lastEvent } = useSSEStream();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (lastEvent) {
      setEventCount((n) => n + 1);
    }
  }, [lastEvent]);

  return (
    <>
      {/* Risk & Compliance Global Banner */}
      <div className="fixed top-0 left-0 right-0 h-[28px] bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-center text-[10px] text-amber-400 font-bold uppercase tracking-wider z-50 px-4 text-center">
        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-2 animate-pulse shrink-0" />
        Devnet Test Market · No Real-Money Wagering · Designed as Verifiable Settlement Infrastructure
      </div>

      <nav className="fixed top-[28px] left-0 right-0 h-[60px] bg-[#050811]/85 backdrop-blur-xl border-b border-white/[0.06] z-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00ff87] to-[#22d3ee] flex items-center justify-center group-hover:shadow-[0_0_16px_rgba(0,255,135,0.5)] transition-all duration-300">
              <Zap className="w-4 h-4 text-[#050811]" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[18px] tracking-tight gradient-text-green">
              GoalLine
            </span>
          </Link>

          {/* Center: TxLINE Status */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/demo"
              className="text-xs font-extrabold text-green-400 bg-green-500/10 border border-green-500/25 px-2.5 py-1 rounded-lg hover:bg-green-500/20 transition-all duration-300 flex items-center gap-1.5 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
            >
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
              Judge Demo
            </Link>
            <Link href="/receipt/demo" className="text-xs font-bold text-gray-400 hover:text-white transition-colors">
              Demo Receipt
            </Link>
            <Link href="/txline-feedback" className="text-xs font-bold text-gray-400 hover:text-white transition-colors">
              TxLINE Notes
            </Link>

            {/* TxLINE Connection */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-500 ${
                sseConnected
                  ? "bg-green-500/10 border-green-500/25 text-green-400"
                  : "bg-red-500/10 border-red-500/25 text-red-400"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  sseConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
                }`}
              />
              <Activity className="w-3 h-3" />
              <span>TxLINE {sseConnected ? "Live" : "Offline"}</span>
              {sseConnected && eventCount > 0 && (
                <span className="bg-green-500/20 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                  {eventCount}
                </span>
              )}
            </div>

            {/* Network badge */}
            <div className="flex items-center bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 rounded-full text-xs text-amber-400 font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-1.5 animate-pulse" />
              Devnet
            </div>
          </div>

          {/* Right: Wallet */}
          <div className="flex items-center gap-3 shrink-0 min-w-[150px] justify-end">
            {mounted && connected && <DevnetFaucet />}
            {mounted ? <WalletMultiButton /> : <div className="h-[48px] w-[150px] bg-white/5 rounded-xl animate-pulse" />}
          </div>
        </div>
      </nav>
    </>
  );
}
