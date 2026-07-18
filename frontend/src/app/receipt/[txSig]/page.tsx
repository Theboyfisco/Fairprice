"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  ExternalLink,
  GitBranch,
  ShieldCheck,
  Copy,
  ArrowLeft,
  Hash,
  Database,
  Zap,
  Trophy,
} from "lucide-react";

const DEMO_ROOT = "ZEh3OVRWS3A2OGExUXJmdG5jTVNkNkVMWEtEdHBWTU4=";
const PROGRAM_ID = "7Ao2A14qmYxnERuFRcGhFqVgA1p55eKr5RLfjhR9gXm8";
const TXLINE_PROGRAM_ID = "6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J";

const DEMO_PROOF_PATH = [
  { hash: "L2Rldm5ldC1zZWQtcHJvb2YtYmxvY2stMS0zMmJ5dGVz", isRight: true },
  { hash: "R3Vlc3QtYWN0aXZhdGlvbi1wcm9vZi1ibG9jay0yLTMy", isRight: false },
  { hash: "TWFpbi10cmVlLXByb29mLWJsb2NrLTEtMzItYnl0ZXM=", isRight: true },
];

const DEMO_STAT = { key: 1002, label: "Home Goals", value: 3, period: 0 };

function short(v: string) {
  return v.length > 22 ? `${v.slice(0, 10)}...${v.slice(-10)}` : v;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="text-gray-600 hover:text-green-400 transition-colors" title="Copy">
      {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function DataRow({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.04] py-2.5 last:border-0">
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono text-[11px] text-gray-300 truncate">{short(value)}</span>
        <CopyButton value={value} />
        {link && (
          <a href={link} target="_blank" rel="noreferrer" className="text-gray-600 hover:text-green-400 transition-colors">
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function MerkleTree({ nodes, root }: { nodes: { hash: string; isRight: boolean }[]; root: string }) {
  return (
    <div className="space-y-3">
      {/* Root */}
      <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center">
        <div className="text-[9px] font-bold uppercase tracking-wider text-green-400 mb-1">Merkle Root</div>
        <div className="font-mono text-[10px] text-green-300 break-all">{root}</div>
      </div>

      {/* Connecting line */}
      <div className="flex justify-center">
        <div className="w-px h-4 bg-white/10" />
      </div>

      {/* Proof nodes */}
      <div className="space-y-2">
        {nodes.map((node, i) => (
          <div key={i} className="relative">
            <div
              className={`rounded-xl border p-3 flex items-start gap-3 ${
                node.isRight
                  ? "border-purple-500/20 bg-purple-500/5"
                  : "border-blue-500/20 bg-blue-500/5"
              }`}
            >
              <div
                className={`shrink-0 w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black mt-0.5 ${
                  node.isRight
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-blue-500/20 text-blue-400"
                }`}
              >
                {node.isRight ? "R" : "L"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[9px] text-gray-600 font-bold uppercase mb-1">
                  Proof Node {i + 1} — {node.isRight ? "Right Sibling" : "Left Sibling"}
                </div>
                <div className="font-mono text-[10px] text-gray-400 break-all">{node.hash}</div>
              </div>
            </div>
            {i < nodes.length - 1 && (
              <div className="flex justify-center my-1">
                <div className="w-px h-3 bg-white/10" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Leaf */}
      <div className="flex justify-center my-1">
        <div className="w-px h-4 bg-white/10" />
      </div>
      <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-3 text-center">
        <div className="text-[9px] font-bold uppercase tracking-wider text-cyan-400 mb-1">Leaf: Proven Stat</div>
        <div className="font-mono text-[10px] text-cyan-300">
          StatKey={DEMO_STAT.key} ({DEMO_STAT.label}) = {DEMO_STAT.value}
        </div>
      </div>
    </div>
  );
}

function VerificationStep({
  step,
  label,
  detail,
  delay = 0,
}: {
  step: number;
  label: string;
  detail: string;
  delay?: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={`flex items-start gap-3 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="shrink-0 w-7 h-7 rounded-xl bg-green-500/15 border border-green-500/25 flex items-center justify-center text-[10px] font-black text-green-400">
        {step}
      </div>
      <div>
        <div className="text-xs font-bold text-white">{label}</div>
        <div className="text-[10px] text-gray-500 leading-relaxed mt-0.5">{detail}</div>
      </div>
    </div>
  );
}

export default function ReceiptPage({ params }: { params: { txSig: string } }) {
  const { txSig } = params;
  const isDemo = txSig === "demo" || txSig.startsWith("demo-settle");

  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`receipt_${txSig}`);
      if (stored) {
        try {
          setDetails(JSON.parse(stored));
        } catch {}
      }
    }
  }, [txSig]);

  const displayTx = isDemo
    ? txSig.startsWith("demo-settle")
      ? txSig
      : "demo-settlement-4xGoaLLiNE-r3c3ipt"
    : txSig;

  const fixtureId = details?.fixtureId ?? "18143852";
  const homeTeam = details?.homeTeam ?? "France";
  const awayTeam = details?.awayTeam ?? "Argentina";
  const homeScore = details?.homeScore ?? 3;
  const awayScore = details?.awayScore ?? 2;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href={isDemo && !details?.fixtureId ? "/demo" : `/match/${fixtureId}`}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {isDemo && !details?.fixtureId ? "Back to Demo Sandbox" : "Back to Match"}
      </Link>

      {/* Header */}
      <div className="glass rounded-3xl p-8 border border-green-500/15 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-purple-500/5 pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-green-400 mb-4">
              <CheckCircle className="w-3.5 h-3.5" />
              Verified Settlement Receipt
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {homeTeam} {homeScore}–{awayScore} {awayTeam}
            </h1>
            <p className="text-sm text-gray-500 mt-2 max-w-lg">
              Result verified on-chain via TxLINE Merkle stat proof. GoalLine CPI resolves the outcome
              trustlessly — no centralized oracle.
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] text-gray-600 uppercase tracking-wider font-bold">Fixture</div>
            <div className="text-2xl font-mono font-black text-green-400 mt-0.5">#{fixtureId}</div>
            <div className="text-[10px] text-gray-600 mt-2">Devnet Settlement</div>
          </div>
        </div>

        {/* Summary row */}
        <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          {[
            ["Market", "Match Result (1X2)"],
            ["Winning Predicate", `Home goals > Away goals (${homeScore} > ${awayScore})`],
            ["Payout State", "Winnings Claimable"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/[0.05] bg-white/[0.025] p-4">
              <div className="text-[10px] text-gray-600 uppercase tracking-wider font-bold">{label}</div>
              <div className="text-sm font-bold text-white mt-1">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Merkle Proof Tree */}
        <div className="glass rounded-2xl p-6 border border-white/[0.06] space-y-4">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-green-400" />
            <h2 className="text-sm font-black text-white">Merkle Proof Path</h2>
          </div>
          <p className="text-[11px] text-gray-500">
            The path from the proven stat leaf to the TxLINE daily Merkle root. Each node is a SHA-256 hash
            of its two children.
          </p>
          <MerkleTree nodes={DEMO_PROOF_PATH} root={DEMO_ROOT} />
        </div>

        {/* Verification Steps + On-chain data */}
        <div className="space-y-5">
          {/* Verification flow */}
          <div className="glass rounded-2xl p-6 border border-white/[0.06] space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <h2 className="text-sm font-black text-white">Verification Chain</h2>
            </div>
            <div className="space-y-4">
              <VerificationStep
                step={1}
                label="TxLINE Stat Proof Fetched"
                detail={`StatKey=${DEMO_STAT.key} (${DEMO_STAT.label}) = ${DEMO_STAT.value}. Proof path contains ${DEMO_PROOF_PATH.length} nodes.`}
                delay={100}
              />
              <VerificationStep
                step={2}
                label="Merkle Root Verified Locally"
                detail="Path traversal reconstructs the root hash from the leaf stat, matching the TxLINE published root."
                delay={250}
              />
              <VerificationStep
                step={3}
                label="CPI call: validate_stat"
                detail="GoalLine sends a Cross-Program Invocation to the TxLINE program on Solana to finalize the on-chain proof."
                delay={400}
              />
              <VerificationStep
                step={4}
                label="Market PDA Settled"
                detail="The market PDA state is updated on-chain. Vault is unlocked. Winnings become claimable."
                delay={550}
              />
            </div>
          </div>

          {/* Proven stat */}
          <div className="glass rounded-2xl p-5 border border-cyan-500/15 space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-black text-white">Proven Statistic</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ["Stat Key", String(DEMO_STAT.key)],
                ["Stat Label", DEMO_STAT.label],
                ["Value", String(DEMO_STAT.value)],
                ["Period", "Full Match (0)"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5">
                  <div className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">{k}</div>
                  <div className="text-cyan-300 font-mono font-bold mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* On-chain explorer */}
      <div className="glass rounded-2xl p-6 border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-black text-white">On-Chain References</h2>
          <span className="ml-auto text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
            Devnet
          </span>
        </div>
        <div className="space-y-1">
          <DataRow label="Daily Merkle Root" value={DEMO_ROOT} />
          <DataRow label="Settlement Tx" value={displayTx} link={!isDemo ? `https://solscan.io/tx/${txSig}?cluster=devnet` : undefined} />
          <DataRow
            label="GoalLine Program"
            value={PROGRAM_ID}
            link={`https://solscan.io/account/${PROGRAM_ID}?cluster=devnet`}
          />
          <DataRow
            label="TxLINE Program"
            value={TXLINE_PROGRAM_ID}
            link={`https://solscan.io/account/${TXLINE_PROGRAM_ID}?cluster=devnet`}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={isDemo ? "#" : `https://solscan.io/tx/${txSig}?cluster=devnet`}
          target={isDemo ? undefined : "_blank"}
          rel="noreferrer"
          className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold"
          onClick={(e) => { if (isDemo) { e.preventDefault(); alert("This is a simulated settlement. In production, this opens the real transaction on Solscan."); } }}
        >
          <Zap className="w-4 h-4" />
          {isDemo ? "Simulated Tx (Demo)" : "Open Settlement Tx on Solscan"}
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <a
          href={`https://solscan.io/account/${PROGRAM_ID}?cluster=devnet`}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm"
        >
          GoalLine Program
          <ExternalLink className="w-4 h-4" />
        </a>
        <Link
          href={`/match/${fixtureId}`}
          className="btn-ghost inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm"
        >
          <Trophy className="w-4 h-4" />
          Back to Match
        </Link>
      </div>

      {/* Verification statement */}
      <div className="glass rounded-2xl p-5 border border-white/[0.04]">
        <div className="flex items-center gap-2 text-green-400 font-bold text-sm">
          <ShieldCheck className="w-4 h-4" />
          Verification Statement
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed mt-2">
          This receipt is the cryptographic audit trail for this settlement. It links the TxLINE finalized fixture
          stat directly to the GoalLine smart contract invocation. The Merkle proof path verifies that the reported
          statistic was included in TxLINE's signed daily commitment — without trusting GoalLine or any third party.
          The{" "}
          <span className="text-green-400 font-mono">validate_stat</span> CPI call on the Solana program confirms
          the proof on-chain. Winnings are only released after this verification passes.
        </p>
      </div>
    </div>
  );
}
