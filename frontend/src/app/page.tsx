"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import MatchCard, { Fixture } from "@/components/MatchCard";
import LiveFeedPanel from "@/components/LiveFeedPanel";
import { useSSEStream } from "@/hooks/useSSEStream";
import { Loader2, RefreshCw, Zap, Shield, TrendingUp, ArrowRight } from "lucide-react";

// Animated counter component
function AnimatedNumber({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    if (value === 0) return;
    let start = 0;
    const step = Math.ceil(value / 20);
    const timer = setInterval(() => {
      start = Math.min(start + step, value);
      setDisplayed(start);
      if (start >= value) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [value]);
  return <>{displayed}</>;
}

// Scrolling ticker for live fixtures
function LiveTicker({ fixtures }: { fixtures: Fixture[] }) {
  const liveFixtures = fixtures.filter((f) => f.gamePhase === "LIVE" || f.gamePhase === "HT");
  if (liveFixtures.length === 0) return null;

  const items = [...liveFixtures, ...liveFixtures]; // duplicate for seamless loop

  return (
    <div className="overflow-hidden border-y border-white/[0.04] bg-white/[0.015] py-2">
      <div
        className="flex gap-8 whitespace-nowrap"
        style={{
          animation: `marquee ${items.length * 4}s linear infinite`,
        }}
      >
        {items.map((f, i) => (
          <Link
            key={`${f.fixtureId}-${i}`}
            href={`/match/${f.fixtureId}`}
            className="inline-flex items-center gap-2 text-xs font-semibold hover:text-green-400 transition-colors shrink-0"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />
            <span>{f.homeTeam}</span>
            <span className="text-green-400 font-black">
              {f.homeScore} – {f.awayScore}
            </span>
            <span>{f.awayTeam}</span>
            <span className="text-gray-600 text-[10px] border border-white/10 px-1.5 py-0.5 rounded-full">
              {f.gamePhase}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: <Zap className="w-5 h-5" />,
    title: "Pick Your Outcome",
    desc: "Choose a match from the World Cup schedule. Select a market — match result, total goals, or BTTS. Lock in your USDC bet.",
    color: "from-green-500/20 to-cyan-500/20",
    border: "border-green-500/20",
    iconColor: "text-green-400",
  },
  {
    step: "02",
    icon: <TrendingUp className="w-5 h-5" />,
    title: "TxLINE Streams Results",
    desc: "TxLINE broadcasts real-time scores via SSE with cryptographic signatures. Each score update is Merkle-hashed and anchored on Solana.",
    color: "from-cyan-500/20 to-blue-500/20",
    border: "border-cyan-500/20",
    iconColor: "text-cyan-400",
  },
  {
    step: "03",
    icon: <Shield className="w-5 h-5" />,
    title: "Settle Trustlessly",
    desc: "After the match, anyone triggers settlement. Our program CPIs into TxLINE's validate_stat to verify the result on-chain. Winners claim instantly.",
    color: "from-purple-500/20 to-violet-500/20",
    border: "border-purple-500/20",
    iconColor: "text-purple-400",
  },
];

export default function Home() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "LIVE" | "NS" | "FT">("ALL");

  const fetchFixtures = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/fixtures");
      if (!res.ok) throw new Error("Failed to load fixtures");
      const data = await res.json();
      setFixtures(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const { lastEvent } = useSSEStream();

  useEffect(() => {
    fetchFixtures();
  }, []);

  useEffect(() => {
    if (lastEvent?.parsed) {
      const update = lastEvent.parsed;
      if (update?.fixtureId) {
        setFixtures((prev) =>
          prev.map((f) =>
            f.fixtureId === update.fixtureId
              ? {
                  ...f,
                  homeScore: update.homeScore ?? f.homeScore,
                  awayScore: update.awayScore ?? f.awayScore,
                  gamePhase: update.gamePhase ?? f.gamePhase,
                }
              : f
          )
        );
      }
    }
  }, [lastEvent]);

  const filteredFixtures = filter === "ALL"
    ? fixtures
    : fixtures.filter((f) => f.gamePhase === filter);

  const liveCount = fixtures.filter((f) => f.gamePhase === "LIVE").length;

  return (
    <div className="space-y-0">
      {/* Live ticker */}
      <LiveTicker fixtures={fixtures} />

      {/* ═══════════════════════════════════════════════
           HERO — Full-screen drama
      ═══════════════════════════════════════════════ */}
      <div className="relative min-h-[88vh] flex flex-col justify-center overflow-hidden -mx-6 px-6 sm:-mx-12 sm:px-12 lg:-mx-24 lg:px-24">

        {/* ── Aurora background layers ── */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Base dark layer */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#040811] via-[#050a14] to-[#050811]" />

          {/* Aurora blob 1 — green */}
          <div
            className="absolute animate-aurora"
            style={{
              top: '-20%', left: '-10%',
              width: '70%', height: '80%',
              background: 'radial-gradient(ellipse, rgba(0,255,135,0.2) 0%, transparent 65%)',
              filter: 'blur(40px)',
              animationDuration: '12s',
            }}
          />
          {/* Aurora blob 2 — purple */}
          <div
            className="absolute animate-aurora"
            style={{
              top: '10%', right: '-15%',
              width: '65%', height: '75%',
              background: 'radial-gradient(ellipse, rgba(124,58,237,0.22) 0%, transparent 65%)',
              filter: 'blur(40px)',
              animationDuration: '16s',
              animationDelay: '-5s',
            }}
          />
          {/* Aurora blob 3 — cyan accent */}
          <div
            className="absolute animate-aurora"
            style={{
              bottom: '-10%', left: '25%',
              width: '55%', height: '60%',
              background: 'radial-gradient(ellipse, rgba(34,211,238,0.12) 0%, transparent 65%)',
              filter: 'blur(50px)',
              animationDuration: '20s',
              animationDelay: '-8s',
            }}
          />

          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        {/* ── Main hero content ── */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 lg:gap-16 items-center py-20 lg:py-0">

          {/* LEFT — Text content */}
          <div className="space-y-8">

            {/* Badge */}
            <div className="animate-hero-text stagger-1 inline-flex items-center gap-2.5 rounded-full border border-green-500/20 bg-green-500/5 px-4 py-2 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-green-400">
                TxLINE × Solana · World Cup 2026
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-0">
              <h1 className="animate-hero-text stagger-2 text-[clamp(3rem,8vw,7rem)] font-black tracking-[-0.04em] leading-[0.9]">
                <span className="text-white">Predict</span>{' '}
                <br className="hidden sm:block" />
                <span
                  className="inline-block"
                  style={{
                    background: 'linear-gradient(90deg, #00ff87 0%, #22d3ee 45%, #a78bfa 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    backgroundSize: '200% auto',
                    animation: 'gradientShift 4s linear infinite',
                  }}
                >
                  the World Cup.{' '}
                </span>
                <br />
                <span className="text-white">Settle on{' '}</span>
                <span
                  style={{
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.4) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >Solana.</span>
              </h1>
            </div>

            {/* Subheadline */}
            <p className="animate-hero-text stagger-3 text-gray-400 text-lg sm:text-xl leading-relaxed max-w-xl">
              Real-time odds, cryptographic proofs, on-chain settlement.{' '}
              <span className="text-white/80">Powered by TxLINE's live data feed — the same infrastructure used by major betting operators.</span>
            </p>

            {/* CTAs */}
            <div className="animate-hero-text stagger-4 flex flex-wrap gap-3">
              <Link
                href={fixtures.length > 0 ? `/match/${fixtures[0]?.fixtureId}` : '#matches'}
                className="group relative inline-flex items-center gap-2.5 rounded-2xl px-7 py-3.5 text-sm font-bold text-black overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #00ff87, #00d4a8)' }}
              >
                <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Zap className="w-4 h-4" />
                Place a Prediction
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-7 py-3.5 text-sm font-semibold text-gray-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 hover:text-white transition-all"
              >
                See How It Works
              </a>
            </div>

            {/* Stat row */}
            <div className="animate-hero-text stagger-5 grid grid-cols-3 gap-3 max-w-xl pt-2">
              {[
                { label: 'Live Matches', value: liveCount, suffix: '', color: '#ff4444', icon: '🔴' },
                { label: 'Fixtures', value: fixtures.length, suffix: '', color: '#00ff87', icon: '🏟️' },
                { label: 'Markets', value: fixtures.length * 3, suffix: '+', color: '#a78bfa', icon: '📊' },
              ].map((stat) => (
                <div key={stat.label} className="hero-stat-card text-center">
                  <div className="text-2xl sm:text-3xl font-black mb-0.5" style={{ color: stat.color }}>
                    <AnimatedNumber value={stat.value} />{stat.suffix}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Animated pure-CSS soccer orb visualizer */}
          <div className="hidden lg:flex justify-center items-center animate-hero-text stagger-6" style={{ minHeight: 400 }}>
            <div className="relative w-80 h-80 xl:w-96 xl:h-96 flex items-center justify-center">

              {/* Outermost slow orbit ring */}
              <div
                className="absolute inset-0 rounded-full border border-green-500/10 animate-orbit"
                style={{ animationDuration: '20s' }}
              />
              {/* Outer orbit ring */}
              <div
                className="absolute rounded-full border border-purple-500/15 animate-orbit-reverse"
                style={{ inset: '16px', animationDuration: '14s' }}
              />

              {/* Orbiting data dots — green */}
              <div className="absolute inset-0 animate-orbit" style={{ animationDuration: '8s' }}>
                <div
                  className="absolute w-3 h-3 rounded-full bg-green-400 shadow-[0_0_12px_rgba(0,255,135,0.8)]"
                  style={{ top: '0%', left: '50%', transform: 'translate(-50%,-50%)' }}
                />
              </div>
              <div className="absolute animate-orbit-reverse" style={{ inset: '16px', animationDuration: '11s' }}>
                <div
                  className="absolute w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(167,139,250,0.8)]"
                  style={{ bottom: '0%', left: '50%', transform: 'translate(-50%,50%)' }}
                />
              </div>
              <div className="absolute animate-orbit" style={{ inset: '32px', animationDuration: '15s' }}>
                <div
                  className="absolute w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                  style={{ top: '50%', right: '0%', transform: 'translate(50%,-50%)' }}
                />
              </div>

              {/* Inner ring */}
              <div
                className="absolute rounded-full border border-cyan-500/20 animate-orbit"
                style={{ inset: '48px', animationDuration: '10s' }}
              />

              {/* Soccer ball orb — center */}
              <div
                className="relative w-44 h-44 xl:w-52 xl:h-52 rounded-full flex items-center justify-center animate-float"
                style={{ animationDuration: '7s' }}
              >
                {/* Glowing halo */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(0,255,135,0.2) 0%, rgba(124,58,237,0.1) 50%, transparent 75%)',
                    filter: 'blur(20px)',
                    transform: 'scale(1.4)',
                  }}
                />
                {/* Orb surface */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0) 50%), radial-gradient(circle at 65% 70%, rgba(124,58,237,0.15) 0%, rgba(0,0,0,0) 60%), linear-gradient(135deg, #0d1a2e 0%, #081220 100%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 0 60px rgba(0,255,135,0.12), 0 0 120px rgba(124,58,237,0.08), inset 0 1px 1px rgba(255,255,255,0.06)',
                  }}
                />
                {/* Soccer ball emoji or SVG */}
                <span className="relative z-10 text-7xl xl:text-8xl select-none" style={{ filter: 'drop-shadow(0 0 30px rgba(0,255,135,0.4))' }}>
                  ⚽
                </span>
                {/* Scan line */}
                <div
                  className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-400/60 to-transparent animate-scan overflow-hidden rounded-full"
                  style={{ pointerEvents: 'none' }}
                />
              </div>

              {/* Floating data chips */}
              <div className="absolute -top-2 right-4 hero-stat-card px-3 py-2 text-[10px] font-mono text-green-400 animate-float" style={{ animationDelay: '-2s', animationDuration: '8s' }}>
                <div className="flex items-center gap-1.5">
                  <span className="animate-blink w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  <span>SSE LIVE</span>
                </div>
                <div className="text-white/60 mt-0.5">Spain 1–0 ARG</div>
              </div>
              <div className="absolute bottom-0 -left-4 hero-stat-card px-3 py-2 text-[10px] font-mono text-purple-400 animate-float" style={{ animationDelay: '-4s', animationDuration: '10s' }}>
                <div className="text-white/40 text-[9px] uppercase tracking-wider">Merkle Root</div>
                <div className="mt-0.5 font-bold">0x4a2f…c8e1</div>
              </div>
              <div className="absolute top-1/2 -right-6 hero-stat-card px-3 py-2 text-[10px] font-mono text-cyan-400 animate-float" style={{ animationDelay: '-6s', animationDuration: '9s' }}>
                <div className="text-white/40 text-[9px] uppercase tracking-wider">On-chain</div>
                <div className="mt-0.5 font-bold text-green-400">✓ Verified</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom gradient fade into content ── */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050811] to-transparent pointer-events-none" />
      </div>


      {/* How It Works */}
      <div id="how-it-works" className="py-12 border-t border-white/[0.04]">
        <h2 className="text-2xl font-black text-white mb-2">How It Works</h2>
        <p className="text-gray-500 text-sm mb-8">Three steps. Zero trust required.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {HOW_IT_WORKS.map((item, i) => (
            <div
              key={item.step}
              className={`glass rounded-2xl p-6 border ${item.border} animate-fade-in-up stagger-${i + 1} relative overflow-hidden`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-30 pointer-events-none`} />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${item.iconColor}`}>
                    {item.icon}
                  </div>
                  <span className="text-3xl font-black text-white/10">{item.step}</span>
                </div>
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Matches + Live Feed */}
      <div id="matches" className="py-4 border-t border-white/[0.04]">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Match grid — takes 3/4 width on xl */}
          <div className="xl:col-span-3 space-y-6">
            {/* Header with filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  Match Schedule
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-ping inline-block" />
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">Click any match to place a prediction</p>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 sm:pb-0 scrollbar-hide">
                {(["ALL", "LIVE", "NS", "FT"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                      filter === f
                        ? "bg-green-500/15 border border-green-500/30 text-green-400"
                        : "bg-white/5 border border-white/5 text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {f === "LIVE" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse mr-1.5" />}
                    {f}
                    {f !== "ALL" && (
                      <span className="ml-1.5 text-[10px] opacity-70">
                        ({fixtures.filter((x) => x.gamePhase === f).length})
                      </span>
                    )}
                  </button>
                ))}
                <button
                  onClick={fetchFixtures}
                  className="ml-2 btn-ghost p-2 rounded-xl"
                  title="Refresh"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-green-400 animate-spin" />
                <span className="text-gray-500 text-sm">Loading from TxLINE...</span>
              </div>
            ) : error ? (
              <div className="glass rounded-2xl p-8 text-center border border-red-500/15 max-w-md mx-auto space-y-3">
                <div className="text-3xl">⚡</div>
                <div className="text-red-400 font-bold">Failed to connect to TxLINE</div>
                <div className="text-xs text-gray-500">{error}</div>
                <button onClick={fetchFixtures} className="btn-primary px-5 py-2 rounded-xl text-sm">
                  Retry
                </button>
              </div>
            ) : filteredFixtures.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center text-gray-500 border border-white/[0.04]">
                <div className="text-3xl mb-3">🏟️</div>
                <div className="font-bold">No {filter !== "ALL" ? filter : ""} matches found</div>
                <div className="text-xs mt-1">Check back later or change the filter above</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredFixtures.map((fixture, i) => (
                  <MatchCard key={fixture.fixtureId} fixture={fixture} index={i} />
                ))}
              </div>
            )}
          </div>

          {/* Live Feed Sidebar */}
          <div className="xl:col-span-1 space-y-4">
            <div>
              <h2 className="text-sm font-black text-white mb-1">TxLINE Data Feed</h2>
              <p className="text-[11px] text-gray-600">Real-time SSE stream from TxLINE</p>
            </div>
            <LiveFeedPanel />

            {/* TxLINE integration callout */}
            <div className="glass rounded-2xl p-4 border border-green-500/10 space-y-2">
              <div className="text-[11px] font-bold text-green-400 uppercase tracking-wider">
                TxLINE Integration
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "Fixtures", endpoint: "GET /fixtures/snapshot" },
                  { label: "Odds", endpoint: "GET /odds/snapshot/:id" },
                  { label: "Live Scores", endpoint: "SSE /scores/stream" },
                  { label: "Stat Proof", endpoint: "GET /scores/stat-validation" },
                ].map((e) => (
                  <div key={e.label} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-green-500 shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold text-gray-400">{e.label}</div>
                      <div className="text-[9px] text-gray-600 font-mono">{e.endpoint}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
