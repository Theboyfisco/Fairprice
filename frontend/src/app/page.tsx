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

      {/* Hero Section */}
      <div className="relative py-16 sm:py-24 overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-20 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl animate-fade-in-up">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 glass-sm border border-white/[0.06] rounded-full px-3 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-widest">
              TxLINE × Solana · Superteams 2026
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            Predict the{" "}
            <span className="gradient-text">World Cup.</span>
            <br />
            Settle on{" "}
            <span className="text-white">Solana.</span>
          </h1>

          <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-2xl mb-8">
            A trustless prediction market powered by{" "}
            <span className="text-green-400 font-semibold">TxLINE's real-time data streams</span> and
            cryptographic Merkle proofs anchored on-chain. No centralized oracles. No trust required.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3 mb-10">
            <Link
              href={fixtures.length > 0 ? `/match/${fixtures[0]?.fixtureId}` : "#matches"}
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm"
            >
              <Zap className="w-4 h-4" />
              Place a Bet
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="btn-ghost inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm"
            >
              How It Works
            </a>
          </div>

          {/* Stats strip */}
          <div className="flex flex-wrap gap-4">
            {[
              { label: "Live Matches", value: liveCount, color: "text-red-400", dot: "bg-red-400" },
              { label: "Total Fixtures", value: fixtures.length, color: "text-white", dot: "bg-green-400" },
              { label: "Active Markets", value: fixtures.length * 3, color: "text-purple-400", dot: "bg-purple-400" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass-sm rounded-2xl px-5 py-3 flex items-center gap-3 border border-white/[0.05]"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${stat.dot} ${stat.value > 0 && stat.dot === "bg-red-400" ? "animate-pulse" : ""}`} />
                <div>
                  <div className={`text-2xl font-black ${stat.color}`}>
                    <AnimatedNumber value={stat.value} />
                  </div>
                  <div className="text-[10px] text-gray-600 uppercase tracking-wider font-bold">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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

              <div className="flex items-center gap-2">
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
