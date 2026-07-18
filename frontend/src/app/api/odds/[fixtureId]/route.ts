import { NextRequest, NextResponse } from "next/server";
import { txlineClient, withAuth } from "@/lib/txline-client";

export const dynamic = "force-dynamic";

// Mock odds provider
const MOCK_ODDS: { [key: number]: any } = {
  18172379: { homeWin: 1.92, draw: 3.5, awayWin: 3.8, over25: 1.68, under25: 2.18, bttsYes: 1.72, bttsNo: 2.06 },
  18143851: { homeWin: 2.35, draw: 3.25, awayWin: 2.72, over25: 1.82, under25: 1.96, bttsYes: 1.66, bttsNo: 2.12 },
  18143852: { homeWin: 1.74, draw: 3.65, awayWin: 4.1, over25: 1.58, under25: 2.32, bttsYes: 1.61, bttsNo: 2.22 },
  18143853: { homeWin: 2.08, draw: 3.18, awayWin: 3.3, over25: 1.94, under25: 1.84, bttsYes: 1.79, bttsNo: 1.96 },
  17952170: { homeWin: 2.2, draw: 3.4, awayWin: 2.8, over25: 1.75, under25: 2.05, bttsYes: 1.65, bttsNo: 2.15 },
  17952171: { homeWin: 1.8, draw: 3.6, awayWin: 3.9, over25: 1.9, under25: 1.85, bttsYes: 1.75, bttsNo: 1.95 },
  17952172: { homeWin: 2.5, draw: 3.1, awayWin: 2.6, over25: 2.1, under25: 1.7, bttsYes: 1.8, bttsNo: 1.9 },
  17952173: { homeWin: 2.15, draw: 3.2, awayWin: 3.1, over25: 1.95, under25: 1.8, bttsYes: 1.7, bttsNo: 2.0 },
  17952174: { homeWin: 2.4, draw: 3.25, awayWin: 2.7, over25: 2.05, under25: 1.72, bttsYes: 1.72, bttsNo: 1.98 },
  17952175: { homeWin: 2.9, draw: 3.3, awayWin: 2.25, over25: 1.85, under25: 1.9, bttsYes: 1.68, bttsNo: 2.08 },
};

const DEFAULT_ODDS = { homeWin: 2.1, draw: 3.2, awayWin: 2.9, over25: 1.8, under25: 2.0, bttsYes: 1.7, bttsNo: 2.0 };

let hasLoggedOddsFallback = false;

export async function GET(
  request: NextRequest,
  { params }: { params: { fixtureId: string } }
) {
  const fixtureId = Number(params.fixtureId);
  const jwt = process.env.TXLINE_JWT;
  const apiToken = process.env.TXLINE_API_TOKEN;

  if (!jwt || !apiToken) {
    console.log(`No credentials. Returning mock odds for fixture ${fixtureId}`);
    return NextResponse.json(MOCK_ODDS[fixtureId] || DEFAULT_ODDS);
  }

  try {
    const res = await txlineClient.get(`/odds/snapshot/${fixtureId}`, withAuth(jwt, apiToken));
    const data = res.data;
    
    // Normalize data if it has a different shape
    const normalized = {
      homeWin: data.homeWin || data.home || 2.1,
      draw: data.draw || 3.2,
      awayWin: data.awayWin || data.away || 2.9,
      over25: data.over25 || data.over || 1.8,
      under25: data.under25 || data.under || 2.0,
      bttsYes: data.bttsYes || 1.7,
      bttsNo: data.bttsNo || 2.0,
    };

    return NextResponse.json(normalized);
  } catch (err) {
    if (!hasLoggedOddsFallback) {
      console.info("TxLINE odds unavailable; using demo odds.", err instanceof Error ? err.message : err);
      hasLoggedOddsFallback = true;
    }
    return NextResponse.json(MOCK_ODDS[fixtureId] || DEFAULT_ODDS);
  }
}
