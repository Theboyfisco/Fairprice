import { NextRequest, NextResponse } from "next/server";
import { txlineClient, withAuth } from "@/lib/txline-client";

export const dynamic = "force-dynamic";

// Mock validation data matching TxLINE schemas
const MOCK_VALIDATION = {
  summary: {
    fixtureId: 18143852,
    updateStats: {
      updateCount: 5,
      minTimestamp: 1718841600000, // mock epoch timestamp
      maxTimestamp: 1718845200000,
    },
    eventStatsSubTreeRoot: "47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=", // 32-byte base64
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
    period: 0, // Match result period
  },
  eventStatRoot: "ZEh3OVRWS3A2OGExUXJmdG5jTVNkNkVMWEtEdHBWTU4=",
  statProof: [
    { hash: "U3RhdC1wcm9vZi1ibG9jay0xLTMyLWJ5dGVzLWxlbmd0aA==", isRightSibling: true },
  ],
  predicateThreshold: 0,
};

let hasLoggedValidationFallback = false;

export async function POST(request: NextRequest) {
  const jwt = process.env.TXLINE_JWT;
  const apiToken = process.env.TXLINE_API_TOKEN;

  let body;
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
    const customMock = {
      ...MOCK_VALIDATION,
      summary: {
        ...MOCK_VALIDATION.summary,
        fixtureId,
      },
    };
    return NextResponse.json(customMock);
  }

  try {
    const res = await txlineClient.get(`/scores/stat-validation?fixtureId=${fixtureId}&seq=${seq}&statKey=${statKey}`, withAuth(jwt, apiToken));
    const data = res.data;
    return NextResponse.json(data);
  } catch (err) {
    if (!hasLoggedValidationFallback) {
      console.info("TxLINE validation unavailable; using demo proof.", err instanceof Error ? err.message : err);
      hasLoggedValidationFallback = true;
    }
    const customMock = {
      ...MOCK_VALIDATION,
      summary: {
        ...MOCK_VALIDATION.summary,
        fixtureId,
      },
    };
    return NextResponse.json(customMock);
  }
}
