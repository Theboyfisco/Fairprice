"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import DevnetFaucet from "./DevnetFaucet";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { Activity, Zap, Menu, X } from "lucide-react";
import { useSSEStream } from "@/hooks/useSSEStream";

export default function Navbar() {
  const { connected } = useWallet();
  const [eventCount, setEventCount] = useState(0);

  const { connected: sseConnected, lastEvent } = useSSEStream();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              FairPlay
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
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-[120px] justify-end">
            {mounted && connected && <DevnetFaucet />}
            {mounted ? <WalletMultiButton className="!h-9 !px-3 sm:!h-12 sm:!px-6 !text-xs sm:!text-sm" /> : <div className="h-9 sm:h-[48px] w-[100px] sm:w-[150px] bg-white/5 rounded-xl animate-pulse" />}
            <button 
              className="md:hidden p-1.5 text-gray-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed top-[88px] left-0 right-0 bottom-0 bg-[#050811]/95 backdrop-blur-3xl z-40 md:hidden animate-fade-in border-t border-white/[0.05] p-6 space-y-6">
          <Link
            href="/demo"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-extrabold text-green-400 bg-green-500/10 border border-green-500/25 px-4 py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <span className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
            Judge Demo
          </Link>
          <div className="flex flex-col gap-4">
            <Link href="/receipt/demo" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-gray-300 hover:text-white px-2 py-2 border-b border-white/[0.05]">
              Demo Receipt
            </Link>
            <Link href="/txline-feedback" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-gray-300 hover:text-white px-2 py-2 border-b border-white/[0.05]">
              TxLINE Notes
            </Link>
          </div>

          <div className="space-y-4 pt-4">
            {/* TxLINE Connection */}
            <div
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border ${
                sseConnected
                  ? "bg-green-500/10 border-green-500/25 text-green-400"
                  : "bg-red-500/10 border-red-500/25 text-red-400"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${sseConnected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
              <Activity className="w-4 h-4" />
              <span>TxLINE {sseConnected ? "Live" : "Offline"}</span>
            </div>

            {/* Network badge */}
            <div className="flex items-center justify-center bg-amber-500/10 border border-amber-500/25 px-4 py-3 rounded-xl text-sm text-amber-400 font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 bg-amber-400 rounded-full mr-2 animate-pulse" />
              Devnet
            </div>
          </div>
        </div>
      )}
    </>
  );
}
