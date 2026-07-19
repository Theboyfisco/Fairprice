import { NextResponse } from "next/server";
import https from "https";

export const dynamic = "force-dynamic";

// Map TxLINE CompetitionId to competition names
const COMPETITION_NAMES: Record<number, string> = {
  72: "FIFA World Cup 2026",
  430: "Friendlies",
};

let hasLoggedFixtureFallback = false;

// Fallback mock data with demo fixtures for the judge demo
const MOCK_FIXTURES = [
  {
    fixtureId: 18257739,
    homeTeam: "Spain",
    awayTeam: "Argentina",
    homeScore: 0,
    awayScore: 0,
    gamePhase: "NS" as const,
    competition: "FIFA World Cup 2026",
    competitionId: 72,
    kickoff: new Date(1784487600000).toISOString(), // Real StartTime from TxLINE
  },
  {
    fixtureId: 18172379,
    homeTeam: "USA",
    awayTeam: "Mexico",
    homeScore: 2,
    awayScore: 1,
    gamePhase: "LIVE" as const,
    competition: "FIFA World Cup 2026",
    competitionId: 72,
    kickoff: "2026-07-09T15:15:00.000Z",
  },
  {
    fixtureId: 18143851,
    homeTeam: "Brazil",
    awayTeam: "Germany",
    homeScore: 0,
    awayScore: 0,
    gamePhase: "NS" as const,
    competition: "FIFA World Cup 2026",
    competitionId: 72,
    kickoff: "2026-07-09T18:00:00.000Z",
  },
  {
    fixtureId: 18143852,
    homeTeam: "France",
    awayTeam: "Argentina",
    homeScore: 3,
    awayScore: 2,
    gamePhase: "FT" as const,
    competition: "FIFA World Cup 2026",
    competitionId: 72,
    kickoff: "2026-07-09T13:00:00.000Z",
  },
  {
    fixtureId: 18143853,
    homeTeam: "England",
    awayTeam: "Japan",
    homeScore: 1,
    awayScore: 1,
    gamePhase: "HT" as const,
    competition: "FIFA World Cup 2026",
    competitionId: 72,
    kickoff: "2026-07-09T15:00:00.000Z",
  },
];

type FixtureShape = {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  gamePhase: string;
  competition: string;
  competitionId: number;
  kickoff: string;
  [key: string]: any;
};

function normalizeGamePhase(gameState: number | null | undefined, rawPhase: string | null | undefined): string {
  // GameState: 1 = NS/upcoming, 2 = 1H, 3 = HT, 4 = 2H, 5 = FT, 6 = ET, 7 = Pen
  if (rawPhase) return rawPhase;
  if (gameState === 1) return "NS";
  if (gameState === 2) return "LIVE";
  if (gameState === 3) return "HT";
  if (gameState === 4) return "LIVE";
  if (gameState === 5) return "FT";
  if (gameState === 6) return "ET";
  if (gameState === 7) return "PEN";
  return "NS";
}

function mergeDemoFixtures(liveFixtures: FixtureShape[]) {
  const byId = new Map<number, FixtureShape>();

  // Add curated demo fixtures first (lowest priority)
  for (const fixture of MOCK_FIXTURES) {
    byId.set(fixture.fixtureId, fixture);
  }
  // Overwrite with real data (highest priority)
  for (const fixture of liveFixtures) {
    byId.set(fixture.fixtureId, fixture);
  }

  const merged = Array.from(byId.values());
  merged.sort((a, b) => {
    const liveWeight = (g: string) =>
      g === "LIVE" || g === "1H" || g === "2H" || g === "HT" ? 0 : g === "FT" ? 2 : 1;
    if (liveWeight(a.gamePhase) !== liveWeight(b.gamePhase)) {
      return liveWeight(a.gamePhase) - liveWeight(b.gamePhase);
    }
    return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
  });

  return merged;
}

async function fetchFixturesFromTxLine(jwt: string, apiToken: string): Promise<FixtureShape[]> {
  return new Promise((resolve, reject) => {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const req = https.request(
      {
        hostname: "txline-dev.txodds.com",
        path: "/api/fixtures/snapshot",
        method: "GET",
        agent,
        headers: {
          Authorization: `Bearer ${jwt}`,
          "X-Api-Token": apiToken,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`TxLINE fixtures returned ${res.statusCode}`));
            return;
          }
          try {
            const raw: any[] = JSON.parse(data);

            // Include World Cup (72) and anything with a GameState (active fixtures)
            const relevant = raw.filter(
              (f) => f.CompetitionId === 72 || f.GameState !== undefined
            );
            const useAll = relevant.length === 0 ? raw : relevant;

            const normalized: FixtureShape[] = useAll.map((item: any) => ({
              fixtureId: item.FixtureId,
              homeTeam: item.Participant1,
              awayTeam: item.Participant2,
              homeTeamId: item.Participant1Id,
              awayTeamId: item.Participant2Id,
              homeScore: item.HomeScore ?? item.Score1 ?? 0,
              awayScore: item.AwayScore ?? item.Score2 ?? 0,
              gamePhase: normalizeGamePhase(item.GameState, item.GamePhase || item.Status),
              competition: COMPETITION_NAMES[item.CompetitionId] || item.Competition || "World Cup",
              competitionId: item.CompetitionId,
              fixtureGroupId: item.FixtureGroupId,
              kickoff: item.StartTime
                ? new Date(item.StartTime).toISOString()
                : new Date().toISOString(),
              dataTs: item.Ts,
            }));

            resolve(normalized);
          } catch {
            reject(new Error("Failed to parse fixtures JSON"));
          }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error("TxLINE fixtures timeout"));
    });
    req.end();
  });
}

export async function GET() {
  const jwt = process.env.TXLINE_JWT;
  const apiToken = process.env.TXLINE_API_TOKEN;

  if (!jwt || !apiToken) {
    console.log("No TxLINE credentials. Returning mock fixtures.");
    return NextResponse.json(mergeDemoFixtures([]));
  }

  try {
    const normalized = await fetchFixturesFromTxLine(jwt, apiToken);
    return NextResponse.json(mergeDemoFixtures(normalized));
  } catch (err) {
    if (!hasLoggedFixtureFallback) {
      console.info(
        "TxLINE fixtures unavailable; using curated demo fixtures.",
        err instanceof Error ? err.message : err
      );
      hasLoggedFixtureFallback = true;
    }
    return NextResponse.json(mergeDemoFixtures([]));
  }
}
