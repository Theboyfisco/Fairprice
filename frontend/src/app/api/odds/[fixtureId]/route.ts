import { NextRequest, NextResponse } from "next/server";
import https from "https";

export const dynamic = "force-dynamic";

// Mock odds provider — used as fallback for fixtures not in the TxLINE snapshot
const MOCK_ODDS: { [key: number]: any } = {
  18257739: { homeWin: 2.37, draw: 3.20, awayWin: 3.76, over25: 3.63, under25: 1.38, bttsYes: 2.65, bttsNo: 3.23 },
  18172379: { homeWin: 1.92, draw: 3.5, awayWin: 3.8, over25: 1.68, under25: 2.18, bttsYes: 1.72, bttsNo: 2.06 },
  18143851: { homeWin: 2.35, draw: 3.25, awayWin: 2.72, over25: 1.82, under25: 1.96, bttsYes: 1.66, bttsNo: 2.12 },
  18143852: { homeWin: 1.74, draw: 3.65, awayWin: 4.1, over25: 1.58, under25: 2.32, bttsYes: 1.61, bttsNo: 2.22 },
  18143853: { homeWin: 2.08, draw: 3.18, awayWin: 3.3, over25: 1.94, under25: 1.84, bttsYes: 1.79, bttsNo: 1.96 },
  17952170: { homeWin: 2.2, draw: 3.4, awayWin: 2.8, over25: 1.75, under25: 2.05, bttsYes: 1.65, bttsNo: 2.15 },
};

const DEFAULT_ODDS = { homeWin: 2.1, draw: 3.2, awayWin: 2.9, over25: 1.8, under25: 2.0, bttsYes: 1.7, bttsNo: 2.0 };

let hasLoggedOddsFallback = false;

/**
 * Normalize TxLINE real odds array to our frontend schema.
 * TxLINE prices are in millionths (e.g. 3233 = 3.233 decimal).
 */
function normalizeTxLineOdds(data: any[]): any {
  const result: any = { ...DEFAULT_ODDS };

  for (const market of data) {
    const prices = (market.Prices || []).map((p: number) => p / 1000);
    const names: string[] = market.PriceNames || [];
    const type: string = market.SuperOddsType || "";
    const lineParam: string = market.MarketParameters || "";

    if (type === "1X2_PARTICIPANT_RESULT") {
      const p1Idx = names.indexOf("part1");
      const drawIdx = names.indexOf("draw");
      const p2Idx = names.indexOf("part2");
      if (p1Idx >= 0) result.homeWin = parseFloat(prices[p1Idx].toFixed(3));
      if (drawIdx >= 0) result.draw = parseFloat(prices[drawIdx].toFixed(3));
      if (p2Idx >= 0) result.awayWin = parseFloat(prices[p2Idx].toFixed(3));
    }

    if (type === "OVERUNDER_PARTICIPANT_GOALS") {
      // Look for line=2.5 first, then line=3 as fallback
      const line = parseFloat((lineParam.replace("line=", "") || "0"));
      if (line === 2.5 || (!result._foundOU && line === 3)) {
        const overIdx = names.indexOf("over");
        const underIdx = names.indexOf("under");
        if (overIdx >= 0) result.over25 = parseFloat(prices[overIdx].toFixed(3));
        if (underIdx >= 0) result.under25 = parseFloat(prices[underIdx].toFixed(3));
        result._foundOU = line === 2.5;
      }
    }
  }

  // Derive BTTS from 1X2 if not available in data
  // Rule of thumb: bttsYes ~ (homeWin + awayWin) / 3.0, bttsNo = inverse
  if (!result.bttsYes || result.bttsYes === DEFAULT_ODDS.bttsYes) {
    const implied = (1 / result.homeWin + 1 / result.awayWin);
    result.bttsYes = parseFloat(Math.max(1.2, Math.min(3.5, 1.0 / (implied * 0.55))).toFixed(2));
    result.bttsNo = parseFloat(Math.max(1.2, Math.min(3.5, 1.0 / (implied * 0.45))).toFixed(2));
  }

  delete result._foundOU;
  return result;
}

async function fetchOddsFromTxLine(fixtureId: number, jwt: string, apiToken: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const req = https.request(
      {
        hostname: "txline-dev.txodds.com",
        path: `/api/odds/snapshot/${fixtureId}`,
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
          if (res.statusCode === 200) {
            try {
              const parsed = JSON.parse(data);
              // TxLINE returns an array of market objects for real fixtures
              if (Array.isArray(parsed) && parsed.length > 0) {
                resolve(normalizeTxLineOdds(parsed));
              } else if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                // Already normalized (legacy)
                resolve(parsed);
              } else {
                reject(new Error("Empty odds response"));
              }
            } catch {
              reject(new Error("Failed to parse odds JSON"));
            }
          } else {
            reject(new Error(`TxLINE odds returned ${res.statusCode}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error("TxLINE odds timeout"));
    });
    req.end();
  });
}

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
    const normalized = await fetchOddsFromTxLine(fixtureId, jwt, apiToken);
    return NextResponse.json(normalized);
  } catch (err) {
    if (!hasLoggedOddsFallback) {
      console.info(
        "TxLINE odds unavailable; using demo odds.",
        err instanceof Error ? err.message : err
      );
      hasLoggedOddsFallback = true;
    }
    return NextResponse.json(MOCK_ODDS[fixtureId] || DEFAULT_ODDS);
  }
}
