"use client";

import { useState } from "react";
import { useFairPlayProgram } from "@/hooks/useFairPlayProgram";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { X, Loader2, Landmark, CheckCircle, ChevronRight } from "lucide-react";

interface BetModalProps {
  isOpen: boolean;
  onClose: () => void;
  fixtureId: number;
  marketType: string;
  marketTypeByte: number;
  outcome: string;
  odds: number;
  onSuccess: () => void;
}

type Step = "review" | "signing" | "confirmed";

export default function BetModal({
  isOpen,
  onClose,
  fixtureId,
  marketType,
  marketTypeByte,
  outcome,
  odds,
  onSuccess,
}: BetModalProps) {
  const { connected } = useWallet();
  const { fetchMarket, createMarket, placeBet, getMarketPda } = useFairPlayProgram();

  const [amount, setAmount] = useState("50");
  const [step, setStep] = useState<Step>("review");
  const [stepMsg, setStepMsg] = useState("");
  const [txSig, setTxSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const estimatedPayout = () => {
    const val = Number(amount);
    return isNaN(val) ? "0.00" : (val * odds).toFixed(2);
  };

  const handleBet = async () => {
    setError(null);
    const betAmount = Number(amount);
    if (isNaN(betAmount) || betAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setStep("signing");

    try {
      const marketPda = getMarketPda(fixtureId, marketTypeByte);

      setStepMsg("Checking market status on-chain...");
      const marketAccount = await fetchMarket(marketPda);

      if (!marketAccount) {
        setStepMsg("Initializing prediction market...");
        const closesAt = Math.floor(Date.now() / 1000) + 3600;
        await createMarket(fixtureId, marketTypeByte, closesAt);
      }

      setStepMsg("Signing transaction in wallet...");
      const isYes =
        outcome === "Home Win" || outcome === "Over 2.5" || outcome === "Yes" || outcome === "BTTS Yes";
      const sig = await placeBet(marketPda, betAmount, isYes);

      setTxSig(sig);
      setStep("confirmed");
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Transaction failed");
      setStep("review");
    }
  };

  const STEPS = [
    { key: "review", label: "Review" },
    { key: "signing", label: "Signing" },
    { key: "confirmed", label: "Confirmed" },
  ] as const;

  return (
    <div className="fixed inset-0 bg-[#050811]/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div
        className="glass rounded-3xl w-full max-w-[calc(100vw-2rem)] sm:max-w-sm border border-white/[0.08] relative overflow-hidden animate-fade-in-up"
        style={{ boxShadow: "0 0 60px rgba(0,255,135,0.08), 0 24px 64px rgba(0,0,0,0.6)" }}
      >
        {/* Top glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-32 bg-green-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05] relative">
          <div>
            <h3 className="font-black text-white text-base">Place Prediction</h3>
            <p className="text-[11px] text-gray-500">{marketType} · {outcome}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        {step !== "confirmed" && (
          <div className="flex items-center justify-center gap-2 px-6 pt-4 pb-0">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                  step === s.key
                    ? "bg-green-500 text-black"
                    : i === 0
                    ? "bg-green-500/20 text-green-400"
                    : "bg-white/5 text-gray-600"
                }`}>
                  {i + 1}
                </div>
                <span className={`text-[10px] font-semibold ${step === s.key ? "text-white" : "text-gray-600"}`}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-gray-700" />}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-5">
          {step === "confirmed" && txSig ? (
            /* ── Confirmed State ── */
            <div className="text-center py-4 space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h4 className="font-black text-white text-lg mb-1">Bet Locked! 🎉</h4>
                <p className="text-xs text-gray-500">
                  Your prediction is anchored on Solana. You'll be notified at settlement.
                </p>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05] text-left space-y-1">
                <div className="text-[10px] text-gray-600 font-bold uppercase">Transaction</div>
                <a
                  href={`https://solscan.io/tx/${txSig}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-green-400 hover:underline font-mono break-all"
                >
                  {txSig}
                </a>
              </div>
              <button onClick={onClose} className="w-full btn-primary py-3 rounded-2xl font-bold text-sm">
                Done
              </button>
            </div>
          ) : step === "signing" ? (
            /* ── Signing State ── */
            <div className="text-center py-6 space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-full border-2 border-white/10 border-t-green-400 animate-spin mx-auto" />
              <div>
                <h4 className="font-bold text-white mb-1">Processing...</h4>
                <p className="text-xs text-gray-500">{stepMsg}</p>
              </div>
            </div>
          ) : (
            /* ── Review State ── */
            <div className="space-y-4 animate-fade-in">
              {/* Summary */}
              <div className="glass-sm rounded-2xl p-4 space-y-2.5 border border-white/[0.04]">
                {[
                  { label: "Market", value: marketType },
                  { label: "Outcome", value: outcome },
                  { label: "Odds", value: `${odds.toFixed(2)}×`, highlight: true },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{row.label}</span>
                    <span className={`text-xs font-bold ${row.highlight ? "text-green-400" : "text-white"}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold block">Bet Amount (USDC)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-3.5 px-4 text-white text-xl font-black focus:outline-none focus:border-green-500/40 transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-600 font-bold">
                    USDC
                  </span>
                </div>
                {/* Quick amounts */}
                <div className="flex gap-2">
                  {[10, 50, 100, 250].map((v) => (
                    <button
                      key={v}
                      onClick={() => setAmount(String(v))}
                      className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                        amount === String(v)
                          ? "bg-green-500/15 border border-green-500/30 text-green-400"
                          : "bg-white/5 border border-white/[0.06] text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      ${v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Est. Return */}
              <div className="flex justify-between items-center glass-sm rounded-2xl p-4 border border-white/[0.04]">
                <span className="text-xs text-gray-500">Estimated Return</span>
                <span className="text-xl font-black text-green-400">{estimatedPayout()} USDC</span>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl">
                  {error}
                </div>
              )}

              {connected ? (
                <button
                  onClick={handleBet}
                  className="w-full btn-primary py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
                >
                  <Landmark className="w-4 h-4" />
                  Lock Bet on Solana
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-center text-[11px] text-gray-600">
                    Connect a Solana wallet to bet
                  </p>
                  <WalletMultiButton className="!w-full !rounded-2xl !h-12 !text-sm !font-bold" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
