"use client";

import { useState } from "react";
import { useGoallineProgram } from "@/hooks/useGoallineProgram";
import { Coins, Loader2 } from "lucide-react";

export default function DevnetFaucet() {
  const { requestFaucet, loading } = useGoallineProgram();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMint = async () => {
    setError(null);
    setSuccess(false);
    try {
      await requestFaucet();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Minting failed. Ensure your wallet has Devnet SOL.");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleMint}
        disabled={loading}
        className="flex items-center space-x-1.5 bg-white/5 hover:bg-white/10 text-white font-semibold border border-white/10 px-3 py-1.5 rounded-xl text-sm transition-all duration-300 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        ) : (
          <Coins className="w-4 h-4 text-primary" />
        )}
        <span>Get 1000 USDC</span>
      </button>

      {success && (
        <div className="absolute right-0 top-12 bg-green-500/90 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-green-400 z-50">
          ✓ Minted 1,000 test USDC!
        </div>
      )}

      {error && (
        <div className="absolute right-0 top-12 bg-red-500/95 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-red-400 z-50">
          ⚠ {error.length > 40 ? error.substring(0, 40) + "..." : error}
        </div>
      )}
    </div>
  );
}
