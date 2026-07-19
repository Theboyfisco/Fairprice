"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MatchCard, { Fixture } from "@/components/MatchCard";
import {
  CheckCircle,
  Zap,
  Award,
  Bot,
  FileCheck,
  Radio,
  Lock,
  ShieldCheck,
  Trophy,
  ArrowRight,
  Database,
  GitBranch,
  Activity,
  ChevronRight,
} from "lucide-react";

const DEMO_FIXTURES: Fixture[] = [
  {
    fixtureId: 18172379,
    homeTeam: "USA",
    awayTeam: "Mexico",
    homeScore: 2,
    awayScore: 1,
    gamePhase: "LIVE",
    kickoff: "2026-07-09T15:15:00.000Z",
  },
  {
    fixtureId: 18143851,
    homeTeam: "Brazil",
    awayTeam: "Germany",
    homeScore: 0,
    awayScore: 0,
    gamePhase: "NS",
    kickoff: "2026-07-09T18:00:00.000Z",
  },
  {
    fixtureId: 18143852,
    homeTeam: "France",
    awayTeam: "Argentina",
    homeScore: 3,
    awayScore: 2,
    gamePhase: "FT",
    kickoff: "2026-07-09T13:00:00.000Z",
  },
];

// Architecture flow diagram
const ARCH_STEPS = [
  {
    icon: Radio,
    label: "TxLINE SSE",
    detail: "Real-time sports stats via Server-Sent Events",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: ShieldCheck,
    label: "Merkle Proof",
    detail: "Cryptographic stat validation from TxLINE API",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: Zap,
    label: "FairPlay CPI",
    detail: "On-chain validate_stat call resolves the market",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
  },
  {
    icon: Trophy,
    label: "Trustless Payout",
    detail: "USDC vault unlocked for winning bettors",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
];

// Lifecycle steps for the settled match
const LIFECYCLE = [
  { label: "Market Created", done: true, icon: Database },
  { label: "Bets Locked", done: true, icon: Lock },
  { label: "TxLINE Proof Fetched", done: true, icon: GitBranch },
  { label: "CPI Verified On-Chain", done: true, icon: ShieldCheck },
  { label: "Winnings Claimable", done: true, icon: Trophy },
] as const;

const WALKTHROUGH_STYLES = {
  blue: {
    card: "border-blue-500/15 hover:border-blue-500/30",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    link: "text-blue-400 hover:text-blue-300",
  },
  red: {
    card: "border-red-500/15 hover:border-red-500/30",
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
    link: "text-red-400 hover:text-red-300",
  },
  green: {
    card: "border-green-500/15 hover:border-green-500/30",
    badge: "bg-green-500/10 text-green-400 border-green-500/20",
    link: "text-green-400 hover:text-green-300",
  },
} as const;

// Live streaming ticker
function StreamingTicker() {
  const events = [
    { time: "45'", text: "GOAL! USA — Pulisic (18172379)", color: "text-green-400" },
    { time: "38'", text: "YELLOW CARD — Mexico (18172379)", color: "text-amber-400" },
    { time: "23'", text: "GOAL! USA — Adams (18172379)", color: "text-green-400" },
    { time: "12'", text: "GOAL! Mexico — Jimenez (18172379)", color: "text-red-400" },
    { time: "FT", text: "FULL TIME — France 3–2 Argentina (18143852)", color: "text-gray-400" },
    { time: "90'", text: "GOAL! France — Giroud (18143852)", color: "text-green-400" },
  ];

  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % events.length);
        setVisible(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const e = events[idx];
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-mono font-bold text-gray-600">{e.time}</span>
      <span
        className={`text-[11px] font-semibold transition-all duration-400 ${
          visible ? "opacity-100" : "opacity-0"
        } ${e.color}`}
      >
        {e.text}
      </span>
      <Activity className="w-3 h-3 text-green-400 animate-pulse ml-auto" />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color = "text-white",
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="glass-sm rounded-xl border border-white/[0.05] p-3 text-center">
      <div className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-xl font-black font-mono ${color}`}>{value}</div>
      {sub && <div className="text-[9px] text-gray-600 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function DemoPage() {
  const [sseCount, setSseCount] = useState(127);
  const [elapsed, setElapsed] = useState(45);

  useEffect(() => {
    const i = setInterval(() => {
      setSseCount((n) => n + Math.floor(Math.random() * 3));
      setElapsed((n) => Math.min(n + 1, 90));
    }, 8000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero */}
      <div className="relative glass rounded-3xl p-6 sm:p-10 border border-green-500/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-purple-500/8 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-400">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
              Judge Demonstration Mode
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none">
              FairPlay
              <span className="block gradient-text-green">Sandbox</span>
            </h1>
            <p className="text-sm text-gray-400 max-w-xl leading-relaxed">
              A fully deterministic judge environment. Three curated fixtures demonstrate the complete
              FairPlay lifecycle — from TxLINE SSE streaming to cryptographic market settlement with
              Merkle proofs.
            </p>
          </div>

          {/* Live stats */}
          <div className="grid grid-cols-2 gap-3 shrink-0 w-full md:w-auto md:min-w-[220px]">
            <StatCard label="SSE Events" value={String(sseCount)} sub="TxLINE stream" color="text-green-400" />
            <StatCard label="Live Match" value={`${elapsed}'`} sub="USA vs Mexico" color="text-red-400" />
            <StatCard label="Program ID" value="7Ao2A1…" sub="Solana devnet" color="text-purple-400" />
            <StatCard label="Proof CPI" value="Active" sub="validate_stat" color="text-cyan-400" />
          </div>
        </div>

        {/* Streaming ticker */}
        <div className="relative mt-6 rounded-xl border border-white/[0.06] bg-black/30 px-4 py-2.5">
          <div className="text-[9px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
            TxLINE Live Stream
          </div>
          <StreamingTicker />
        </div>
      </div>

      {/* Architecture */}
      <div className="glass rounded-2xl p-6 border border-white/[0.06]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-black text-white">Architecture Flow</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              End-to-end trustless sports prediction, from data feed to payout
            </p>
          </div>
          <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-1">
            No Oracle
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ARCH_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="relative">
                <div
                  className={`rounded-2xl border ${step.bg} p-4 space-y-2 h-full`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl border ${step.bg} flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <div className={`text-sm font-black ${step.color}`}>{step.label}</div>
                  <div className="text-[10px] text-gray-500 leading-snug">{step.detail}</div>
                </div>
                {i < ARCH_STEPS.length - 1 && (
                  <div className="hidden sm:flex absolute top-1/2 -right-1.5 -translate-y-1/2 z-10">
                    <ChevronRight className="w-3 h-3 text-gray-600" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Walkthrough steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            num: 1,
            color: "blue",
            title: "Place a Bet",
            body: "Select the upcoming match Brazil vs Germany to place a test USDC prediction. Mint test tokens from the faucet if needed.",
            link: "/match/18143851",
            cta: "Open Upcoming Match",
            fixture: "Betting Open",
          },
          {
            num: 2,
            color: "red",
            title: "Watch Live Stream",
            body: "Open USA vs Mexico. You'll see real-time goals and events streaming via TxLINE SSE. Watch the score update in real-time.",
            link: "/match/18172379",
            cta: "Watch Live Match",
            fixture: "Live Now",
          },
          {
            num: 3,
            color: "green",
            title: "Settle & Claim",
            body: "Open France vs Argentina. Trigger the Keeper Bot to fetch the TxLINE Merkle proof, settle on-chain, and claim winnings.",
            link: "/match/18143852",
            cta: "Open Finished Match",
            fixture: "Claimable",
          },
        ].map((s) => {
          const styles = WALKTHROUGH_STYLES[s.color as keyof typeof WALKTHROUGH_STYLES];
          return (
          <div
            key={s.num}
            className={`glass rounded-2xl p-5 border space-y-3 group transition-colors ${styles.card}`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex items-center justify-center w-7 h-7 rounded-xl font-mono text-sm font-black border ${styles.badge}`}
              >
                {s.num}
              </span>
              <h3 className="font-black text-white text-sm">{s.title}</h3>
              <span className={`ml-auto text-[9px] font-bold rounded-full px-2 py-0.5 border ${styles.badge}`}>
                {s.fixture}
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{s.body}</p>
            <Link
              href={s.link}
              className={`text-xs font-bold inline-flex items-center gap-1 group-hover:gap-2 transition-all ${styles.link}`}
            >
              {s.cta} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          );
        })}
      </div>

      {/* Sandbox matches */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white">Curated Sandbox Matches</h2>
          <span className="text-[10px] text-gray-500 font-mono">FIXTURE SOURCE: TXLINE MOCK SNAPSHOT</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {DEMO_FIXTURES.map((fixture, i) => (
            <div key={fixture.fixtureId} className="relative group">
              <MatchCard fixture={fixture} index={i} />
              <div className="absolute -bottom-2.5 left-5 bg-[#050811] px-2.5 py-0.5 rounded-full border border-white/10 text-[9px] font-bold text-gray-400 z-20">
                {fixture.gamePhase === "LIVE" ? (
                  <span className="text-red-400">🔥 SSE Live Feed</span>
                ) : fixture.gamePhase === "NS" ? (
                  <span className="text-blue-400">🎟️ Open Betting Market</span>
                ) : (
                  <span className="text-green-400">🏆 Settlement + Payout</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row: Winning bet + Receipt */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Settled market lifecycle */}
        <div className="glass rounded-2xl p-6 border border-green-500/10 space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-green-400" />
            <h3 className="text-base font-black text-white">Settled Market Lifecycle</h3>
          </div>
          <p className="text-[11px] text-gray-500">France 3–2 Argentina — Market #18143852</p>

          <div className="space-y-2">
            {LIFECYCLE.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-green-500/15 border border-green-500/25 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-green-400" />
                  </div>
                  <span className="text-xs text-green-300 font-semibold">{step.label}</span>
                  <CheckCircle className="w-3.5 h-3.5 text-green-400 ml-auto" />
                </div>
              );
            })}
          </div>

          <div className="bg-green-500/[0.03] border border-green-500/15 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Locked Stake</span>
              <span className="font-bold text-green-400 font-mono">50.00 USDC</span>
            </div>
            <div className="flex justify-between border-t border-white/[0.04] pt-2">
              <span className="text-gray-500">Estimated Payout</span>
              <span className="font-black text-green-400 font-mono text-sm">112.50 USDC</span>
            </div>
          </div>

          <Link href="/match/18143852" className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold text-center inline-block">
            Open Match to Claim
          </Link>
        </div>

        {/* Receipt */}
        <div className="glass rounded-2xl p-6 border border-purple-500/10 space-y-4">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-black text-white">Permanent Proof Receipt</h3>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            Once a market is settled by TxLINE Merkle proof, a permanent receipt is compiled with the full
            cryptographic audit trail — Merkle root, proof path, stat key, CPI call, and Solscan links.
          </p>

          <div className="rounded-xl border border-white/[0.05] bg-black/30 p-4 space-y-2 text-[11px] font-mono">
            <div className="flex items-center gap-2 text-gray-600 border-b border-white/[0.04] pb-2 mb-2">
              <Bot className="w-3 h-3" />
              <span>SETTLEMENT RECEIPT PREVIEW</span>
            </div>
            <div className="text-gray-500">
              ROOT: <span className="text-green-400">ZEh3OVRWS3A2OGEx…</span>
            </div>
            <div className="text-gray-500">
              STAT: <span className="text-cyan-400">HOME_GOALS = 3</span>
            </div>
            <div className="text-gray-500">
              CPI: <span className="text-purple-400">validate_stat ✓</span>
            </div>
            <div className="text-gray-500">
              PROG: <span className="text-amber-400">7Ao2A14qmYxnERuF…</span>
            </div>
          </div>

          <Link
            href="/receipt/demo"
            className="btn-ghost w-full justify-center text-xs py-2.5 rounded-xl border border-purple-500/20 text-purple-300 font-bold inline-flex items-center gap-2 hover:bg-purple-500/10 transition-colors"
          >
            <FileCheck className="w-4 h-4" />
            Open Full Proof Receipt
          </Link>
        </div>
      </div>
    </div>
  );
}
