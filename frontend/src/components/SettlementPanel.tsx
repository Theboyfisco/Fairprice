"use client";

import { useState } from "react";
import { useFairPlayProgram } from "@/hooks/useFairPlayProgram";
import { Loader2, ShieldCheck, CheckCircle, Circle } from "lucide-react";
import { PublicKey } from "@solana/web3.js";
import ProofVisualizer from "./ProofVisualizer";
import Link from "next/link";

interface SettlementPanelProps {
  fixtureId: number;
  marketPda: PublicKey;
  isSettled: boolean;
}

type SettleStep = "idle" | "fetch-proof" | "verify-cpi" | "settled" | "error";

export default function SettlementPanel({
  fixtureId,
  marketPda,
  isSettled: initialIsSettled,
}: SettlementPanelProps) {
  const { settleMarket } = useFairPlayProgram();
  const [settled, setSettled] = useState(initialIsSettled);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [proofData, setProofData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<SettleStep>("idle");

  const STEPS = [
    { key: "fetch-proof", label: "Fetch TxLINE Merkle Proof" },
    { key: "verify-cpi", label: "Submit CPI to Solana Program" },
    { key: "settled", label: "Market Settled On-Chain" },
  ] as const;

  const getStepState = (key: string) => {
    const order = ["fetch-proof", "verify-cpi", "settled"];
    const currentIdx = order.indexOf(step);
    const stepIdx = order.indexOf(key);
    if (step === "error") return stepIdx <= currentIdx - 1 ? "done" : "idle";
    if (stepIdx < currentIdx) return "done";
    if (stepIdx === currentIdx) return "active";
    return "idle";
  };

  const handleSettle = async () => {
    setError(null);
    setStep("fetch-proof");

    try {
      const proofRes = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixtureId, seq: 941, statKey: 1002 }),
      });

      if (!proofRes.ok) throw new Error("Failed to fetch proof from TxLINE");
      const proof = await proofRes.json();
      setProofData(proof);

      setStep("verify-cpi");
      const sig = await settleMarket(marketPda, proof);

      setTxSig(sig);
      setStep("settled");
      setSettled(true);
    } catch (err: any) {
      setError(err.message || "Settlement failed");
      setStep("error");
    }
  };

  if (settled) {
    return (
      <div className="glass rounded-2xl p-5 border border-green-500/15 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-green-400" />
          <h4 className="font-bold text-sm text-white">Market Settled</h4>
          <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />
        </div>
        <div className="bg-green-500/8 border border-green-500/15 text-green-400 text-xs p-3 rounded-xl font-medium">
          ✓ Verified on-chain via TxLINE Merkle proof CPI
        </div>
        {txSig && (
          <a
            href={`https://solscan.io/tx/${txSig}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
            className="block text-[10px] text-green-400/60 font-mono hover:text-green-400 transition-colors truncate"
          >
            Tx: {txSig}
          </a>
        )}
        <Link
          href={`/receipt/${txSig ?? "demo"}`}
          className="block rounded-xl border border-green-500/15 bg-green-500/8 px-3 py-2 text-center text-[11px] font-bold text-green-400 hover:border-green-500/30 transition-colors"
        >
          Open permanent proof receipt
        </Link>
        {proofData && (
          <ProofVisualizer
            merkleRoot={proofData.eventStatRoot}
            statKey={1002}
            statValue={proofData.statToProve?.value}
            fixtureId={fixtureId}
            proofNodes={proofData.statProof ?? []}
          />
        )}
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-5 border border-white/[0.06] space-y-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-green-400" />
        <h4 className="font-bold text-sm text-white">Trustless Settlement</h4>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        The match has ended. Anyone can trigger settlement — it fetches the TxLINE
        cryptographic proof and verifies it on-chain via our program's CPI call.
        No trust required.
      </p>

      {/* Step indicator */}
      {step !== "idle" && (
        <div className="space-y-2">
          {STEPS.map((s) => {
            const state = getStepState(s.key);
            return (
              <div key={s.key} className="flex items-center gap-2.5">
                {state === "done" ? (
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                ) : state === "active" ? (
                  <Loader2 className="w-4 h-4 text-green-400 animate-spin shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-700 shrink-0" />
                )}
                <span className={`text-xs ${state === "active" ? "text-white font-semibold" : state === "done" ? "text-green-400" : "text-gray-600"}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Show proof preview while fetching */}
      {proofData && step === "verify-cpi" && (
        <ProofVisualizer
          merkleRoot={proofData.eventStatRoot}
          statKey={1002}
          fixtureId={fixtureId}
          proofNodes={proofData.statProof ?? []}
        />
      )}

      {step === "idle" || step === "error" ? (
        <button
          onClick={handleSettle}
          className="w-full btn-primary py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4" />
          Settle Market with TxLINE Proof
        </button>
      ) : step !== "settled" ? (
        <div className="text-center text-xs text-gray-600 font-mono animate-pulse">
          Verifying on Solana...
        </div>
      ) : null}
    </div>
  );
}
