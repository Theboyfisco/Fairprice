"use client";

import { useState } from "react";
import { Copy, ExternalLink, CheckCircle, Code2, ChevronDown, ChevronUp } from "lucide-react";

interface TechnicalPanelProps {
  fixtureId: number;
  marketPda: string;
  vaultPda: string;
  programId?: string;
  settledTxSig?: string | null;
}

const TXLINE_PROGRAM_ID = "6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J";
const DEFAULT_PROGRAM_ID = "7Ao2A14qmYxnERuFRcGhFqVgA1p55eKr5RLfjhR9gXm8";

function short(value: string) {
  return value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}

function Row({ label, value, link, mono = true }: { label: string; value: string; link?: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.04] py-2 last:border-0">
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`truncate text-[10px] ${mono ? "font-mono" : ""} text-gray-300`}>
          {short(value)}
        </span>
        <button
          type="button"
          onClick={copy}
          className="text-gray-600 hover:text-green-400 transition-colors shrink-0"
          title={`Copy ${label}`}
        >
          {copied ? (
            <CheckCircle className="w-3 h-3 text-green-400" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </button>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="text-gray-600 hover:text-green-400 transition-colors shrink-0"
            title={`Open ${label} on Solscan`}
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

// CPI Instruction pseudo-code display
function CPICodeBlock({ fixtureId }: { fixtureId: number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/50 p-3 font-mono text-[9px] space-y-0.5 overflow-x-auto">
      <div className="text-gray-600">// FairPlay → TxLINE CPI (Anchor IDL)</div>
      <div>
        <span className="text-purple-400">ctx</span>
        <span className="text-gray-400">.accounts.txline_program.</span>
        <span className="text-green-400">validate_stat</span>
        <span className="text-gray-400">(</span>
      </div>
      <div className="pl-3">
        <span className="text-cyan-400">fixture_id</span>
        <span className="text-gray-400">: </span>
        <span className="text-amber-400">{fixtureId}</span>
        <span className="text-gray-400">,</span>
      </div>
      <div className="pl-3">
        <span className="text-cyan-400">stat_key</span>
        <span className="text-gray-400">: </span>
        <span className="text-amber-400">1002</span>
        <span className="text-gray-400">, </span>
        <span className="text-gray-600">// Home Goals</span>
      </div>
      <div className="pl-3">
        <span className="text-cyan-400">merkle_root</span>
        <span className="text-gray-400">: </span>
        <span className="text-green-400">[u8; 32]</span>
        <span className="text-gray-400">,</span>
      </div>
      <div className="pl-3">
        <span className="text-cyan-400">proof_path</span>
        <span className="text-gray-400">: Vec&lt;</span>
        <span className="text-green-400">ProofNode</span>
        <span className="text-gray-400">&gt;,</span>
      </div>
      <div>
        <span className="text-gray-400">)</span>
      </div>
    </div>
  );
}

export default function TechnicalPanel({
  fixtureId,
  marketPda,
  vaultPda,
  programId = DEFAULT_PROGRAM_ID,
  settledTxSig,
}: TechnicalPanelProps) {
  const [showCpi, setShowCpi] = useState(false);

  return (
    <div className="glass rounded-2xl p-4 border border-white/[0.04] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-purple-400" />
          <h4 className="text-sm font-black text-white">On-Chain Explorer</h4>
        </div>
        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
          Devnet
        </span>
      </div>

      <div className="space-y-0">
        <Row label="Fixture ID" value={String(fixtureId)} mono={false} />
        <Row
          label="FairPlay Program"
          value={programId}
          link={`https://solscan.io/account/${programId}?cluster=devnet`}
        />
        <Row
          label="Market PDA"
          value={marketPda}
          link={`https://solscan.io/account/${marketPda}?cluster=devnet`}
        />
        <Row
          label="Vault PDA"
          value={vaultPda}
          link={`https://solscan.io/account/${vaultPda}?cluster=devnet`}
        />
        <Row
          label="TxLINE Program"
          value={TXLINE_PROGRAM_ID}
          link={`https://solscan.io/account/${TXLINE_PROGRAM_ID}?cluster=devnet`}
        />
        {settledTxSig && (
          <Row
            label="Settlement Tx"
            value={settledTxSig}
            link={`https://solscan.io/tx/${settledTxSig}?cluster=devnet`}
          />
        )}
      </div>

      {/* CPI code toggle */}
      <button
        onClick={() => setShowCpi((v) => !v)}
        className="w-full flex items-center justify-between text-[10px] text-gray-600 hover:text-gray-400 transition-colors border-t border-white/[0.04] pt-3"
      >
        <span className="font-bold uppercase tracking-wider">View CPI Call Signature</span>
        {showCpi ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {showCpi && <CPICodeBlock fixtureId={fixtureId} />}
    </div>
  );
}
