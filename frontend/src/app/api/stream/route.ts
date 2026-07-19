import { NextRequest } from "next/server";
import https from "https";

export const dynamic = "force-dynamic";

const MOCK_EVENTS = [
  { fixtureId: 18257739, homeTeam: "Spain", awayTeam: "Argentina", homeScore: 1, awayScore: 0, gamePhase: "LIVE" },
  { fixtureId: 18172379, homeTeam: "USA", awayTeam: "Mexico", homeScore: 2, awayScore: 1, gamePhase: "LIVE" },
  { fixtureId: 18143852, homeTeam: "France", awayTeam: "Argentina", homeScore: 3, awayScore: 2, gamePhase: "FT" },
];

let hasLoggedStreamFallback = false;

function createDemoEventStream(signal: AbortSignal) {
  let idx = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      const send = () => {
        const event = {
          ...MOCK_EVENTS[idx % MOCK_EVENTS.length],
          ts: Date.now(),
          source: "demo-fallback",
        };
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          if (timer) clearInterval(timer);
          return;
        }
        idx += 1;
      };

      send();
      timer = setInterval(send, 2500);

      signal.addEventListener("abort", () => {
        if (timer) { clearInterval(timer); timer = null; }
        try { controller.close(); } catch { /* already closed */ }
      });
    },
    cancel() {
      if (timer) { clearInterval(timer); timer = null; }
    },
  });
}

export async function GET(request: NextRequest) {
  const jwt = process.env.TXLINE_JWT;
  const apiToken = process.env.TXLINE_API_TOKEN;

  if (!jwt || !apiToken) {
    return new Response(createDemoEventStream(request.signal), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  // Use Node's https module directly to avoid undici SSL issues.
  // This allows rejectUnauthorized: false and avoids the undici
  // issue where NODE_TLS_REJECT_UNAUTHORIZED has no effect.
  const responseStream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const safeEnqueue = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // Controller closed
        }
      };

      const safeClose = () => {
        try { controller.close(); } catch { /* already closed */ }
      };

      const agent = new https.Agent({ rejectUnauthorized: false });

      const req = https.request(
        {
          hostname: "txline-dev.txodds.com",
          path: "/api/scores/stream",
          method: "GET",
          agent,
          headers: {
            Authorization: `Bearer ${jwt}`,
            "X-Api-Token": apiToken,
            Accept: "text/event-stream",
            "Cache-Control": "no-cache",
          },
        },
        (res) => {
          if (res.statusCode !== 200) {
            if (!hasLoggedStreamFallback) {
              console.info(`TxLINE stream returned ${res.statusCode}; falling back to demo.`);
              hasLoggedStreamFallback = true;
            }
            req.destroy();
            // Start demo fallback
            let idx = 0;
            const sendFallback = () => {
              if (request.signal.aborted) return;
              const event = { ...MOCK_EVENTS[idx % MOCK_EVENTS.length], ts: Date.now(), source: "demo-fallback" };
              safeEnqueue(`data: ${JSON.stringify(event)}\n\n`);
              idx++;
            };
            sendFallback();
            const timer = setInterval(() => {
              if (request.signal.aborted) { clearInterval(timer); safeClose(); return; }
              sendFallback();
            }, 2500);
            request.signal.addEventListener("abort", () => { clearInterval(timer); safeClose(); });
            return;
          }

          // ✅ Successfully proxying TxLINE live stream.
          // Send an immediate connect event so the browser UI knows we're live.
          const connectPayload = JSON.stringify({
            type: "connected",
            source: "txline-live",
            ts: Date.now(),
            message: "Connected to TxLINE SSE stream",
          });
          safeEnqueue(`data: ${connectPayload}\n\n`);

          // Send a heartbeat comment every 25s to keep proxies/browsers alive.
          let heartbeatTimer: ReturnType<typeof setInterval> | null = setInterval(() => {
            if (request.signal.aborted) {
              if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
              return;
            }
            safeEnqueue(": txline-keepalive\n\n");
          }, 25000);
          request.signal.addEventListener("abort", () => {
            if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
          });

          // Proxy the live TxLINE SSE stream.
          // Buffer partial SSE lines across chunks.
          let buffer = "";
          res.on("data", (chunk: Buffer) => {
            if (request.signal.aborted) { req.destroy(); return; }

            buffer += chunk.toString();

            // SSE events are delimited by double newlines.
            // Forward complete events immediately; hold partial lines in buffer.
            const parts = buffer.split("\n\n");
            buffer = parts.pop() ?? ""; // keep last (possibly incomplete) part

            for (const part of parts) {
              if (part.trim()) {
                // Re-emit as a proper SSE event
                safeEnqueue(part + "\n\n");
              }
            }
          });

          res.on("end", () => {
            if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
            if (buffer.trim()) safeEnqueue(buffer + "\n\n");
            safeClose();
          });

          res.on("error", () => {
            if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
            safeClose();
          });
        }
      );

      req.on("error", (err) => {
        if (!hasLoggedStreamFallback) {
          console.info("TxLINE stream connection error; using demo SSE stream.", err.message);
          hasLoggedStreamFallback = true;
        }
        // Fall back to demo on error
        let idx = 0;
        const sendFallback = () => {
          if (request.signal.aborted) return;
          const event = { ...MOCK_EVENTS[idx % MOCK_EVENTS.length], ts: Date.now(), source: "demo-fallback" };
          safeEnqueue(`data: ${JSON.stringify(event)}\n\n`);
          idx++;
        };
        sendFallback();
        const timer = setInterval(() => {
          if (request.signal.aborted) { clearInterval(timer); safeClose(); return; }
          sendFallback();
        }, 2500);
        request.signal.addEventListener("abort", () => { clearInterval(timer); safeClose(); });
      });

      // Abort the upstream request when the client disconnects
      request.signal.addEventListener("abort", () => {
        req.destroy();
        safeClose();
      });

      req.end();
    },
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
