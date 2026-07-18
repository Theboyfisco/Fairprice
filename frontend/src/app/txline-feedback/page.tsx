import { Metadata } from "next";

export const metadata: Metadata = {
  title: "TxLINE Integration Feedback | GoalLine",
  description: "GoalLine integration feedback and notes on the TxLINE API for the Colosseum hackathon.",
};

const ENDPOINTS = [
  ["Fixtures", "GET /api/fixtures/snapshot", "Seeds the match dashboard and demo mode."],
  ["Scores", "SSE /api/scores/stream", "Powers score ticker, match cards, and keeper simulation."],
  ["Odds", "GET /api/odds/snapshot/{fixtureId}", "Normalizes market prices for 1X2, totals, and BTTS."],
  ["Validation", "GET /api/scores/stat-validation", "Returns Merkle proof payload for settlement CPI."],
];

export default function TxlineFeedbackPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-green-400 mb-2">Submission Addendum</div>
        <h1 className="text-4xl font-black text-white">TxLINE Integration Feedback</h1>
        <p className="text-gray-500 mt-3 max-w-2xl">
          GoalLine uses TxLINE as the primary data layer for live scores, odds snapshots, and verifiable stat proofs. This page gives judges the exact integration map and product feedback requested by the track.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ENDPOINTS.map(([label, endpoint, usage]) => (
          <div key={endpoint} className="glass rounded-2xl p-5 border border-white/[0.05]">
            <div className="text-xs font-bold text-green-400">{label}</div>
            <div className="font-mono text-[11px] text-gray-300 mt-2">{endpoint}</div>
            <p className="text-sm text-gray-500 mt-3">{usage}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 border border-green-500/10">
          <h2 className="text-sm font-black text-white">What Worked</h2>
          <p className="text-sm text-gray-500 mt-2">
            The normalized sports schema made it straightforward to build one UI across fixtures, score states, and odds markets.
          </p>
        </div>
        <div className="glass rounded-2xl p-5 border border-amber-500/10">
          <h2 className="text-sm font-black text-white">Friction</h2>
          <p className="text-sm text-gray-500 mt-2">
            Validation payload examples and complete CPI argument mappings would make on-chain settlement faster for teams.
          </p>
        </div>
        <div className="glass rounded-2xl p-5 border border-cyan-500/10">
          <h2 className="text-sm font-black text-white">Suggested Upgrade</h2>
          <p className="text-sm text-gray-500 mt-2">
            A signed sample fixture with proofs, roots, and expected validate_stat return values would be ideal for integration tests.
          </p>
        </div>
      </div>
    </div>
  );
}
