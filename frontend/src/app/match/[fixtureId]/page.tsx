"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Fixture, TeamLogo } from "@/components/MatchCard";
import BetModal from "@/components/BetModal";
import SettlementPanel from "@/components/SettlementPanel";
import LiveEventLog from "@/components/LiveEventLog";
import { useSSEStream } from "@/hooks/useSSEStream";
import LiquidityPanel from "@/components/LiquidityPanel";
import MarketLifecycleTimeline from "@/components/MarketLifecycleTimeline";
import TechnicalPanel from "@/components/TechnicalPanel";
import KeeperPanel from "@/components/KeeperPanel";
import ComplianceNotice from "@/components/ComplianceNotice";
import { useFairPlayProgram } from "@/hooks/useFairPlayProgram";
import { useWallet } from "@solana/wallet-adapter-react";
import { Loader2, ArrowLeft, ShieldAlert, Clock, FileCheck } from "lucide-react";
import Link from "next/link";

interface Odds {
  homeWin: number;
  draw: number;
  awayWin: number;
  over25: number;
  under25: number;
  bttsYes: number;
  bttsNo: number;
}

function Countdown({ kickoff }: { kickoff: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(kickoff).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Starting soon"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h > 0 ? `${h}h ` : ""}${m}m ${s}s`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [kickoff]);

  return (
    <div className="flex items-center gap-2 text-amber-400">
      <Clock className="w-4 h-4" />
      <span className="font-mono font-bold text-lg tabular-nums">{timeLeft}</span>
    </div>
  );
}

function AnimatedScore({ score, flash }: { score: number; flash: boolean }) {
  return (
    <span className={`tabular-nums transition-all duration-200 ${flash ? "score-flash" : ""}`}>
      {score}
    </span>
  );
}

export default function MatchDetail() {
  const params = useParams();
  const fixtureId = Number(params.fixtureId);
  const { connected } = useWallet();
  const { fetchBet, claimWinnings, getMarketPda, getVaultPda, settleMarket } = useFairPlayProgram();

  const [fixture, setFixture] = useState<Fixture | null>(null);
  const [odds, setOdds] = useState<Odds | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scoreFlash, setScoreFlash] = useState(false);
  const prevScore = useRef({ home: 0, away: 0 });

  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState("");
  const [selectedOdds, setSelectedOdds] = useState(1.0);
  const [marketTypeByte, setMarketTypeByte] = useState(0);

  const [onChainBet, setOnChainBet] = useState<any>(null);
  const [marketSettledState, setMarketSettledState] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [settledTxSig, setSettledTxSig] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedSig = localStorage.getItem(`last_sig_${fixtureId}`);
      if (storedSig) {
        setSettledTxSig(storedSig);
        setMarketSettledState(true);
      }
    }
  }, [fixtureId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fixtureRes, oddsRes] = await Promise.all([
        fetch("/api/fixtures"),
        fetch(`/api/odds/${fixtureId}`),
      ]);
      const fixtures: Fixture[] = await fixtureRes.json();
      const match = fixtures.find((f) => f.fixtureId === fixtureId);
      if (!match) throw new Error("Match not found");
      setFixture(match);
      prevScore.current = { home: match.homeScore, away: match.awayScore };

      const oddsData: Odds = await oddsRes.json();
      setOdds(oddsData);

      if (connected) {
        const marketPda = getMarketPda(fixtureId, 0);
        const bet = await fetchBet(marketPda);
        setOnChainBet(bet);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch match details");
    } finally {
      setLoading(false);
    }
  };

  const { lastEvent } = useSSEStream();

  useEffect(() => {
    fetchData();
  }, [fixtureId, connected]);

  useEffect(() => {
    if (lastEvent?.parsed) {
      const update = lastEvent.parsed;
      if (update?.fixtureId === fixtureId) {
        setFixture((prev) => {
          if (!prev) return null;
          const scoreChanged =
            (update.homeScore !== undefined && update.homeScore !== prev.homeScore) ||
            (update.awayScore !== undefined && update.awayScore !== prev.awayScore);
          if (scoreChanged) {
            setScoreFlash(true);
            setTimeout(() => setScoreFlash(false), 900);
          }
          return {
            ...prev,
            homeScore: update.homeScore ?? prev.homeScore,
            awayScore: update.awayScore ?? prev.awayScore,
            gamePhase: update.gamePhase ?? prev.gamePhase,
          };
        });
      }
    }
  }, [lastEvent, fixtureId]);

  const handleOpenBet = (market: string, outcome: string, lineOdds: number, typeByte: number) => {
    setSelectedMarket(market);
    setSelectedOutcome(outcome);
    setSelectedOdds(lineOdds);
    setMarketTypeByte(typeByte);
    setBetModalOpen(true);
  };

  const handleClaim = async () => {
    setClaimLoading(true);
    try {
      const marketPda = getMarketPda(fixtureId, 0);
      await claimWinnings(marketPda);
      await fetchData();
    } catch (err: any) {
      alert("Failed to claim: " + err.message);
    } finally {
      setClaimLoading(false);
    }
  };

  const handleSimulatedSettle = async () => {
    let sig = "demo-settle-" + Math.random().toString(36).substring(2, 15);
    try {
      if (connected) {
        const proofRes = await fetch("/api/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fixtureId, seq: 941, statKey: 1002 }),
        });
        if (proofRes.ok) {
          const proof = await proofRes.json();
          const marketPda = getMarketPda(fixtureId, 0);
          sig = await settleMarket(marketPda, proof);
        }
      }
    } catch (e: any) {
      console.warn("Settlement error:", e);
    }

    const receiptData = {
      fixtureId,
      homeTeam: fixture?.homeTeam || "France",
      awayTeam: fixture?.awayTeam || "Argentina",
      homeScore: fixture?.homeScore ?? 3,
      awayScore: fixture?.awayScore ?? 2,
      txSig: sig,
      settledAt: new Date().toISOString(),
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(`receipt_${sig}`, JSON.stringify(receiptData));
      localStorage.setItem(`last_sig_${fixtureId}`, sig);
    }
    setSettledTxSig(sig);
    setMarketSettledState(true);
    return sig;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-green-400 animate-spin" />
        <span className="text-gray-500 text-sm">Loading match data from TxLINE...</span>
      </div>
    );
  }

  if (error || !fixture) {
    return (
      <div className="glass rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 mt-12 border border-red-500/10">
        <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Error Loading Match</h2>
        <p className="text-xs text-gray-500">{error ?? "Fixture data unavailable."}</p>
        <Link href="/" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const isLive = fixture.gamePhase === "LIVE" || fixture.gamePhase === "HT";
  const isFinished = fixture.gamePhase === "FT";
  const isUpcoming = fixture.gamePhase === "NS";
  const primaryMarketPda = getMarketPda(fixtureId, 0);
  const primaryVaultPda = getVaultPda(primaryMarketPda);
  const demoSettled = isFinished || marketSettledState;
  const poolSeed = fixtureId % 1000;
  const matchResultPools = {
    yes: (18_000 + poolSeed * 11) * 1_000_000,
    no: (12_000 + poolSeed * 7) * 1_000_000,
  };
  const totalGoalPools = {
    yes: (9_500 + poolSeed * 5) * 1_000_000,
    no: (8_200 + poolSeed * 4) * 1_000_000,
  };
  const bttsPools = {
    yes: (7_400 + poolSeed * 3) * 1_000_000,
    no: (6_900 + poolSeed * 2) * 1_000_000,
  };

  return (
    <div className="space-y-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to All Matches
      </Link>

      {/* Scoreboard */}
      <div className="glass rounded-3xl relative overflow-hidden border border-white/[0.07]">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        {isLive && (
          <div className="absolute inset-0 border border-red-500/15 rounded-3xl animate-pulse pointer-events-none" />
        )}

        <div className="relative p-8 sm:p-12">
          {/* Status bar */}
          <div className="flex items-center justify-between mb-8 text-xs font-bold uppercase tracking-widest text-gray-600">
            <span>Match #{fixture.fixtureId}</span>
            <div className="flex items-center gap-2">
              {isLive && <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />}
              <span className={isLive ? "text-red-400" : isFinished ? "text-gray-500" : "text-blue-400"}>
                {isLive ? "LIVE" : isFinished ? "FULL TIME" : "UPCOMING"}
              </span>
            </div>
          </div>

          {/* Teams */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
            {/* Home */}
            <div className="flex-1 flex flex-col items-center gap-3 text-center">
              <TeamLogo team={fixture.homeTeam} className="w-24 h-16 sm:w-32 sm:h-24 mb-2" />
              <h2 className="text-lg sm:text-2xl font-black text-white">{fixture.homeTeam}</h2>
              <span className="text-xs text-gray-600 font-bold uppercase tracking-wider">Home</span>
            </div>

            {/* Score / VS */}
            <div className="flex flex-col items-center gap-2 px-6">
              {isUpcoming ? (
                <div className="space-y-2 text-center">
                  <div className="glass-sm rounded-2xl px-6 py-3 border border-white/[0.05]">
                    <span className="text-2xl font-black text-gray-500">VS</span>
                  </div>
                  <Countdown kickoff={fixture.kickoff} />
                </div>
              ) : (
                <div className="text-center">
                  <h1
                    className={`text-5xl sm:text-8xl font-extrabold tracking-tighter tabular-nums transition-all duration-300 ${
                      scoreFlash ? "text-green-400 text-glow-green" : "text-white"
                    }`}
                  >
                    {fixture.homeScore}
                    <span className="text-gray-600 mx-2">–</span>
                    {fixture.awayScore}
                  </h1>
                  {isFinished && (
                    <div className="text-xs text-gray-600 font-bold uppercase tracking-wider mt-2">
                      Final Score
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Away */}
            <div className="flex-1 flex flex-col items-center gap-3 text-center">
              <TeamLogo team={fixture.awayTeam} className="w-24 h-16 sm:w-32 sm:h-24 mb-2" />
              <h2 className="text-lg sm:text-2xl font-black text-white">{fixture.awayTeam}</h2>
              <span className="text-xs text-gray-600 font-bold uppercase tracking-wider">Away</span>
            </div>
          </div>
        </div>
      </div>

      <MarketLifecycleTimeline
        gamePhase={fixture.gamePhase}
        hasBet={Boolean(onChainBet)}
        isSettled={demoSettled}
        isClaimed={Boolean(onChainBet?.isClaimed)}
      />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Markets */}
        <div className="lg:col-span-2 space-y-5">
          <h3 className="text-lg font-black text-white">Prediction Markets</h3>

          {odds ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Match Result */}
              <div className="glass rounded-2xl p-5 border border-white/[0.05] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-white">Match Result (1X2)</h4>
                  <span className="text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">
                    Standard
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-sm">
                  {[
                    { label: "Home", value: odds.homeWin, outcome: "Home Win", type: 0 },
                    { label: "Draw", value: odds.draw, outcome: "Draw", type: 1 },
                    { label: "Away", value: odds.awayWin, outcome: "Away Win", type: 2 },
                  ].map((o) => (
                    <button
                      key={o.label}
                      onClick={() => handleOpenBet("Match Result", o.outcome, o.value, o.type)}
                      disabled={!isUpcoming}
                      title={!isUpcoming ? "Betting is closed — match has started or finished" : ""}
                      className="odds-chip"
                    >
                      <span className="text-[10px] text-gray-500 font-bold">{o.label}</span>
                      <span className="text-base font-extrabold text-green-400 mt-0.5">{o.value}x</span>
                    </button>
                  ))}
                </div>
                <LiquidityPanel
                  yesAmount={matchResultPools.yes}
                  noAmount={matchResultPools.no}
                  yesLabel="HOME"
                  noLabel="FIELD"
                />
              </div>

              {/* Over/Under */}
              <div className="glass rounded-2xl p-5 border border-white/[0.05] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-white">Total Goals (O/U 2.5)</h4>
                  <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold">
                    Goals
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { label: "Over 2.5", value: odds.over25, outcome: "Over 2.5", type: 3 },
                    { label: "Under 2.5", value: odds.under25, outcome: "Under 2.5", type: 4 },
                  ].map((o) => (
                    <button
                      key={o.label}
                      onClick={() => handleOpenBet("Over/Under 2.5", o.outcome, o.value, o.type)}
                      disabled={!isUpcoming}
                      title={!isUpcoming ? "Betting is closed — match has started or finished" : ""}
                      className="odds-chip"
                    >
                      <span className="text-[10px] text-gray-500 font-bold">{o.label}</span>
                      <span className="text-base font-extrabold text-purple-400 mt-0.5">{o.value}x</span>
                    </button>
                  ))}
                </div>
                <LiquidityPanel
                  yesAmount={totalGoalPools.yes}
                  noAmount={totalGoalPools.no}
                  yesLabel="OVER"
                  noLabel="UNDER"
                />
              </div>

              {/* BTTS */}
              <div className="glass rounded-2xl p-5 border border-white/[0.05] space-y-4 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-white">Both Teams to Score</h4>
                  <span className="text-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-bold">
                    BTTS
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xs">
                  {[
                    { label: "Yes", value: odds.bttsYes, outcome: "BTTS Yes", type: 5 },
                    { label: "No", value: odds.bttsNo, outcome: "BTTS No", type: 6 },
                  ].map((o) => (
                    <button
                      key={o.label}
                      onClick={() => handleOpenBet("Both Teams to Score", o.outcome, o.value, o.type)}
                      disabled={!isUpcoming}
                      title={!isUpcoming ? "Betting is closed — match has started or finished" : ""}
                      className="odds-chip"
                    >
                      <span className="text-[10px] text-gray-500 font-bold">{o.label}</span>
                      <span className="text-base font-extrabold text-cyan-400 mt-0.5">{o.value}x</span>
                    </button>
                  ))}
                </div>
                <LiquidityPanel
                  yesAmount={bttsPools.yes}
                  noAmount={bttsPools.no}
                  yesLabel="BTTS YES"
                  noLabel="BTTS NO"
                />
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl p-8 text-center text-gray-600 border border-white/[0.04]">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-600" />
              Loading odds from TxLINE...
            </div>
          )}

          {!isUpcoming && (
            <div className="text-xs text-gray-600 text-center py-2">
              Betting is closed — match has started or finished
            </div>
          )}

          {/* TxLINE Live Event Log */}
          <LiveEventLog fixtureId={fixtureId} />
        </div>

        {/* Right: My Bets + Settlement */}
        <div className="space-y-5">
          <h3 className="text-lg font-black text-white">My Position</h3>
          <ComplianceNotice />

          {connected ? (
            onChainBet ? (
              <div className="glass rounded-2xl p-5 border border-white/[0.05] space-y-4">
                <div className="text-[10px] text-gray-600 uppercase font-bold tracking-wider">On-Chain Bet</div>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Prediction</span>
                    <span className="font-bold text-white">
                      {onChainBet.prediction ? "YES / HOME" : "NO / AWAY"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Locked</span>
                    <span className="font-bold text-green-400">
                      {(onChainBet.amount.toNumber() / 1_000_000).toFixed(2)} USDC
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-white/[0.04] pt-2.5">
                    <span className="text-gray-500">Status</span>
                    <span className={`font-bold text-xs uppercase tracking-wider ${onChainBet.isClaimed ? "text-gray-500" : "text-green-400"}`}>
                      {onChainBet.isClaimed ? "Claimed" : "Active"}
                    </span>
                  </div>
                </div>
                {isFinished && !onChainBet.isClaimed && (
                  <button
                    onClick={handleClaim}
                    disabled={claimLoading}
                    className="w-full btn-primary py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                  >
                    {claimLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {claimLoading ? "Claiming..." : "🎉 Claim Winnings"}
                  </button>
                )}
              </div>
            ) : (
              <div className="glass rounded-2xl p-5 text-center text-xs text-gray-600 border border-white/[0.04]">
                No active bets on this match
              </div>
            )
          ) : (
            <div className="glass rounded-2xl p-5 text-center border border-white/[0.04]">
              <div className="text-2xl mb-2">👛</div>
              <div className="text-xs text-gray-500">Connect wallet to view your bets</div>
            </div>
          )}

          {/* Settlement panel */}
          {isFinished && (
            <SettlementPanel
              fixtureId={fixtureId}
              marketPda={primaryMarketPda}
              isSettled={marketSettledState}
            />
          )}

          {isFinished && (
            <Link
              href={`/receipt/${settledTxSig || "demo"}`}
              className="glass rounded-2xl p-4 border border-green-500/15 flex items-center gap-3 hover:border-green-500/30 transition-colors"
            >
              <FileCheck className="w-5 h-5 text-green-400" />
              <div>
                <div className="text-sm font-bold text-white">Proof Receipt Archive</div>
                <div className="text-[11px] text-gray-500">Open the permanent settlement receipt</div>
              </div>
            </Link>
          )}

          <KeeperPanel
            gamePhase={fixture.gamePhase}
            isSettled={demoSettled}
            onTriggerSettle={handleSimulatedSettle}
          />

          <TechnicalPanel
            fixtureId={fixtureId}
            marketPda={primaryMarketPda.toBase58()}
            vaultPda={primaryVaultPda.toBase58()}
            settledTxSig={settledTxSig}
          />

          {/* TxLINE Integration info */}
          <div className="glass rounded-2xl p-4 border border-white/[0.04] space-y-3">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Verification</div>
            <div className="text-xs text-gray-400 leading-relaxed">
              Settlement uses TxLINE's cryptographic Merkle proofs. The result is verified by an on-chain CPI call — no centralized oracle.
            </div>
            <div className="flex items-center gap-2 text-[10px] text-green-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Program: 7Ao2A1…gXm8
            </div>
          </div>
        </div>
      </div>

      {betModalOpen && (
        <BetModal
          isOpen={betModalOpen}
          onClose={() => setBetModalOpen(false)}
          fixtureId={fixtureId}
          marketType={selectedMarket}
          marketTypeByte={marketTypeByte}
          outcome={selectedOutcome}
          odds={selectedOdds}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
