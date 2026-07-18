import { NextResponse } from "next/server";
import { txlineClient, withAuth } from "@/lib/txline-client";

export const dynamic = "force-dynamic";

// Map TxLINE CompetitionId to competition names
const COMPETITION_NAMES: Record<number, string> = {
  72: "FIFA World Cup 2026",
  430: "Friendlies",
};

let hasLoggedFixtureFallback = false;

// Fallback mock data using real fixture IDs from the API
const MOCK_FIXTURES = [
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

function mergeDemoFixtures<T extends { fixtureId: number; kickoff: string; gamePhase: string }>(fixtures: T[]) {
  const byId = new Map<number, T | (typeof MOCK_FIXTURES)[number]>();

  for (const fixture of MOCK_FIXTURES) {
    byId.set(fixture.fixtureId, fixture);
  }
  for (const fixture of fixtures) {
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

export async function GET() {
  const jwt = process.env.TXLINE_JWT;
  const apiToken = process.env.TXLINE_API_TOKEN;

  if (!jwt || !apiToken) {
    console.log("No TxLINE credentials. Returning mock fixtures.");
    return NextResponse.json(mergeDemoFixtures([]));
  }

  try {
    const res = await txlineClient.get("/fixtures/snapshot", withAuth(jwt, apiToken));
    const data: any[] = res.data;

    // Filter to World Cup (CompetitionId=72) and upcoming matches
    const worldCupFixtures = data.filter((f) => f.CompetitionId === 72);
    const allFixtures = worldCupFixtures.length > 0 ? worldCupFixtures : data;

    // Normalize from TxLINE schema to frontend schema
    const normalized = allFixtures.map((item: any) => ({
      fixtureId: item.FixtureId,
      homeTeam: item.Participant1,           // Participant1IsHome is usually true
      awayTeam: item.Participant2,
      homeTeamId: item.Participant1Id,
      awayTeamId: item.Participant2Id,
      homeScore: item.HomeScore ?? item.Score1 ?? 0,
      awayScore: item.AwayScore ?? item.Score2 ?? 0,
      gamePhase: item.GamePhase || item.Status || "NS",
      competition: COMPETITION_NAMES[item.CompetitionId] || item.Competition || "World Cup",
      competitionId: item.CompetitionId,
      fixtureGroupId: item.FixtureGroupId,
      kickoff: item.StartTime
        ? new Date(item.StartTime).toISOString()
        : new Date().toISOString(),
      // Timestamp of data snapshot
      dataTs: item.Ts,
    }));

    // Sort: LIVE first, then by kickoff ascending
    return NextResponse.json(mergeDemoFixtures(normalized));
  } catch (err) {
    if (!hasLoggedFixtureFallback) {
      console.info("TxLINE fixtures unavailable; using curated demo fixtures.", err instanceof Error ? err.message : err);
      hasLoggedFixtureFallback = true;
    }
    return NextResponse.json(mergeDemoFixtures([]));
  }
}
