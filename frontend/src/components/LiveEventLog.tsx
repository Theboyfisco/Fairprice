"use client";

import { useEffect, useRef, useState } from "react";
import { useSSEStream } from "@/hooks/useSSEStream";

interface LiveEvent {
  id: string;
  type: "score" | "phase" | "heartbeat";
  homeScore?: number;
  awayScore?: number;
  gamePhase?: string;
  timestamp: Date;
}

interface LiveEventLogProps {
  fixtureId: number;
}

export default function LiveEventLog({ fixtureId }: LiveEventLogProps) {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const { connected, lastEvent } = useSSEStream();
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lastEvent || !lastEvent.parsed) return;

    const data = lastEvent.parsed;
    if (data.fixtureId !== fixtureId) return;

    const isScore = data.homeScore !== undefined || data.awayScore !== undefined;
    const newEvent: LiveEvent = {
      id: `${Date.now()}-${Math.random()}`,
      type: data.gamePhase && !isScore ? "phase" : "score",
      homeScore: data.homeScore,
      awayScore: data.awayScore,
      gamePhase: data.gamePhase,
      timestamp: new Date(),
    };
    setEvents((prev) => [newEvent, ...prev.slice(0, 19)]);
  }, [lastEvent, fixtureId]);

  const iconFor = (ev: LiveEvent) => {
    if (ev.type === "score") return "⚽";
    if (ev.type === "phase") return "📡";
    return "💓";
  };

  const descFor = (ev: LiveEvent) => {
    if (ev.type === "score")
      return `Score update: ${ev.homeScore ?? "?"} – ${ev.awayScore ?? "?"}`;
    if (ev.type === "phase") return `Phase → ${ev.gamePhase}`;
    return "Heartbeat";
  };

  const timeStr = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="glass rounded-2xl border border-white/[0.06] overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.05] bg-white/[0.015]">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${connected ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
          TxLINE Feed · Fixture #{fixtureId}
        </span>
      </div>

      <div ref={logRef} className="max-h-52 overflow-y-auto divide-y divide-white/[0.03]">
        {events.length === 0 ? (
          <div className="py-8 text-center text-[11px] text-gray-600">
            {connected ? `Listening for fixture #${fixtureId} events...` : "Connecting..."}
          </div>
        ) : (
          events.map((ev, i) => (
            <div
              key={ev.id}
              className={`flex items-center gap-3 px-4 py-2 hover:bg-white/[0.02] ${i === 0 ? "feed-item-enter" : ""}`}
            >
              <span className="text-sm">{iconFor(ev)}</span>
              <span className={`flex-1 text-xs ${ev.type === "score" ? "text-green-400" : "text-cyan-400"}`}>
                {descFor(ev)}
              </span>
              <span className="text-[10px] text-gray-600 font-mono shrink-0">{timeStr(ev.timestamp)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
