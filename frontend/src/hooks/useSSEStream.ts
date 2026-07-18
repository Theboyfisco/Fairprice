"use client";

import { useEffect, useState } from "react";

// Global singleton state for SSE
let globalEs: EventSource | null = null;
let subscribers: Set<(event: any) => void> = new Set();
let errorSubscribers: Set<() => void> = new Set();
let connectSubscribers: Set<() => void> = new Set();

let retryTimer: ReturnType<typeof setTimeout>;

function connectGlobalSSE() {
  if (globalEs) return;
  globalEs = new EventSource("/api/stream");

  globalEs.onopen = () => {
    connectSubscribers.forEach((cb) => cb());
  };

  globalEs.onmessage = (e) => {
    try {
      const parsed = JSON.parse(e.data);
      subscribers.forEach((cb) => cb({ parsed, raw: e.data }));
    } catch {
      subscribers.forEach((cb) => cb({ parsed: null, raw: e.data }));
    }
  };

  globalEs.onerror = () => {
    globalEs?.close();
    globalEs = null;
    errorSubscribers.forEach((cb) => cb());
    clearTimeout(retryTimer);
    retryTimer = setTimeout(connectGlobalSSE, 5000);
  };
}

function disconnectGlobalSSE() {
  if (subscribers.size === 0 && errorSubscribers.size === 0 && connectSubscribers.size === 0) {
    globalEs?.close();
    globalEs = null;
    clearTimeout(retryTimer);
  }
}

export function useSSEStream() {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<any>(null);

  useEffect(() => {
    const handleEvent = (data: any) => {
      setConnected(true);
      setLastEvent(data);
    };

    const handleConnect = () => setConnected(true);
    const handleError = () => setConnected(false);

    subscribers.add(handleEvent);
    connectSubscribers.add(handleConnect);
    errorSubscribers.add(handleError);

    connectGlobalSSE();
    if (globalEs?.readyState === EventSource.OPEN) {
      setConnected(true);
    }

    return () => {
      subscribers.delete(handleEvent);
      connectSubscribers.delete(handleConnect);
      errorSubscribers.delete(handleError);
      disconnectGlobalSSE();
    };
  }, []);

  return { connected, lastEvent };
}
