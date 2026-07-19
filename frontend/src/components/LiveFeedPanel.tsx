"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, ChevronRight, Wifi, WifiOff, X } from "lucide-react";
import { useSSEStream } from "@/hooks/useSSEStream";

interface FeedEvent {
  id: string;
  fixtureId?: number;
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  gamePhase?: string;
  type: "score" | "phase" | "connect" | "heartbeat";
  timestamp: Date;
  raw?: string;
}

interface LiveFeedPanelProps {
  compact?: boolean;
}

export default function LiveFeedPanel({ compact = false }: LiveFeedPanelProps) {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const { connected, lastEvent } = useSSEStream();
  const [collapsed, setCollapsed] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (connected && events.length === 0) {
      setEvents((prev) => [
        {
          id: `connect-${Date.now()}`,
          type: "connect",
          timestamp: new Date(),
        },
        ...prev.slice(0, 49),
      ]);
    }
  }, [connected, events.length]);

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.parsed) {
      const data = lastEvent.parsed;

      // Handle the server-side "connected" control event
      if (data.type === "connected") {
        setEvents((prev) => [
          {
            id: `connect-${Date.now()}`,
            type: "connect",
            timestamp: new Date(),
            raw: data.source === "txline-live" ? "txline-live" : "demo",
          },
          ...prev.slice(0, 49),
        ]);
        return;
      }

      const newEvent: FeedEvent = {
        id: `${Date.now()}-${Math.random()}`,
        fixtureId: data.fixtureId,
        homeTeam: data.homeTeam,
        awayTeam: data.awayTeam,
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        gamePhase: data.gamePhase,
        type: data.gamePhase ? "phase" : "score",
        timestamp: new Date(),
        raw: lastEvent.raw,
      };
      if (data.homeScore !== undefined || data.awayScore !== undefined) {
        newEvent.type = "score";
      }
      setEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
    } else {
      // heartbeat or non-JSON (SSE comment lines like `: txline-keepalive`)
      if (lastEvent.raw && !lastEvent.raw.startsWith("{")) {
        // Skip SSE comment keepalive lines silently — don't pollute the feed
        if (lastEvent.raw.startsWith(":")) return;
        setEvents((prev) => [
          {
            id: `hb-${Date.now()}`,
            type: "heartbeat",
            timestamp: new Date(),
            raw: lastEvent.raw,
          },
          ...prev.slice(0, 49),
        ]);
      }
    }
  }, [lastEvent]);

  // Auto-scroll
  useEffect(() => {
    if (logRef.current && !collapsed) {
      logRef.current.scrollTop = 0;
    }
  }, [events, collapsed]);

  const getEventIcon = (event: FeedEvent) => {
    switch (event.type) {
      case "score":
        return "⚽";
      case "phase":
        return "📡";
      case "connect":
        return "🔗";
      case "heartbeat":
        return "💓";
      default:
        return "📊";
    }
  };

  const getEventColor = (event: FeedEvent) => {
    switch (event.type) {
      case "score":
        return "text-green-400";
      case "phase":
        return "text-cyan-400";
      case "connect":
        return "text-purple-400";
      case "heartbeat":
        return "text-gray-500";
      default:
        return "text-gray-400";
    }
  };

  const getEventText = (event: FeedEvent) => {
    switch (event.type) {
      case "score":
        return `${event.homeTeam ?? `Fixture #${event.fixtureId}`} ${event.homeScore ?? "?"} – ${event.awayScore ?? "?"} ${event.awayTeam ?? ""}`;
      case "phase":
        return `Fixture #${event.fixtureId}: Phase → ${event.gamePhase}`;
      case "connect":
        return event.raw === "txline-live"
          ? "✅ Connected to TxLINE Live Stream"
          : "Connected to SSE stream (demo mode)";
      case "heartbeat":
        return `Heartbeat: ${event.raw?.slice(0, 30) ?? "ping"}`;
      default:
        return event.raw?.slice(0, 40) ?? "Event";
    }
  };

  const timeStr = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

  if (compact) {
    return (
      <div className="glass rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
            <Activity className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">TxLINE Live Feed</span>
          </div>
          <span className="text-[10px] text-gray-600">{events.length} events</span>
        </div>
        <div className="p-2 space-y-1 max-h-40 overflow-y-auto" ref={logRef}>
          {events.length === 0 ? (
            <div className="text-center py-4 text-[11px] text-gray-600">
              {connected ? "Waiting for events..." : "Connecting..."}
            </div>
          ) : (
            events.slice(0, 8).map((ev, i) => (
              <div
                key={ev.id}
                className={`flex items-center gap-2 px-2 py-1 rounded-lg ${i === 0 ? "feed-item-enter" : ""} ${
                  ev.type === "heartbeat" ? "opacity-40" : ""
                }`}
              >
                <span className="text-[11px]">{getEventIcon(ev)}</span>
                <span className={`text-[10px] font-mono flex-1 truncate ${getEventColor(ev)}`}>
                  {getEventText(ev)}
                </span>
                <span className="text-[9px] text-gray-600 font-mono shrink-0">{timeStr(ev.timestamp)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl border border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-white/[0.015]">
        <div className="flex items-center gap-2.5">
          <div className={`live-dot ${connected ? "" : "live-dot-red"}`} />
          <Activity className="w-4 h-4 text-gray-300" />
          <span className="text-sm font-bold text-white">TxLINE Live Feed</span>
          {connected ? (
            <Wifi className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-red-400" />
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-gray-500 font-mono">{events.length} events</span>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-90"}`} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div
          ref={logRef}
          className="divide-y divide-white/[0.03] max-h-72 overflow-y-auto"
        >
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-gray-700 border-t-green-400 animate-spin" />
              <span className="text-xs text-gray-500">
                {connected ? "Awaiting TxLINE events..." : "Connecting to SSE stream..."}
              </span>
            </div>
          ) : (
            events.map((ev, i) => (
              <div
                key={ev.id}
                className={`flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.02] transition-colors ${
                  i === 0 ? "feed-item-enter" : ""
                } ${ev.type === "heartbeat" ? "opacity-35" : ""}`}
              >
                <span className="text-base shrink-0">{getEventIcon(ev)}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium truncate ${getEventColor(ev)}`}>
                    {getEventText(ev)}
                  </div>
                  {ev.fixtureId && ev.type === "score" && (
                    <div className="text-[10px] text-gray-600 font-mono mt-0.5">
                      fixture_id: {ev.fixtureId} · phase: {ev.gamePhase ?? "?"}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[10px] text-gray-600 font-mono">{timeStr(ev.timestamp)}</span>
                  {ev.type !== "connect" && ev.type !== "heartbeat" && (
                    <span className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${getEventColor(ev)}`}>
                      {ev.type}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
