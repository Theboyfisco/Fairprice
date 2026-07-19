"use client";

import { ShieldAlert } from "lucide-react";

export default function ComplianceNotice() {
  return (
    <div className="glass rounded-2xl p-4 border border-amber-500/15 bg-amber-500/[0.03]">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <div>
          <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">Devnet Demonstration</h4>
          <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
            FairPlay is shown as verifiable settlement infrastructure using test tokens on Solana Devnet. It is not configured for real-money wagering or consumer betting.
          </p>
        </div>
      </div>
    </div>
  );
}
