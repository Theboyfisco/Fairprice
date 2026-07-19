import { NextRequest, NextResponse } from "next/server";
import https from "https";

export const dynamic = "force-dynamic";

// Mock validation data matching TxLINE schemas
const MOCK_VALIDATION = {
  summary: {
    fixtureId: 18143852,
    updateStats: {
      updateCount: 5,
      minTimestamp: 1718841600000,
      maxTimestamp: 1718845200000,
    },
    eventStatsSubTreeRoot: "47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=",
  },
  subTreeProof: [
    { hash: "L2Rldm5ldC1zZWQtcHJvb2YtYmxvY2stMS0zMmJ5dGVz", isRightSibling: true },
    { hash: "R3Vlc3QtYWN0aXZhdGlvbi1wcm9vZi1ibG9jay0yLTMy", isRightSibling: false },
  ],
  mainTreeProof: [
    { hash: "TWFpbi10cmVlLXByb29mLWJsb2NrLTEtMzItYnl0ZXM=", isRightSibling: false },
  ],
  statToProve: {
    key: 1002, // Home Goals
    value: 3,
    period: 0,
  },
  eventStatRoot: "ZEh3OVRWS3A2OGExUXJmdG5jTVNkNkVMWEtEdHBWTU4=",
  statProof: [
    { hash: "U3RhdC1wcm9vZi1ibG9jay0xLTMyLWJ5dGVzLWxlbmd0aA==", isRightSibling: true },
  ],
  predicateThreshold: 0,
};

let hasLoggedValidationFallback = false;

async function fetchValidationFromTxLine(
  fixtureId: number,
  seq: number,
  statKey: number,
  jwt: string,
  apiToken: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const path = `/api/scores/stat-validation?fixtureId=${fixtureId}&seq=${seq}&statKey=${statKey}`;
    const req = https.request(
      {
        hostname: "txline-dev.txodds.com",
        path,
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
              resolve(JSON.parse(data));
            } catch {
              reject(new Error("Failed to parse validation JSON"));
            }
          } else {
            reject(new Error(`TxLINE validation returned ${res.statusCode}: ${data.slice(0, 200)}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error("TxLINE validation timeout"));
    });
    req.end();
  });
}

export async function POST(request: NextRequest) {
  const jwt = process.env.TXLINE_JWT;
  const apiToken = process.env.TXLINE_API_TOKEN;

  let body: any;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const fixtureId = body.fixtureId || 18143852;
  const seq = body.seq || 941;
  const statKey = body.statKey || 1002;

  if (!jwt || !apiToken) {
    console.log("No credentials found. Returning mock proof.");
    return NextResponse.json({ ...MOCK_VALIDATION, summary: { ...MOCK_VALIDATION.summary, fixtureId } });
  }

  try {
    const data = await fetchValidationFromTxLine(fixtureId, seq, statKey, jwt, apiToken);
    return NextResponse.json(data);
  } catch (err) {
    if (!hasLoggedValidationFallback) {
      console.info(
        "TxLINE validation unavailable; using demo proof.",
        err instanceof Error ? err.message : err
      );
      hasLoggedValidationFallback = true;
    }
    return NextResponse.json({ ...MOCK_VALIDATION, summary: { ...MOCK_VALIDATION.summary, fixtureId } });
  }
}
