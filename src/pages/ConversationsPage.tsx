// src/pages/ConversationsPage.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  SendHorizontal,
  Search,
  Loader2,
  Clock,
  MessageSquareHeart,
  ShieldCheck,
  ArrowRight,
  Star,
  Filter,
  Plus,
  MoreVertical,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  api,
  type Conversation,
  type Msg,
  type MatchResponse,
  type MatchStatus,
  type ReportReason,
} from "../lib/api";
import { supabase } from "../lib/supabaseClient";

import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";

// ✅ use the fixed WS hook
import { useConversationWS, type WsEvent } from "../hooks/useConversationWS";

const MATCH_LIMIT = 3;
const PHOTO_UNLOCK_HOURS = 24;
const PHOTO_UNLOCK_MS = PHOTO_UNLOCK_HOURS * 60 * 60 * 1000;

const PHOTO_UNLOCK_NOTE =
  "Photos can unlock only after 24 hours, and only if BOTH users mark the match as satisfied (Yes).";

function fmtTs(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatShortTime(tsSec?: number) {
  if (!tsSec) return "";
  const d = new Date(tsSec * 1000);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/** ---------------- Match popup (dopamine animation) ---------------- */
function useElapsedMs(enabled: boolean, startAt: number | null, tick = 80) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!enabled || !startAt) {
      setElapsed(0);
      return;
    }
    let alive = true;
    const t = setInterval(() => {
      if (!alive) return;
      setElapsed(Date.now() - startAt);
    }, tick);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [enabled, startAt, tick]);

  return elapsed;
}

function seeded(n: number) {
  const x = Math.sin(n * 999.123 + 0.12345) * 10000;
  return x - Math.floor(x);
}

function polarToXY(angleDeg: number, radius: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(a) * radius, y: Math.sin(a) * radius };
}

function MatchFindingModal({
  open,
  startedAt,
}: {
  open: boolean;
  startedAt: number | null;
}) {
  const elapsed = useElapsedMs(open, startedAt, 80);

  const stages = useMemo(
    () => [
      { title: "Curating your match…", sub: "Warming up signals" },
      { title: "Scanning compatibility…", sub: "Personality, interests, intent" },
      { title: "Ranking the best fit…", sub: "Quality-first, not quantity" },
      { title: "Finalizing…", sub: "Creating your conversation thread" },
      { title: "Double-checking…", sub: "One last pass" },
      { title: "Tuning results…", sub: "Reducing noise" },
    ],
    []
  );

  const stageIndex = useMemo(() => {
    const i = Math.floor(elapsed / 700) % stages.length;
    return i;
  }, [elapsed, stages.length]);

  const blobTargets = useMemo(() => {
    const k = stageIndex + 1;
    const a1 = 360 * seeded(k * 1.1);
    const a2 = 360 * seeded(k * 2.2 + 7);
    const a3 = 360 * seeded(k * 3.3 + 13);

    const r1 = 18 + 10 * seeded(k * 4.4);
    const r2 = 18 + 10 * seeded(k * 5.5);
    const r3 = 18 + 10 * seeded(k * 6.6);

    return [polarToXY(a1, r1), polarToXY(a2, r2), polarToXY(a3, r3)];
  }, [stageIndex]);

  const stage = stages[stageIndex];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-4"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-2xl backdrop-blur-xl"
            initial={{ y: 18, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 14, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <div className="pointer-events-none absolute inset-0">
              <motion.div
                className="absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.35),_transparent_60%)] blur-3xl"
                animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,_rgba(244,114,182,0.28),_transparent_60%)] blur-3xl"
                animate={{ scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.22),_transparent_60%)] blur-3xl"
                animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            <div className="relative mt-2 grid place-items-center">
              <div className="relative">
                <motion.div
                  className="absolute inset-[-12px] rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 opacity-70 blur-[10px]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
                />

                <motion.div
                  className="relative grid h-24 w-24 place-items-center rounded-full border border-white/15 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 1.25, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.div
                    className="absolute inset-0"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2.1, repeat: Infinity, ease: "linear" }}
                  >
                    {blobTargets.map((p, i) => (
                      <motion.div
                        key={i}
                        className={
                          i === 0
                            ? "absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full bg-white/90 shadow"
                            : i === 1
                            ? "absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-white/70 shadow"
                            : "absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-white/60 shadow"
                        }
                        initial={false}
                        animate={{ x: p.x, y: p.y }}
                        transition={{
                          type: "spring",
                          stiffness: 140,
                          damping: 18,
                          mass: 0.8,
                        }}
                      />
                    ))}
                  </motion.div>

                  <div className="grid place-items-center">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 opacity-90 shadow-[0_0_30px_rgba(244,114,182,0.22)]" />
                  </div>
                </motion.div>
              </div>

              <div className="mt-5 w-full">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full w-1/3 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500"
                    animate={{ x: ["-40%", "220%"] }}
                    transition={{ duration: 1.05, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </div>
            </div>

            <div className="relative mt-4 text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={stageIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="text-base font-semibold text-white">{stage.title}</div>
                  <div className="mt-1 text-xs text-white/70">{stage.sub}</div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative mt-5 flex items-center justify-between gap-3">
              <div className="text-[11px] text-white/50">This usually takes a few seconds.</div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/80">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MatchBlockers({
  status,
  align = "left",
}: {
  status: MatchStatus | null;
  align?: "left" | "center";
}) {
  if (!status) return null;

  const checks = (status as any).checks as
    | {
        verified: boolean;
        assessment_completed: boolean;
        has_interest: boolean;
        has_photos: boolean;
        photos_count?: number;
        not_banned: boolean;
      }
    | undefined;

  const missing = ((status as any).missing ?? []) as string[];
  const reason = (status as any).reason ?? null;

  const issues: string[] = [];

  if (checks) {
    if (!checks.not_banned) issues.push("Your account is banned.");
    if (!checks.verified) issues.push("Your account is not verified.");
    if (!checks.assessment_completed) issues.push("Your compatibility assessment is not complete.");
    if (!checks.has_interest) issues.push("Add at least 1 interest to your profile.");
    if (!checks.has_photos) {
      const n = checks.photos_count ?? 0;
      issues.push(`Upload at least 3 gallery photos. (${n}/3)`);
    }
  } else {
    if (missing.length) issues.push(...missing);
    else if (reason) issues.push(reason);
  }

  const show = issues.length > 0 || (!!reason && !status.eligible);
  if (!show) return null;

  const alignClasses = align === "center" ? "items-center text-center" : "items-start text-left";
  const buttonsJustify = align === "center" ? "justify-center" : "";

  const needsProfile = checks
    ? !checks.not_banned || !checks.verified || !checks.has_interest || !checks.has_photos
    : issues.some((x) => {
        const s = x.toLowerCase();
        return s.includes("interest") || s.includes("photo") || s.includes("verified") || s.includes("banned");
      });

  const needsAssessment = checks
    ? !checks.assessment_completed
    : issues.some((x) => x.toLowerCase().includes("assessment"));

  return (
    <div
      className={`mt-1 flex flex-col gap-1 rounded-xl bg-rose-50/70 p-2.5 text-[11px] text-rose-700 dark:bg-rose-950/40 dark:text-rose-200 ${alignClasses}`}
    >
      {issues.length > 0 && (
        <ul className="list-disc pl-4 marker:text-rose-400 dark:marker:text-rose-300">
          {issues.map((txt, i) => (
            <li key={i}>{txt}</li>
          ))}
        </ul>
      )}

      {(needsProfile || needsAssessment) && (
        <div className={`mt-1 flex flex-wrap gap-2 ${buttonsJustify}`}>
          {(needsProfile || needsAssessment) && (
            <Link
              to="/profile"
              className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-white/80 px-2.5 py-0.5 text-[10px] font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-500/60 dark:bg-rose-950/60 dark:text-rose-100"
              title="Fix requirements"
            >
              <ShieldCheck className="h-3 w-3" />
              <span>Fix profile</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function NoMatchBanner() {
  return (
    <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-xl bg-white/70 shadow-sm dark:bg-slate-900/60">
          <Search className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold">No compatible matches right now</div>
          <div className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-200/80">
            Try again later, or broaden preferences in Profile to increase results.
          </div>
        </div>
      </div>
    </div>
  );
}

function extractIntroPrompts(text?: string) {
  if (!text) return [];
  const lines = text.split("\n").map((l) => l.trim());
  const idx = lines.findIndex((l) => l.toLowerCase().includes("easy ways to start"));
  if (idx === -1) return [];
  const after = lines.slice(idx + 1);
  const prompts = after
    .filter((l) => l.startsWith("•"))
    .map((l) => l.replace(/^•\s*/, "").replace(/\*\*/g, "").trim())
    .filter(Boolean);
  return prompts.slice(0, 3);
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function getMatchStartedAtMs(convo: Conversation | null): number | null {
  if (!convo) return null;
  const anyC = convo as any;

  const candidates: Array<any> = [
    anyC.match_started_at,
    anyC.match_started_at_utc,
    anyC.started_at,
    anyC.started_at_utc,
    anyC.created_at,
    anyC.created_at_utc,
    anyC.matched_at,
    anyC.matched_at_utc,
  ];

  for (const c of candidates) {
    if (!c) continue;
    if (typeof c === "number") {
      if (c > 10_000_000_000) return c;
      return c * 1000;
    }
    if (typeof c === "string") {
      const ms = Date.parse(c);
      if (!Number.isNaN(ms)) return ms;
    }
  }
  return null;
}

function getLastActiveLabel(convo: Conversation | null): string {
  if (!convo) return "";
  const anyC = convo as any;

  // Try iso fields first (like your Admin page does)
  const isoCandidates: Array<any> = [
    anyC.partner_last_active,
    anyC.partner_last_active_utc,
    anyC.last_active,
    anyC.last_active_utc,
    anyC.partner_last_seen,
    anyC.partner_last_seen_utc,
  ];

  for (const c of isoCandidates) {
    if (typeof c === "string" && c.trim()) {
      const ms = Date.parse(c);
      if (!Number.isNaN(ms)) return fmtTs(c);
    }
  }

  // Fallback to your existing relative string (e.g. "now"/"5m")
  if (typeof (convo as any).lastAt === "string") return (convo as any).lastAt;

  return "";
}

/** ---------------- Page ---------------- */
export default function ConversationsPage() {
  type ThreadMsg = Msg & {
    role: "me" | "them" | "system";
    kind?: string;
    pending?: boolean;
    delivered?: boolean;
    read?: boolean;
  };

  const [convos, setConvos] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadMsg[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");

  const [menuFor, setMenuFor] = useState<string | null>(null);

  const [meId, setMeId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [reportOpen, setReportOpen] = useState<null | { cid: string; partnerName?: string }>(null);
  const [reportReason, setReportReason] = useState<ReportReason | "">("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSaving, setReportSaving] = useState(false);

  const openSeq = useRef(0);

  const [feedbackByCid, setFeedbackByCid] = useState<Record<string, "yes" | "no">>({});

  const [partnerTyping, setPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: u }, { data: s }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
      ]);
      setMeId(u.user?.id ?? null);
      setToken(s.session?.access_token ?? null);
    })().catch(() => {
      setMeId(null);
      setToken(null);
    });
  }, []);

  const [matchStatus, setMatchStatus] = useState<MatchStatus | null>(null);
  const [matchAllowed, setMatchAllowed] = useState<boolean>(false);
  const [nextEligibleAt, setNextEligibleAt] = useState<number | null>(null);
  const [noMatch, setNoMatch] = useState(false);

  const now = useNow(1000);

  const remainingMs = useMemo(() => {
    if (nextEligibleAt == null) return 0;
    return Math.max(0, nextEligibleAt - now);
  }, [nextEligibleAt, now]);

  const canMatch = matchAllowed && remainingMs === 0;

  const isAtMatchLimit = convos.length >= MATCH_LIMIT;
  const canRequestNewMatch = canMatch && !isAtMatchLimit;

  const countdown = formatCountdown(remainingMs);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await api.conversations();
        if (alive) setConvos(data);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const st: MatchStatus = await api.matchStatus();
        if (!alive) return;

        setMatchStatus(st);
        setMatchAllowed(!!st.eligible);

        if ((st as any).next_eligible_ts_utc) {
          const ms = Date.parse((st as any).next_eligible_ts_utc);
          setNextEligibleAt(Number.isNaN(ms) ? null : ms);
        } else {
          setNextEligibleAt(null);
        }
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setMatchStatus({
          eligible: false,
          reason: "Unable to check eligibility.",
          missing: ["Unable to check eligibility."],
        });
        setMatchAllowed(false);
        setNextEligibleAt(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const [matchLoading, setMatchLoading] = useState(false);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const matchStartedAtRef = useRef<number | null>(null);

  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
  const [feedbackChoice, setFeedbackChoice] = useState<"" | "yes" | "no">("");
  const [feedbackSaving, setFeedbackSaving] = useState(false);

  const [unlockedPhotos, setUnlockedPhotos] = useState<string[] | null>(null);
  const [photoViewerUrl, setPhotoViewerUrl] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPhotoViewerUrl(null);
        if (!reportSaving) setReportOpen(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reportSaving]);

  const onWsEvent = useCallback(
    (evt: WsEvent) => {
      switch (evt.type) {
        case "message-new": {
          const d = (evt as any).data ?? (evt as any);

          if (!activeId || d.conversation_id !== activeId) {
            setConvos((prev) =>
              prev.map((c) => {
                if (c.id !== d.conversation_id) return c;
                const isFromMe = !!meId && d.sender_user_id === meId;
                const unreadInc = isFromMe ? 0 : 1;

                return {
                  ...c,
                  lastMessage: d.content_text ?? c.lastMessage,
                  lastAt: "now" as any,
                  unread: (c.unread ?? 0) + unreadInc,
                };
              })
            );
            return;
          }

          if (!meId) return;

          const role: "me" | "them" = d.sender_user_id === meId ? "me" : "them";
          if (role === "them") setPartnerTyping(false);

          setThread((t) => {
            const alreadyThere = t.some((msg) => (msg as any).id === d.id);
            if (alreadyThere) return t;

            if (role === "me") {
              const idx = [...t]
                .reverse()
                .findIndex((m) => (m as any).role === "me" && (m as any).id?.startsWith?.("temp-"));

              if (idx !== -1) {
                const realIndex = t.length - 1 - idx;
                const clone = t.slice();
                clone[realIndex] = {
                  id: d.id,
                  role,
                  text: d.content_text ?? undefined,
                  ts: Math.floor(new Date(d.created_at).getTime() / 1000),
                  pending: false,
                  delivered: true,
                } as any;
                return clone;
              }
            }

            return [
              ...t,
              {
                id: d.id,
                role,
                text: d.content_text ?? undefined,
                ts: Math.floor(new Date(d.created_at).getTime() / 1000),
                pending: false,
                delivered: true,
              } as any,
            ];
          });

          setConvos((prev) =>
            prev.map((c) =>
              c.id === d.conversation_id
                ? {
                    ...c,
                    lastMessage: d.content_text ?? c.lastMessage,
                    lastAt: "now" as any,
                  }
                : c
            )
          );

          break;
        }

        case "typing": {
          const cid = (evt as any).conversation_id;
          if (!activeId || cid !== activeId) break;

          const isTyping = !!(evt as any).is_typing;
          setPartnerTyping(isTyping);

          if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
          if (isTyping) {
            typingTimeoutRef.current = window.setTimeout(() => {
              setPartnerTyping(false);
              typingTimeoutRef.current = null;
            }, 2500);
          }
          break;
        }

        case "photos-unlocked": {
          if (!activeId) break;
          if ((evt as any).conversation_id !== activeId) break;

          api.conversationPhotos(activeId).then((urls) => setUnlockedPhotos(urls)).catch(() => {});
          break;
        }

        case "ended": {
          const cid = (evt as any).conversation_id;
          setConvos((prev) => prev.filter((c) => c.id !== cid));
          if (cid === activeId) {
            setThread([]);
            setActiveId(null);
            setShowFeedbackPrompt(false);
            setUnlockedPhotos(null);
            setPhotoViewerUrl(null);
            setPartnerTyping(false);
          }
          break;
        }

        default:
          break;
      }
    },
    [meId, activeId]
  );

  const { status: wsStatus, sendText, setTyping, markRead: markReadWS } = useConversationWS({
    apiBase: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
    cid: activeId,
    token,
    onEvent: onWsEvent,
  });

  async function openConversation(id: string) {
    const seq = ++openSeq.current;

    setActiveId(id);
    setMenuFor(null);

    setShowFeedbackPrompt(false);
    setFeedbackChoice("");
    setUnlockedPhotos(null);
    setPhotoViewerUrl(null);
    setPartnerTyping(false);

    api.trackEvent({ event_name: "match_opened", conversation_id: id }).catch(() => {});

    const msgs = await api.thread(id);
    if (openSeq.current !== seq) return;

    setThread(
      (msgs as any[]).map((m) => ({
        ...(m as any),
        pending: (m as any)?.id?.startsWith?.("temp-") ?? false,
        delivered: !(m as any)?.id?.startsWith?.("temp-"),
      })) as any
    );

    try {
      markReadWS();
    } catch {}
    api.markRead(id).catch(() => {});
    setConvos((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));

    try {
      const st = await api.matchFeedbackStatus(id);
      if (openSeq.current !== seq) return;

      setShowFeedbackPrompt(!!(st as any).should_prompt);

      const myAns = (st as any).my_choice;
      if (myAns === "yes" || myAns === "no") {
        setFeedbackByCid((prev) => ({ ...prev, [id]: myAns }));
      }
    } catch {
      if (openSeq.current !== seq) return;
      setShowFeedbackPrompt(false);
    }

    try {
      const urls = await api.conversationPhotos(id);
      if (openSeq.current !== seq) return;
      setUnlockedPhotos(urls);
    } catch {
      if (openSeq.current !== seq) return;
      setUnlockedPhotos(null);
    }
  }

  async function submitFeedback() {
    if (!activeId || feedbackChoice === "") return;
    setFeedbackSaving(true);
    try {
      const res = await api.submitMatchFeedback(activeId, feedbackChoice === "yes");
      setFeedbackByCid((prev) => ({ ...prev, [activeId]: feedbackChoice }));
      setShowFeedbackPrompt(false);

      if ((res as any).photos_unlocked) {
        const urls = await api.conversationPhotos(activeId);
        setUnlockedPhotos(urls);
      }
    } catch (e) {
      console.error(e);
      alert("Could not save your answer. Try again.");
    } finally {
      setFeedbackSaving(false);
    }
  }

  async function send() {
    if (!message.trim() || !activeId || sending) return;
    setSending(true);

    const text = message.trim();
    const tempId = "temp-" + crypto.randomUUID();

    setThread((t) => [
      ...t,
      {
        id: tempId,
        role: "me",
        text,
        ts: Math.floor(Date.now() / 1000),
        pending: true,
        delivered: false,
      } as any,
    ]);

    setMessage("");

    api
      .trackEvent({
        event_name: "message_sent",
        conversation_id: activeId,
        properties: { message_type: "text" },
      })
      .catch(() => {});

    try {
      if (wsStatus === "connected") {
        sendText(text);
      } else {
        await api.sendMessage(activeId, text);
      }
    } finally {
      setSending(false);
    }
  }

  async function endChat(cid: string) {
    try {
      await api.endConversation(cid);

      setConvos((prev) => prev.filter((c) => c.id !== cid));
      setThread((t) => (activeId === cid ? [] : t));
      setActiveId((id) => (id === cid ? null : id));
      setShowFeedbackPrompt(false);
      setUnlockedPhotos(null);
      setPhotoViewerUrl(null);
      setPartnerTyping(false);

      setFeedbackByCid((prev) => {
        const clone = { ...prev };
        delete clone[cid];
        return clone;
      });
    } catch (err) {
      console.error("Failed to end chat", err);
      alert("Couldn't end this chat. Please try again.");
    } finally {
      setMenuFor(null);
    }
  }

  async function refreshMatchStatus() {
    try {
      const st: MatchStatus = await api.matchStatus();
      setMatchStatus(st);
      setMatchAllowed(!!st.eligible);
      if ((st as any).next_eligible_ts_utc) {
        const ms = Date.parse((st as any).next_eligible_ts_utc);
        setNextEligibleAt(Number.isNaN(ms) ? null : ms);
      } else {
        setNextEligibleAt(null);
      }
    } catch {
      // ignore
    }
  }

  async function getNewMatch() {
    if (matchLoading) return;

    if (convos.length >= MATCH_LIMIT) {
      alert(`You can only have ${MATCH_LIMIT} matches at a time. End a chat to get a new match.`);
      return;
    }

    matchStartedAtRef.current = Date.now();
    setMatchModalOpen(true);
    setMatchLoading(true);

    try {
      const res: MatchResponse = await api.match();

      if ((res as any).status === "matched") {
        setNoMatch(false);

        const updated = await api.conversations();
        setConvos(updated);

        if ((res as any).conversation_id) {
          setActiveId((res as any).conversation_id);
          const msgs = await api.thread((res as any).conversation_id);
          setThread(msgs as any);

          api.trackEvent({ event_name: "match_opened", conversation_id: (res as any).conversation_id }).catch(() => {});

          try {
            const st = await api.matchFeedbackStatus((res as any).conversation_id);
            setShowFeedbackPrompt(!!(st as any).should_prompt);

            const myAns = (st as any).my_choice;
            if (myAns === "yes" || myAns === "no") {
              setFeedbackByCid((prev) => ({ ...prev, [(res as any).conversation_id]: myAns }));
            }
          } catch {
            setShowFeedbackPrompt(false);
          }

          try {
            const urls = await api.conversationPhotos((res as any).conversation_id);
            setUnlockedPhotos(urls);
          } catch {
            setUnlockedPhotos(null);
          }
        }

        await refreshMatchStatus();
      } else if ((res as any).status === "ineligible") {
        setNoMatch(false);
        await refreshMatchStatus();
      } else if ((res as any).status === "no_match") {
        setNoMatch(true);
        setMatchStatus((prev) => ({
          ...(prev || { eligible: true }),
          reason: "No compatible match found right now.",
          missing: [],
        }));
      } else {
        setNoMatch(false);
        setMatchStatus((prev) => ({
          ...(prev || { eligible: false }),
          eligible: false,
          reason: "Unexpected response.",
          missing: ["Unexpected response."],
        }));
      }
    } catch (err) {
      setNoMatch(false);
      console.error(err);
      setMatchStatus((prev) => ({
        ...(prev || { eligible: false }),
        eligible: false,
        reason: "Something went wrong.",
        missing: ["Something went wrong."],
      }));
    } finally {
      setMatchLoading(false);
      window.setTimeout(() => {
        setMatchModalOpen(false);
        matchStartedAtRef.current = null;
      }, 260);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return convos;
    return convos.filter((c) =>
      [c.partnerName, c.partnerCity, c.lastMessage].some((v) => v?.toLowerCase().includes(q))
    );
  }, [search, convos]);

  const active = convos.find((c) => c.id === activeId) || null;

  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [thread, activeId]);

  const hasAnyConvos = convos.length > 0;

  const hasBlockingReasons = !canMatch || (matchStatus && !matchStatus.eligible) || isAtMatchLimit;
  const showTopMatchButton = !hasBlockingReasons;

  const showCuratingModal = matchModalOpen || matchLoading;

  const matchStartedAtMs = useMemo(() => getMatchStartedAtMs(active), [active]);
  const photoUnlockAtMs = useMemo(() => (matchStartedAtMs ? matchStartedAtMs + PHOTO_UNLOCK_MS : null), [matchStartedAtMs]);

  const photoRemainingMs = useMemo(() => {
    if (!photoUnlockAtMs) return null;
    return Math.max(0, photoUnlockAtMs - now);
  }, [photoUnlockAtMs, now]);

  const photosCooldownDone = photoRemainingMs != null ? photoRemainingMs === 0 : false;

  const myFeedback = activeId ? feedbackByCid[activeId] : undefined;

  const lastActiveLabel = useMemo(() => getLastActiveLabel(active), [active]);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-50 transition-colors duration-300">
      <MatchFindingModal open={showCuratingModal} startedAt={matchStartedAtRef.current} />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-0 right-0 mx-auto h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,140,248,0.25),_transparent_60%)] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,_rgba(244,114,182,0.18),_transparent_60%)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        <AppHeader />

        <main className="flex-1 py-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.95fr)]">
            <aside className="flex min-h-[70vh] flex-col rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/30">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquareHeart className="h-5 w-5 text-indigo-500 dark:text-indigo-300" />
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Conversations
                  </h2>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {convos.length} active
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, city, message…"
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-9 py-2 text-xs text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                  />
                </div>
                <button
                  className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-[11px] text-slate-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-200"
                  title="Filters (coming soon)"
                >
                  <Filter className="h-3.5 w-3.5" />
                  Filters
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />
                      {isAtMatchLimit ? (
                        <span>
                          You reached the limit: {MATCH_LIMIT} matches max. End one chat to get a new match.
                        </span>
                      ) : canMatch ? (
                        <span>You’re eligible for a new match now.</span>
                      ) : nextEligibleAt ? (
                        <span>Next curated match in {countdown}.</span>
                      ) : (
                        <span>Matching is currently unavailable.</span>
                      )}
                    </div>

                    <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Limit: {MATCH_LIMIT} active matches. For more, end one of your chats.
                    </div>

                    <MatchBlockers status={matchStatus} align="left" />
                    {noMatch && <NoMatchBanner />}
                  </div>

                  {showTopMatchButton && (
                    <button
                      onClick={getNewMatch}
                      disabled={matchLoading || !canRequestNewMatch}
                      className={
                        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium " +
                        (matchLoading
                          ? "bg-slate-200 text-slate-500 cursor-wait dark:bg-slate-800 dark:text-slate-400"
                          : !canRequestNewMatch
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
                          : "bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 text-white shadow-sm hover:brightness-110")
                      }
                      title={
                        matchLoading
                          ? "Matching..."
                          : !canRequestNewMatch
                          ? `Max ${MATCH_LIMIT} matches at a time`
                          : "Find a new match"
                      }
                    >
                      {matchLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      <span>New match</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-1 overflow-y-auto pr-1" style={{ maxHeight: "58vh" }}>
                {filtered.map((c) => {
                  const isActive = activeId === c.id;
                  const isMenuOpen = menuFor === c.id;
                  const badge = feedbackByCid[c.id];

                  // "last active" label like Admin page: prefer ISO, fallback to lastAt
                  const lastActive = getLastActiveLabel(c);

                  return (
                    <div
                      key={c.id}
                      className={`flex items-start gap-2 rounded-2xl px-2 py-2 transition ${
                        isActive
                          ? "bg-indigo-50/80 ring-1 ring-indigo-200 dark:bg-indigo-950/40 dark:ring-indigo-800/60"
                          : "hover:bg-slate-50/80 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <button onClick={() => openConversation(c.id)} className="flex flex-1 items-start gap-3 text-left">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-indigo-500 via-violet-500 to-rose-500 text-xs font-semibold text-white">
                          {c.partnerName?.substring(0, 1) ?? "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">
                              {c.partnerName}

                              {badge && (
                                <span
                                  className={
                                    "ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                                    (badge === "yes"
                                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                                      : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200")
                                  }
                                  title="Your satisfaction vote"
                                >
                                  {badge === "yes" ? "You: Yes" : "You: No"}
                                </span>
                              )}

                              {c.partnerAge ? (
                                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                  {" "}
                                  · {c.partnerAge}
                                </span>
                              ) : null}
                              {c.partnerCity ? (
                                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                  {" "}
                                  · {c.partnerCity}
                                </span>
                              ) : null}
                            </div>

                            <div
                              className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500"
                              title={lastActive}
                            >
                              {lastActive}
                            </div>
                          </div>

                          <div className="truncate text-[11px] text-slate-600 dark:text-slate-300">{c.lastMessage}</div>

                          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            {typeof c.compatibility === "number" && (
                              <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                <Star className="h-3 w-3 text-rose-500" />
                                <span>{Math.round((c.compatibility || 0) * 100)}%</span>
                              </div>
                            )}
                            {c.unread ? (
                              <span className="ml-auto inline-flex rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                                {c.unread}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>

                      {isActive && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuFor(isMenuOpen ? null : c.id);
                            }}
                            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            title="More options"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {isMenuOpen && (
                            <div className="absolute right-0 mt-1 w-40 rounded-2xl border border-slate-200 bg-white/95 text-xs text-slate-700 shadow-lg dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuFor(null);
                                  setReportOpen({ cid: c.id, partnerName: c.partnerName });
                                  setReportReason("");
                                  setReportDetails("");
                                }}
                                className="w-full rounded-2xl px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60"
                              >
                                Report
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  endChat(c.id);
                                }}
                                className="w-full rounded-2xl px-4 py-2 text-left text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
                              >
                                End chat
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {filtered.length === 0 && (
                  <div className="flex flex-col items-center px-4 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    <MessageSquareHeart className="mb-2 h-6 w-6 text-indigo-500 dark:text-indigo-300" />
                    <div className="text-sm text-slate-700 dark:text-slate-200">No conversations yet.</div>

                    <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      Limit: {MATCH_LIMIT} active matches. End one to get another.
                    </div>

                    <div className="mt-3">
                      <button
                        onClick={getNewMatch}
                        disabled={matchLoading || !canRequestNewMatch}
                        className={
                          "inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium " +
                          (matchLoading
                            ? "bg-slate-200 text-slate-500 cursor-wait dark:bg-slate-800 dark:text-slate-400"
                            : !canRequestNewMatch
                            ? "bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
                            : "bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 text-white shadow-sm hover:brightness-110")
                        }
                      >
                        {matchLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        <span>Find my first match</span>
                      </button>
                    </div>

                    <div className="mt-2 w-full max-w-xs">
                      <MatchBlockers status={matchStatus} align="center" />
                      {noMatch && <NoMatchBanner />}
                    </div>
                  </div>
                )}
              </div>
            </aside>

            <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/80 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/30">
              {!active ? (
                <div className="flex-1 p-8">
                  <div className="grid h-full place-items-center">
                    {hasAnyConvos ? (
                      <div className="w-full max-w-sm text-center">
                        <MessageSquareHeart className="mx-auto h-10 w-10 text-indigo-500 dark:text-indigo-300" />
                        <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">
                          Select a conversation on the left to start chatting.
                        </p>

                        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-left text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />
                              {isAtMatchLimit ? (
                                <span>Max {MATCH_LIMIT} matches. End one chat to get a new match.</span>
                              ) : canMatch ? (
                                <span>You can request a new match now.</span>
                              ) : nextEligibleAt ? (
                                <span>Next curated match in {countdown}.</span>
                              ) : (
                                <span>Matching is currently unavailable.</span>
                              )}
                            </div>

                            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              Limit: {MATCH_LIMIT} active matches. For more, end one of your chats.
                            </div>

                            <MatchBlockers status={matchStatus} align="left" />
                            {noMatch && <NoMatchBanner />}
                          </div>

                          <button
                            onClick={getNewMatch}
                            disabled={matchLoading || !canRequestNewMatch}
                            className={
                              "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-medium " +
                              (matchLoading
                                ? "bg-slate-200 text-slate-500 cursor-wait dark:bg-slate-800 dark:text-slate-400"
                                : !canRequestNewMatch
                                ? "bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
                                : "bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 text-white shadow-sm hover:brightness-110")
                            }
                          >
                            {matchLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                            <span>New match</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-sm text-slate-600 dark:text-slate-300">
                        <MessageSquareHeart className="mx-auto h-10 w-10 text-indigo-500 dark:text-indigo-300" />
                        <p className="mt-3">No conversations yet. Try creating your first match.</p>
                        <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                          Limit: {MATCH_LIMIT} active matches. End one to get another.
                        </div>
                        <div className="mt-4 w-full max-w-xs mx-auto">
                          <MatchBlockers status={matchStatus} align="center" />
                          {noMatch && <NoMatchBanner />}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/80">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate font-semibold text-slate-900 dark:text-slate-50">
                          {active?.partnerName}
                        </span>

                        {myFeedback && (
                          <span
                            className={
                              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold " +
                              (myFeedback === "yes"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200")
                            }
                            title="Your satisfaction vote"
                          >
                            You: {myFeedback === "yes" ? "Yes" : "No"}
                          </span>
                        )}

                        {typeof active?.compatibility === "number" && (
                          <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
                            {Math.round((active.compatibility || 0) * 100)}% match
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {active?.partnerAge ? `${active.partnerAge} yrs` : "Age —"} ·{" "}
                        {active?.partnerCity ? active.partnerCity : "Location —"}
                      </div>

                      <div className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500" title={lastActiveLabel}>
                        {partnerTyping ? "Typing now…" : lastActiveLabel ? `Last active: ${lastActiveLabel}` : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <Link
                        to="/profile"
                        className="underline decoration-slate-300 underline-offset-4 hover:text-indigo-600 dark:decoration-slate-600 dark:hover:text-indigo-300"
                      >
                        Adjust preferences
                      </Link>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  {showFeedbackPrompt && (
                    <div className="mx-4 mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                      <div className="font-medium text-slate-900 dark:text-slate-50">
                        Are you satisfied with this match?
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <select
                          value={feedbackChoice}
                          onChange={(e) => setFeedbackChoice(e.target.value as any)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                        >
                          <option value="">Select…</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>

                        <button
                          type="button"
                          onClick={submitFeedback}
                          disabled={feedbackSaving || feedbackChoice === ""}
                          className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          {feedbackSaving ? "Saving..." : "Submit"}
                        </button>
                      </div>

                      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{PHOTO_UNLOCK_NOTE}</div>
                    </div>
                  )}

                  {active && (
                    <>
                      {unlockedPhotos && unlockedPhotos.length > 0 ? (
                        <div className="mx-4 mt-3 flex gap-2 overflow-x-auto pb-1">
                          {unlockedPhotos.map((u) => (
                            <button
                              key={u}
                              type="button"
                              onClick={() => setPhotoViewerUrl(u)}
                              className="shrink-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              title="Open photo"
                            >
                              <img src={u} className="h-24 w-24 rounded-2xl object-cover" alt="Unlocked" loading="lazy" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="mx-4 mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-xl bg-white/70 shadow-sm dark:bg-slate-950/60">
                              <ShieldCheck className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold">Photos locked</div>

                              <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                {PHOTO_UNLOCK_NOTE}
                              </div>

                              {photoUnlockAtMs ? (
                                <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-[11px] text-slate-700 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200">
                                  <Clock className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />
                                  {photosCooldownDone ? (
                                    <span>Cooldown finished. Waiting for mutual Yes.</span>
                                  ) : (
                                    <span>
                                      Unlock available in{" "}
                                      <span className="font-semibold">{formatCountdown(photoRemainingMs || 0)}</span>
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                                  Unlock is available 24 hours after the match starts.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex-1 min-h-0 overflow-hidden">
                    <div className="h-full space-y-3 overflow-y-auto px-4 py-4">
                      {thread.map((m) => {
                        if ((m as any).role === "system") {
                          const prompts = extractIntroPrompts((m as any).text);
                          return (
                            <motion.div
                              key={(m as any).id}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex justify-center"
                            >
                              <div className="w-full max-w-[92%] rounded-3xl border border-indigo-200 bg-indigo-50/70 p-4 text-sm text-slate-900 shadow-sm dark:border-indigo-800/50 dark:bg-indigo-950/40 dark:text-slate-50">
                                <div className="flex items-center gap-2 text-[11px] font-semibold text-indigo-700 dark:text-indigo-200">
                                  <Sparkles className="h-4 w-4" />
                                  Match intro
                                </div>

                                <div className="mt-2 whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-100">
                                  {(m as any).text}
                                </div>

                                {prompts.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {prompts.map((p) => (
                                      <button
                                        key={p}
                                        type="button"
                                        onClick={() => setMessage(p)}
                                        className="rounded-full border border-indigo-200 bg-white/70 px-3 py-1 text-[11px] font-medium text-indigo-700 hover:bg-white dark:border-indigo-800/50 dark:bg-slate-900/60 dark:text-indigo-200"
                                        title="Use this starter"
                                      >
                                        {p}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        }

                        const mine = (m as any).role === "me";
                        const pending = !!(m as any).pending || ((m as any).id?.startsWith?.("temp-") ?? false);
                        const tsLabel = formatShortTime((m as any).ts);

                        const tsFull =
                          (m as any).ts != null ? new Date((m as any).ts * 1000).toLocaleString() : "";

                        return (
                          <motion.div
                            key={(m as any).id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${mine ? "justify-end" : "justify-start"}`}
                          >
                            <div className="max-w-[78%]">
                              <div
                                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                                  mine
                                    ? "bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 text-white"
                                    : "bg-slate-100/90 text-slate-900 dark:bg-slate-800/80 dark:text-slate-50"
                                }`}
                              >
                                {(m as any).text}
                              </div>

                              <div
                                className={`mt-1 flex items-center gap-2 text-[10px] ${
                                  mine ? "justify-end" : "justify-start"
                                } text-slate-400 dark:text-slate-500`}
                                title={tsFull}
                              >
                                {tsLabel ? <span>{tsLabel}</span> : null}
                                {mine && (
                                  <span className="inline-flex items-center gap-1">
                                    {pending ? (
                                      <>
                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400/70" />
                                        <span>Sending…</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                                        <span>Sent</span>
                                      </>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                      <div ref={bottomRef} />
                    </div>
                  </div>

                  <form
                    className="flex items-center gap-3 border-t border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80"
                    onSubmit={(e) => {
                      e.preventDefault();
                      send();
                    }}
                  >
                    <input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onFocus={() => activeId && (markReadWS(), api.markRead(activeId).catch(() => {}))}
                      placeholder="Write a message…"
                      className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                      onKeyDown={() => setTyping(true)}
                      onBlur={() => setTyping(false)}
                    />
                    <button
                      type="submit"
                      disabled={sending}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-60"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                      Send
                    </button>
                  </form>

                  <div className="px-4 pb-3 text-[11px] text-slate-400 dark:text-slate-500">WS status: {wsStatus}</div>
                </>
              )}
            </section>
          </div>
        </main>

        <AppFooter />
      </div>

      {/* REPORT MODAL */}
      {reportOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !reportSaving && setReportOpen(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-semibold">Report {reportOpen.partnerName || "user"}</div>
              <button
                type="button"
                onClick={() => !reportSaving && setReportOpen(null)}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">Reason</div>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value as ReportReason)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              disabled={reportSaving}
            >
              <option value="">Select…</option>
              <option value="spam">Spam</option>
              <option value="harassment">Harassment</option>
              <option value="scam">Scam / fraud</option>
              <option value="hate">Hate</option>
              <option value="sexual">Sexual content</option>
              <option value="impersonation">Impersonation</option>
              <option value="other">Other</option>
            </select>

            <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">Details (optional)</div>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              rows={4}
              className="mt-1 w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              placeholder="What happened?"
              disabled={reportSaving}
            />

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setReportOpen(null)}
                disabled={reportSaving}
                className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={reportSaving || reportReason === ""}
                onClick={async () => {
                  if (!reportOpen || reportReason === "") return;
                  setReportSaving(true);
                  try {
                    await api.reportUser({
                      conversation_id: reportOpen.cid,
                      reason: reportReason,
                      details: reportDetails || undefined,
                    });

                    setReportOpen(null);
                    setMenuFor(null);
                    alert("Report submitted.");
                  } catch (e) {
                    console.error(e);
                    alert("Could not submit report. Try again.");
                  } finally {
                    setReportSaving(false);
                  }
                }}
                className="flex-1 rounded-2xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {reportSaving ? "Submitting..." : "Submit report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {photoViewerUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPhotoViewerUrl(null)}
        >
          <div className="relative max-h-[85vh] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPhotoViewerUrl(null)}
              className="absolute -right-3 -top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow hover:bg-white"
              aria-label="Close photo"
            >
              ✕
            </button>

            <img
              src={photoViewerUrl}
              alt="Opened photo"
              className="max-h-[85vh] max-w-[92vw] rounded-3xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
