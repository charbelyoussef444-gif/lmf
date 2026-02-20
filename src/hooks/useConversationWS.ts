import { useEffect, useRef, useState } from "react";

export type WsMessageData = {
  id: string;
  conversation_id: string;
  sender_user_id?: string | null;
  receiver_user_id?: string | null;
  content_text?: string | null;
  created_at: string; // ISO
};

export type WsEvent =
  | { type: "message-new"; data: WsMessageData }
  | { type: "typing"; userId: string; isTyping: boolean }
  | { type: "read"; userId: string }
  | { type: "presence"; userId: string; state: "joined" | "left" }
  | { type: "pong" };

type Props = {
  apiBase: string;
  cid: string;
  token: string | null | undefined;
  onEvent?: (evt: WsEvent) => void;
};

export function useConversationWS({ apiBase, cid, token, onEvent }: Props) {
  const [status, setStatus] =
    useState<"disconnected" | "connecting" | "connected">("disconnected");

  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<number | null>(null);

  // keep the callback stable for ws.onmessage
  const onEventRef = useRef<typeof onEvent | null>(null);
  useEffect(() => {
    onEventRef.current = onEvent || null;
  }, [onEvent]);

  useEffect(() => {
    if (!cid || !token) return;

    let retry = 0;

    // derive ws base from http api base (or VITE_API_BASE_URL)
    const rawBase = (import.meta.env.VITE_API_BASE_URL || apiBase || "")
      .replace(/\/+$/, "");
    const wsBase = rawBase.replace(
      /^http(s?):\/\//,
      (_m: string, s: string) => `ws${s ? "s" : ""}://`
    );
    const url = `${wsBase}/ws/conversations/${cid}?token=${encodeURIComponent(
      token
    )}`;

    function connect() {
      setStatus("connecting");
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        retry = 0;

        // heartbeat
        pingRef.current = window.setInterval(() => {
          try {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "ping" }));
            }
          } catch {
            /* ignore */
          }
        }, 25000);
      };

      ws.onmessage = (ev) => {
        try {
          const evt = JSON.parse(ev.data) as WsEvent;
          onEventRef.current?.(evt);
        } catch {
          // ignore bad frames
        }
      };

      ws.onclose = () => {
        setStatus("disconnected");
        if (pingRef.current) {
          clearInterval(pingRef.current);
          pingRef.current = null;
        }
        // simple backoff reconnect
        const delay = Math.min(1000 * 2 ** retry, 15000);
        retry += 1;
        window.setTimeout(connect, delay);
      };

      ws.onerror = () => {
        try {
          ws.close();
        } catch {
          /* noop */
        }
      };
    }

    connect();

    return () => {
      if (pingRef.current) {
        clearInterval(pingRef.current);
        pingRef.current = null;
      }
      const s = wsRef.current;
      if (s && s.readyState === WebSocket.OPEN) s.close();
      wsRef.current = null;
    };
  }, [apiBase, cid, token]); // intentionally NOT depending on onEvent

  // ---- safe send helpers
  const safeSend = (payload: unknown) => {
    const s = wsRef.current;
    if (!s || s.readyState !== WebSocket.OPEN) return false;
    try {
      s.send(JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  };

  const sendText = (text: string) =>
    safeSend({ type: "send", text });

  const setTyping = (isTyping: boolean) =>
    safeSend({ type: "typing", isTyping });

  const markRead = () => safeSend({ type: "read" });

  return { status, sendText, setTyping, markRead };
}
