"use client";

import { useState } from "react";
import { Bot, CheckCircle, Loader2, Play, Terminal } from "lucide-react";

interface KeeperPanelProps {
  gamePhase: string;
  isSettled?: boolean;
  onTriggerSettle?: () => Promise<string>; // returns tx signature
}

export default function KeeperPanel({
  gamePhase,
  isSettled = false,
  onTriggerSettle,
}: KeeperPanelProps) {
  const finished = gamePhase === "FT";
  const live = gamePhase === "LIVE" || gamePhase === "HT";

  const [simulating, setSimulating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [txSig, setTxSig] = useState<string | null>(null);

  const status = isSettled
    ? "Settlement complete"
    : finished
    ? "Ready to settle"
    : live
    ? "Watching live stream"
    : "Armed for kickoff";

  const runSimulation = async () => {
    if (!onTriggerSettle) return;
    setSimulating(true);
    setLogs([]);
    setTxSig(null);

    const log = (msg: string) => setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    try {
      log("Initializing Keeper daemon...");
      await new Promise((r) => setTimeout(r, 1000));
      
      log("Scanning TxLINE SSE stream...");
      await new Promise((r) => setTimeout(r, 1000));
      
      log(`Detected finished match phase for Fixture! Status: ${gamePhase}`);
      await new Promise((r) => setTimeout(r, 1000));

      log("Fetching cryptographic proof from TxLINE validation API...");
      await new Promise((r) => setTimeout(r, 1200));

      log("Verifying Merkle root & events root locally...");
      await new Promise((r) => setTimeout(r, 800));

      log("Broadcasting settleMarket CPI transaction to Solana Devnet...");
      
      // Execute the actual contract action or mock
      const sig = await onTriggerSettle();
      setTxSig(sig);

      log(`Transaction confirmed! Sig: ${sig.slice(0, 10)}...${sig.slice(-10)}`);
      log("Market settled successfully. Keeper sleeping.");
    } catch (err: any) {
      log(`[ERROR] Keeper execution halted: ${err.message || err}`);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-4 border border-cyan-500/15 space-y-4">
      <div className="flex items-center gap-2">
        <Bot className="w-5 h-5 text-cyan-400" />
        <h4 className="text-sm font-black text-white">Keeper Simulation</h4>
        {simulating && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin ml-auto" />}
        {(finished || isSettled) && !simulating && <CheckCircle className="w-3.5 h-3.5 text-green-400 ml-auto" />}
      </div>
      
      <p className="text-xs text-gray-500 leading-relaxed">
        A keeper watches TxLINE streams, detects full time, grabs the validation proof, and triggers permissionless on-chain settlement.
      </p>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ["SSE Stream", live || finished || isSettled],
          ["Stat Proof", finished || isSettled],
          ["Solana CPI", isSettled],
        ].map(([label, active]) => (
          <div key={label as string} className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-2">
            <div className={`mx-auto mb-1 h-1.5 w-1.5 rounded-full ${active ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)] animate-pulse" : "bg-gray-700"}`} />
            <div className="text-[10px] font-bold text-gray-400">{label as string}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-xl bg-cyan-500/8 border border-cyan-500/15 px-3 py-2 text-[11px] font-bold text-cyan-300">
        <span>Status: {status}</span>
        {finished && !isSettled && !simulating && onTriggerSettle && (
          <button
            onClick={runSimulation}
            className="flex items-center gap-1 bg-cyan-400 text-black px-2 py-0.5 rounded-md hover:bg-cyan-300 transition-all font-black text-[9px]"
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            RUN KEEPER
          </button>
        )}
      </div>

      {/* Terminal log panel */}
      {(logs.length > 0 || simulating) && (
        <div className="rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-[9px] text-gray-300 space-y-1 max-h-[140px] overflow-y-auto">
          <div className="flex items-center gap-1.5 text-cyan-400 border-b border-white/[0.06] pb-1.5 mb-1.5">
            <Terminal className="w-3 h-3" />
            <span>KEEPER@GOALLINE-DAEMON:~</span>
          </div>
          {logs.map((log, i) => (
            <div key={i} className={log.includes("[ERROR]") ? "text-red-400" : log.includes("confirmed") ? "text-green-400" : ""}>
              {log}
            </div>
          ))}
          {simulating && <div className="text-cyan-400 animate-pulse">▋</div>}
        </div>
      )}
    </div>
  );
}
