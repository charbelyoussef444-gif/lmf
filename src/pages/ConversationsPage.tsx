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
  ChevronDown,
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

const PHOTO_UNLOCK_NOTE =
  "Photos will appear only with mutual consent, and only after 24 hours of the match.";
const PHOTO_UNLOCK_HOURS = 24;

// UI-only cap (no backend enforcement)
const MAX_ACTIVE_CHATS = 3;

const LS_FEEDBACK_PREFIX = "lm_feedback_choice_v1:"; // + cid
const LS_MATCHEDAT_PREFIX = "lm_matched_at_v1:"; // + cid

/** ---------------- Boot loading overlay (site visit) ---------------- */
function BootLoadingOverlay({
  open,
  subtitle,
}: {
  open: boolean;
  subtitle?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-xl"
            initial={{ y: 18, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 14, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            {/* soft drifting glows */}
            <div className="pointer-events-none absolute inset-0">
              <motion.div
                className="absolute -top-24 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.32),_transparent_60%)] blur-3xl"
                animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
                transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,_rgba(244,114,182,0.26),_transparent_60%)] blur-3xl"
                animate={{ scale: [1, 1.06, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2.3, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.22),_transparent_60%)] blur-3xl"
                animate={{ scale: [1, 1.1, 1], opacity: [0.78, 1, 0.78] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-5 w-5 text-white/80" />
                  </motion.div>
                </div>

                <div className="min-w-0">
                  <div className="text-base font-semibold text-white">
                    Loading your workspace…
                  </div>
                  <div className="mt-0.5 text-xs text-white/70">
                    {subtitle || "Syncing profile, matches, and conversations"}
                  </div>
                </div>
              </div>

              <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full w-1/3 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500"
                  animate={{ x: ["-40%", "220%"] }}
                  transition={{ duration: 1.05, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              <div className="mt-3 grid gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-full rounded-2xl border border-white/10 bg-white/5"
                  >
                    <motion.div
                      className="h-full w-1/2 rounded-2xl bg-white/10"
                      animate={{ x: ["-10%", "120%"] }}
                      transition={{
                        duration: 1.35 + i * 0.18,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between text-[11px] text-white/55">
                <span>Usually quick.</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-white/75">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Live
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
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

function MatchFindingModal({
  open,
  startedAt,
}: {
  open: boolean;
  startedAt: number | null;
}) {
  const elapsed = useElapsedMs(open, startedAt, 80);

  // ✅ loop phrases forever
  const PHRASES = useMemo(
    () => [
      { title: "Curating your match…", sub: "Warming up signals" },
      { title: "Scanning compatibility…", sub: "Personality, interests, intent" },
      { title: "Ranking the best fit…", sub: "Quality-first, not quantity" },
      { title: "Finalizing…", sub: "Creating your conversation thread" },
      { title: "Almost there…", sub: "One last pass for accuracy" },
    ],
    []
  );

  const step = useMemo(() => {
    const i = Math.floor(elapsed / 900) % PHRASES.length;
    return { k: i, ...PHRASES[i] };
  }, [elapsed, PHRASES]);

  // ✅ bubble positions per step (inside the ring)
  const bubbleLayouts = useMemo(
    () => [
      [
        { x: "26%", y: "30%", s: 10, o: 0.95 },
        { x: "58%", y: "26%", s: 7, o: 0.85 },
        { x: "64%", y: "56%", s: 9, o: 0.9 },
        { x: "34%", y: "64%", s: 6, o: 0.8 },
        { x: "48%", y: "46%", s: 4, o: 0.6 },
      ],
      [
        { x: "32%", y: "24%", s: 8, o: 0.9 },
        { x: "66%", y: "34%", s: 10, o: 0.95 },
        { x: "58%", y: "66%", s: 7, o: 0.85 },
        { x: "28%", y: "58%", s: 9, o: 0.9 },
        { x: "46%", y: "44%", s: 4, o: 0.6 },
      ],
      [
        { x: "24%", y: "40%", s: 9, o: 0.9 },
        { x: "54%", y: "22%", s: 6, o: 0.8 },
        { x: "70%", y: "48%", s: 10, o: 0.95 },
        { x: "44%", y: "70%", s: 8, o: 0.88 },
        { x: "46%", y: "46%", s: 4, o: 0.6 },
      ],
      [
        { x: "30%", y: "32%", s: 6, o: 0.8 },
        { x: "62%", y: "28%", s: 9, o: 0.9 },
        { x: "68%", y: "62%", s: 7, o: 0.85 },
        { x: "30%", y: "66%", s: 10, o: 0.95 },
        { x: "48%", y: "46%", s: 4, o: 0.6 },
      ],
      [
        { x: "22%", y: "28%", s: 10, o: 0.95 },
        { x: "66%", y: "26%", s: 6, o: 0.8 },
        { x: "72%", y: "58%", s: 9, o: 0.9 },
        { x: "34%", y: "72%", s: 7, o: 0.85 },
        { x: "48%", y: "46%", s: 4, o: 0.6 },
      ],
    ],
    []
  );

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
            {/* animated glow */}
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
                {/* rotating halo */}
                <motion.div
                  className="absolute inset-[-12px] rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 opacity-70 blur-[10px]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
                />

                {/* ring */}
                <motion.div
                  className="relative grid h-24 w-24 place-items-center rounded-full border border-white/15 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 1.25, repeat: Infinity, ease: "easeInOut" }}
                >
                  {/* orbit dots (outer) */}
                  <motion.div
                    className="absolute inset-0"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.9, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white/90 shadow" />
                    <div className="absolute bottom-1 left-3 h-2 w-2 rounded-full bg-white/70 shadow" />
                    <div className="absolute bottom-4 right-2 h-1.5 w-1.5 rounded-full bg-white/60 shadow" />
                  </motion.div>

                  {/* inner bubbles */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={step.k}
                      className="absolute inset-0"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.22 }}
                    >
                      {bubbleLayouts[step.k].map((b, i) => (
                        <motion.span
                          key={i}
                          className="absolute rounded-full bg-white"
                          style={{
                            left: b.x,
                            top: b.y,
                            width: b.s,
                            height: b.s,
                            opacity: b.o,
                          }}
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: b.o, scale: [0.9, 1.05, 0.95] }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            repeatType: "mirror",
                            delay: i * 0.05,
                          }}
                        />
                      ))}
                    </motion.div>
                  </AnimatePresence>
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
                  key={step.k}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="text-base font-semibold text-white">{step.title}</div>
                  <div className="mt-1 text-xs text-white/70">{step.sub}</div>
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
    if (!checks.assessment_completed)
      issues.push("Your compatibility assessment is not complete.");
    if (!checks.has_interest) issues.push("Add at least 1 interest to your profile.");
    if (!checks.has_photos) {
      const n = checks.photos_count ?? 0;
      issues.push(`Upload at least 3 gallery photos. (${n}/3)`);
    }
  } else {
    if (missing.length) issues.push(...missing);
    else if (reason) issues.push(reason);
  }

  const show = issues.length > 0 || (!!reason && !(status as any).eligible);
  if (!show) return null;

  const alignClasses =
    align === "center" ? "items-center text-center" : "items-start text-left";
  const buttonsJustify = align === "center" ? "justify-center" : "";

  const needsProfile = checks
    ? !checks.not_banned || !checks.verified || !checks.has_interest || !checks.has_photos
    : issues.some((x) => {
        const s = x.toLowerCase();
        return (
          s.includes("interest") ||
          s.includes("photo") ||
          s.includes("verified") ||
          s.includes("banned")
        );
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
          <Link
            to="/profile"
            className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-white/80 px-2.5 py-0.5 text-[10px] font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-500/60 dark:bg-rose-950/60 dark:text-rose-100"
            title="Fix requirements"
          >
            <ShieldCheck className="h-3 w-3" />
            <span>Fix profile</span>
          </Link>
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

/** ---------------- Helpers ---------------- */
function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function msToClock(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// ✅ admin-style timestamp display
function fmtTs(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function fmtMsgTimeFromSec(tsSec?: number) {
  if (!tsSec) return "";
  const d = new Date(tsSec * 1000);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function TypingDots() {
  const dot = "h-1.5 w-1.5 rounded-full";
  return (
    <div className="inline-flex items-center gap-1" aria-label="Typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={`${dot} bg-slate-500 dark:bg-slate-300`}
          animate={{ y: [0, -3, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function safeGetLS(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSetLS(key: string, val: string) {
  try {
    window.localStorage.setItem(key, val);
  } catch {}
}
function safeRemoveLS(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {}
}

function parseIsoOrNull(s?: string | null) {
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

/** ---------------- Page ---------------- */
export default function ConversationsPage() {
  // Widen message type locally without forcing lib/api changes.
  type ThreadMsg = Msg & { role: "me" | "them" | "system"; kind?: string };

  // ✅ widen conversation type locally (so we can read partnerLastActive + matchedAt without touching lib/api)
  type ConversationRow = Conversation & {
    partnerLastActive?: string | null;
    matchedAt?: string | null; // optional (if backend ever adds it)
  };

  // ✅ FIX: backend can sometimes return duplicate "system" intro (or duplicate IDs)
  // We normalize once on every fetch/set so "Match intro" never renders twice.
  function normalizeThread(raw: any[]): ThreadMsg[] {
    if (!Array.isArray(raw)) return [];

    const seenIds = new Set<string>();
    const seenSystemTexts = new Set<string>();
    let keptFirstSystem = false;

    const out: any[] = [];

    for (const m of raw) {
      if (!m) continue;

      const id = String((m as any).id ?? "");
      const role = String((m as any).role ?? "");
      const text = String((m as any).text ?? "");

      // 1) Dedup by id if provided
      if (id && seenIds.has(id)) continue;
      if (id) seenIds.add(id);

      // 2) Dedup the match intro specifically:
      // - Keep only the first system message
      // - Also dedup identical system texts (some backends send the same intro twice with different ids)
      if (role === "system") {
        const key = text.trim();

        // If multiple system messages exist, keep only the first one.
        if (keptFirstSystem) continue;

        // Safety: if the same system text somehow repeats, drop it
        if (key && seenSystemTexts.has(key)) continue;
        if (key) seenSystemTexts.add(key);

        keptFirstSystem = true;
      }

      out.push(m);
    }

    return out as ThreadMsg[];
  }

  const [convos, setConvos] = useState<ConversationRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadMsg[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");

  const [menuFor, setMenuFor] = useState<string | null>(null);

  const [meId, setMeId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [reportOpen, setReportOpen] = useState<null | { cid: string; partnerName?: string }>(
    null
  );
  const [reportReason, setReportReason] = useState<ReportReason | "">("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSaving, setReportSaving] = useState(false);

  // ✅ prevents openConversation race (fast clicks)
  const openSeq = useRef(0);

  // ✅ small loading when switching chats
  const [openingChat, setOpeningChat] = useState(false);
  const openingChatIdRef = useRef<string | null>(null);

  // ✅ partner typing indicator (WS emits: {type:"typing", userId, isTyping})
  const [partnerTyping, setPartnerTyping] = useState(false);
  const partnerTypingTimeoutRef = useRef<number | null>(null);

  const stopPartnerTyping = useCallback(() => {
    setPartnerTyping(false);
    if (partnerTypingTimeoutRef.current) {
      window.clearTimeout(partnerTypingTimeoutRef.current);
      partnerTypingTimeoutRef.current = null;
    }
  }, []);

  const bumpPartnerTyping = useCallback(() => {
    setPartnerTyping(true);
    if (partnerTypingTimeoutRef.current) {
      window.clearTimeout(partnerTypingTimeoutRef.current);
    }
    partnerTypingTimeoutRef.current = window.setTimeout(() => {
      setPartnerTyping(false);
      partnerTypingTimeoutRef.current = null;
    }, 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (partnerTypingTimeoutRef.current) {
        window.clearTimeout(partnerTypingTimeoutRef.current);
        partnerTypingTimeoutRef.current = null;
      }
    };
  }, []);

  // -------- boot loading (site visit) --------
  const [bootAuthDone, setBootAuthDone] = useState(false);
  const [bootConvosDone, setBootConvosDone] = useState(false);
  const [bootStatusDone, setBootStatusDone] = useState(false);

  const bootLoading = !(bootAuthDone && bootConvosDone && bootStatusDone);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [{ data: u }, { data: s }] = await Promise.all([
          supabase.auth.getUser(),
          supabase.auth.getSession(),
        ]);
        if (!alive) return;
        setMeId(u.user?.id ?? null);
        setToken(s.session?.access_token ?? null);
      } catch {
        if (!alive) return;
        setMeId(null);
        setToken(null);
      } finally {
        if (alive) setBootAuthDone(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  // -----------------------------------------

  const [matchStatus, setMatchStatus] = useState<MatchStatus | null>(null);
  const [matchAllowed, setMatchAllowed] = useState<boolean>(false);
  const [nextEligibleAt, setNextEligibleAt] = useState<number | null>(null);
  const [noMatch, setNoMatch] = useState(false);

  const now = useNow(1000);
  const remainingMs = useMemo(() => {
    if (nextEligibleAt == null) return 0;
    return Math.max(0, nextEligibleAt - now);
  }, [nextEligibleAt, now]);

  const countdown = msToClock(remainingMs);

  // ✅ UI-only active chat cap
  const atChatLimit = convos.length >= MAX_ACTIVE_CHATS;

  // old canMatch = matchAllowed && remainingMs === 0
  const canMatch = matchAllowed && remainingMs === 0 && !atChatLimit;

  // feedback pin (UI-only, persisted)
  const [pinnedFeedback, setPinnedFeedback] = useState<Record<string, "yes" | "no">>({});
  const pinnedForActive = activeId ? pinnedFeedback[activeId] : undefined;

  // matchedAt (UI-only, persisted fallback) for cooldown
  const [matchedAtMsByCid, setMatchedAtMsByCid] = useState<Record<string, number>>({});

  // fold photos section (per active convo, default collapsed)
  const [photosExpanded, setPhotosExpanded] = useState(false);
  useEffect(() => {
    // each conversation starts collapsed to save space
    setPhotosExpanded(false);
  }, [activeId]);

  // Load pinned feedback map lazily from LS for active convo on open
  const loadPinnedForCid = useCallback((cid: string) => {
    const v = safeGetLS(LS_FEEDBACK_PREFIX + cid);
    if (v === "yes" || v === "no") {
      setPinnedFeedback((prev) => ({ ...prev, [cid]: v }));
      return v;
    }
    return null;
  }, []);

  const savePinnedForCid = useCallback((cid: string, v: "yes" | "no" | null) => {
    if (!cid) return;
    if (!v) {
      safeRemoveLS(LS_FEEDBACK_PREFIX + cid);
      setPinnedFeedback((prev) => {
        const clone = { ...prev };
        delete clone[cid];
        return clone;
      });
      return;
    }
    safeSetLS(LS_FEEDBACK_PREFIX + cid, v);
    setPinnedFeedback((prev) => ({ ...prev, [cid]: v }));
  }, []);

  const loadMatchedAtForCid = useCallback((cid: string) => {
    const raw = safeGetLS(LS_MATCHEDAT_PREFIX + cid);
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    setMatchedAtMsByCid((prev) => ({ ...prev, [cid]: n }));
    return n;
  }, []);

  const saveMatchedAtForCid = useCallback((cid: string, ms: number) => {
    if (!cid || !Number.isFinite(ms) || ms <= 0) return;
    safeSetLS(LS_MATCHEDAT_PREFIX + cid, String(ms));
    setMatchedAtMsByCid((prev) => ({ ...prev, [cid]: ms }));
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = (await api.conversations()) as any as ConversationRow[];
        if (!alive) return;

        setConvos(data);

        // opportunistically stash matchedAt if backend ever includes it
        data.forEach((c) => {
          const ms = parseIsoOrNull((c as any).matchedAt);
          if (ms) saveMatchedAtForCid(c.id, ms);
        });
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setBootConvosDone(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [saveMatchedAtForCid]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const st: MatchStatus = await api.matchStatus();
        if (!alive) return;

        setMatchStatus(st);
        setMatchAllowed(!!(st as any).eligible);

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
        } as any);
        setMatchAllowed(false);
        setNextEligibleAt(null);
      } finally {
        if (alive) setBootStatusDone(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const [matchLoading, setMatchLoading] = useState(false);

  // ✅ modal control
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const matchStartedAtRef = useRef<number | null>(null);

  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
  const [feedbackChoice, setFeedbackChoice] = useState<"" | "yes" | "no">>("");
  const [feedbackSaving, setFeedbackSaving] = useState(false);

  const [unlockedPhotos, setUnlockedPhotos] = useState<string[] | null>(null);
  const [photoViewerUrl, setPhotoViewerUrl] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPhotoViewerUrl(null);
        if (!reportSaving) setReportOpen(null);
        // do NOT close the match popup with ESC
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reportSaving]);

  // ✅ WS event handler (TS-safe)
  const onWsEvent = useCallback(
    (evt: WsEvent) => {
      switch (evt.type) {
        case "typing": {
          // socket is already per-conversation, just ensure it's partner
          if (meId && evt.userId === meId) return;
          if (evt.isTyping) bumpPartnerTyping();
          else stopPartnerTyping();
          break;
        }

        case "message-new": {
          const d = evt.data;

          // if a message arrives, stop typing
          stopPartnerTyping();

          // ✅ if not for the currently open conversation, DO NOT push into thread
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

          setThread((t) => {
            const alreadyThere = t.some((msg) => msg.id === d.id);
            if (alreadyThere) return t;

            // Replace temp message if it was ours
            if (role === "me") {
              const idx = [...t].reverse().findIndex(
                (m) => m.role === "me" && String((m as any).id).startsWith("temp-")
              );

              if (idx !== -1) {
                const realIndex = t.length - 1 - idx;
                const clone = t.slice();
                clone[realIndex] = {
                  id: d.id,
                  role,
                  text: d.content_text ?? undefined,
                  ts: Math.floor(new Date(d.created_at).getTime() / 1000),
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
              } as any,
            ];
          });

          // keep preview updated for active convo
          setConvos((prev) =>
            prev.map((c) =>
              c.id === d.conversation_id
                ? { ...c, lastMessage: d.content_text ?? c.lastMessage, lastAt: "now" as any }
                : c
            )
          );

          break;
        }

        case "photos-unlocked": {
          if (!activeId) break;
          if (evt.conversation_id !== activeId) break;

          api
            .conversationPhotos(activeId)
            .then((urls) => setUnlockedPhotos(urls))
            .catch(() => {});
          break;
        }

        case "ended": {
          setConvos((prev) => prev.filter((c) => c.id !== evt.conversation_id));
          if (evt.conversation_id === activeId) {
            setThread([]);
            setActiveId(null);
            setShowFeedbackPrompt(false);
            setUnlockedPhotos(null);
            setPhotoViewerUrl(null);
            stopPartnerTyping();
          }
          break;
        }

        default:
          break;
      }
    },
    [meId, activeId, bumpPartnerTyping, stopPartnerTyping]
  );

  const { status: wsStatus, sendText, setTyping, markRead: markReadWS } = useConversationWS({
    apiBase: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
    cid: activeId,
    token,
    onEvent: onWsEvent,
  });

  // ✅ race-safe conversation open
  async function openConversation(id: string) {
    const seq = ++openSeq.current;

    openingChatIdRef.current = id;
    setOpeningChat(true);

    setActiveId(id);
    setMenuFor(null);

    setShowFeedbackPrompt(false);
    setFeedbackChoice("");
    setUnlockedPhotos(null);
    setPhotoViewerUrl(null);
    stopPartnerTyping();

    // load pinned feedback immediately (UI memory)
    const pinned = loadPinnedForCid(id);
    if (pinned === "yes" || pinned === "no") {
      setFeedbackChoice(pinned);
    }

    // load matchedAt (UI memory)
    loadMatchedAtForCid(id);

    api.trackEvent({ event_name: "match_opened", conversation_id: id }).catch(() => {});

    try {
      const rawMsgs = (await api.thread(id)) as any;
      const msgs = normalizeThread(rawMsgs);

      if (openSeq.current !== seq) return;

      setThread(msgs as any);

      // If we don't have a matchedAt for this convo, approximate using earliest message ts
      // (UI-only fallback; avoids needing backend changes)
      const already = matchedAtMsByCid[id] ?? loadMatchedAtForCid(id);
      if (!already) {
        const earliest = (msgs as any[])
          .map((m) => Number((m as any).ts))
          .filter((x) => Number.isFinite(x) && x > 0)
          .sort((a, b) => a - b)[0];

        if (earliest) {
          saveMatchedAtForCid(id, earliest * 1000);
        } else {
          // worst-case fallback: "now" (prevents NaN / weird UI)
          saveMatchedAtForCid(id, Date.now());
        }
      }

      try {
        markReadWS();
      } catch {}
      api.markRead(id).catch(() => {});

      // clear unread for this convo locally
      setConvos((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));

      // Keep calling your backend status if it exists, but UI doesn't depend on it anymore.
      try {
        const st = await api.matchFeedbackStatus(id);
        if (openSeq.current !== seq) return;

        // If backend returns my_response, reflect it in UI + pin it
        const my = (st as any)?.my_response;
        if (my === true) savePinnedForCid(id, "yes");
        else if (my === false) savePinnedForCid(id, "no");

        // We'll still respect should_prompt if you ever implement it,
        // but even if false, the pinned badge + cooldown still work.
        setShowFeedbackPrompt(!!(st as any).should_prompt);
      } catch {
        if (openSeq.current !== seq) return;
        // UI-only: show prompt anytime if user hasn't picked yet
        const v = safeGetLS(LS_FEEDBACK_PREFIX + id);
        const hasPicked = v === "yes" || v === "no";
        setShowFeedbackPrompt(!hasPicked);
      }

      try {
        const urls = await api.conversationPhotos(id);
        if (openSeq.current !== seq) return;
        setUnlockedPhotos(urls);
      } catch {
        if (openSeq.current !== seq) return;
        setUnlockedPhotos(null);
      }
    } finally {
      if (openingChatIdRef.current === id) {
        window.setTimeout(() => setOpeningChat(false), 120);
      }
    }
  }

  async function submitFeedback() {
    if (!activeId || feedbackChoice === "") return;

    // pin immediately (UI memory)
    savePinnedForCid(activeId, feedbackChoice);

    setFeedbackSaving(true);
    try {
      const res = await api.submitMatchFeedback(activeId, feedbackChoice === "yes");
      setShowFeedbackPrompt(false);

      if ((res as any).photos_unlocked) {
        const urls = await api.conversationPhotos(activeId);
        setUnlockedPhotos(urls);
      }
    } catch (e) {
      console.error(e);
      // still keep the UI pin (that's what you wanted)
      alert("Could not save your answer. Try again.");
    } finally {
      setFeedbackSaving(false);
    }
  }

  async function send() {
    if (!message.trim() || !activeId || sending || openingChat) return;
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

    // you sent a message => stop partner typing indicator
    stopPartnerTyping();

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
      stopPartnerTyping();
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
      setMatchAllowed(!!(st as any).eligible);
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
    // UI-only lock: 3 chats max
    if (atChatLimit) {
      alert(`You already have ${MAX_ACTIVE_CHATS} active chats. End a chat to get a new match.`);
      return;
    }

    if (matchLoading) return;

    matchStartedAtRef.current = Date.now();
    setMatchModalOpen(true);
    setMatchLoading(true);

    try {
      const res: MatchResponse = await api.match();

      if ((res as any).status === "matched") {
        setNoMatch(false);

        const updated = (await api.conversations()) as any as ConversationRow[];
        setConvos(updated);

        if ((res as any).conversation_id) {
          const cid = (res as any).conversation_id as string;

          setActiveId(cid);

          // store matchedAt as "now" immediately for cooldown UI,
          // then openConversation will refine using earliest message ts.
          saveMatchedAtForCid(cid, Date.now());

          openingChatIdRef.current = cid;
          setOpeningChat(true);

          const rawMsgs = (await api.thread(cid)) as any;
          const msgs = normalizeThread(rawMsgs);
          setThread(msgs as any);

          api.trackEvent({ event_name: "match_opened", conversation_id: cid }).catch(() => {});

          // load pinned feedback
          loadPinnedForCid(cid);

          try {
            const st = await api.matchFeedbackStatus(cid);
            setShowFeedbackPrompt(!!(st as any).should_prompt);
            const my = (st as any)?.my_response;
            if (my === true) savePinnedForCid(cid, "yes");
            else if (my === false) savePinnedForCid(cid, "no");
          } catch {
            // show prompt if no pin exists
            const v = safeGetLS(LS_FEEDBACK_PREFIX + cid);
            setShowFeedbackPrompt(!(v === "yes" || v === "no"));
          }

          try {
            const urls = await api.conversationPhotos(cid);
            setUnlockedPhotos(urls);
          } catch {
            setUnlockedPhotos(null);
          } finally {
            window.setTimeout(() => setOpeningChat(false), 120);
          }
        }

        await refreshMatchStatus();
      } else if ((res as any).status === "ineligible") {
        setNoMatch(false);
        await refreshMatchStatus();
      } else if ((res as any).status === "no_match") {
        setNoMatch(true);
        setMatchStatus((prev) => ({
          ...((prev as any) || { eligible: true }),
          reason: "No compatible match found right now.",
          missing: [],
        }));
      } else {
        setNoMatch(false);
        setMatchStatus((prev) => ({
          ...((prev as any) || { eligible: false }),
          eligible: false,
          reason: "Unexpected response.",
          missing: ["Unexpected response."],
        }));
      }
    } catch (err) {
      setNoMatch(false);
      console.error(err);
      setMatchStatus((prev) => ({
        ...((prev as any) || { eligible: false }),
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

  useEffect(() => {
    if (!openingChat) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread, activeId, openingChat, partnerTyping]);

  const hasAnyConvos = convos.length > 0;

  const hasBlockingReasons = !canMatch || (matchStatus && !(matchStatus as any).eligible);
  const showTopMatchButton = !hasBlockingReasons;

  const showCuratingModal = matchModalOpen || matchLoading;

  // ✅ REMOVE “Active now”: only keep last active + typing
  const activeLastActive = active?.partnerLastActive ? fmtTs(active.partnerLastActive) : "—";

  // ✅ scrollbar styling without plugins
  const scrollNice =
    "overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.6)_transparent] " +
    "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent " +
    "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/70 " +
    "dark:[&::-webkit-scrollbar-thumb]:bg-slate-700/70 " +
    "[&::-webkit-scrollbar-thumb:hover]:bg-slate-300/90 dark:[&::-webkit-scrollbar-thumb:hover]:bg-slate-600/80";

  // -------- Photos locked cooldown (UI-only) --------
  const activeMatchedAtMs = useMemo(() => {
    if (!activeId) return null;

    // best: conv row provides matchedAt
    const msFromRow = parseIsoOrNull((active as any)?.matchedAt);
    if (msFromRow) {
      // keep cached
      saveMatchedAtForCid(activeId, msFromRow);
      return msFromRow;
    }

    // fallback: localStorage cached
    const cached = matchedAtMsByCid[activeId];
    if (cached) return cached;

    // fallback: try LS read
    const ls = loadMatchedAtForCid(activeId);
    if (ls) return ls;

    // fallback: earliest message in current thread
    const earliest = thread
      .map((m) => Number((m as any).ts))
      .filter((x) => Number.isFinite(x) && x > 0)
      .sort((a, b) => a - b)[0];
    if (earliest) {
      const ms = earliest * 1000;
      saveMatchedAtForCid(activeId, ms);
      return ms;
    }

    return null;
  }, [activeId, active, thread, matchedAtMsByCid, loadMatchedAtForCid, saveMatchedAtForCid]);

  const photoUnlockAtMs = useMemo(() => {
    if (!activeMatchedAtMs) return null;
    return activeMatchedAtMs + PHOTO_UNLOCK_HOURS * 3600 * 1000;
  }, [activeMatchedAtMs]);

  const photoRemainingMs = useMemo(() => {
    if (!photoUnlockAtMs) return null;
    return Math.max(0, photoUnlockAtMs - now);
  }, [photoUnlockAtMs, now]);

  const photoCountdown = useMemo(() => {
    if (photoRemainingMs == null) return null;
    return msToClock(photoRemainingMs);
  }, [photoRemainingMs]);

  const photosShouldBeUnlockedByTime = photoRemainingMs != null && photoRemainingMs === 0;

  // ✅ FIX: when the timer hits 0, auto-show the Yes/No prompt (unless already answered)
  useEffect(() => {
    if (!activeId) return;

    // already answered => never show prompt
    const pin = pinnedFeedback[activeId];
    if (pin === "yes" || pin === "no") return;

    // only once time passed
    if (!photosShouldBeUnlockedByTime) return;

    // don't spam updates
    if (showFeedbackPrompt) return;

    setShowFeedbackPrompt(true);
  }, [activeId, pinnedFeedback, photosShouldBeUnlockedByTime, showFeedbackPrompt]);

  // -----------------------------------------------

  const photosSummary = useMemo(() => {
    const n = unlockedPhotos?.length ?? 0;
    if (n > 0) return `Unlocked photos: ${n}`;
    if (photoCountdown) return photosShouldBeUnlockedByTime ? "Time passed" : `Unlocks in ${photoCountdown}`;
    return "Photos locked";
  }, [unlockedPhotos, photoCountdown, photosShouldBeUnlockedByTime]);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-50 transition-colors duration-300">
      {/* site visit loader */}
      <BootLoadingOverlay open={bootLoading} />

      <MatchFindingModal open={showCuratingModal} startedAt={matchStartedAtRef.current} />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-0 right-0 mx-auto h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,140,248,0.25),_transparent_60%)] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,_rgba(244,114,182,0.18),_transparent_60%)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        <AppHeader />

        <main className="flex-1 py-6">
          <div className="grid h-[72vh] gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.95fr)]">
            {/* LEFT */}
            <aside className="flex h-[72vh] min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/30">
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
                      {atChatLimit ? (
                        <span>
                          Limit reached: {MAX_ACTIVE_CHATS} active chats. End one to match again.
                        </span>
                      ) : canMatch ? (
                        <span>You’re eligible for a new match now.</span>
                      ) : nextEligibleAt ? (
                        <span>Next curated match in {countdown}.</span>
                      ) : (
                        <span>Matching is currently unavailable.</span>
                      )}
                    </div>

                    <MatchBlockers status={matchStatus} align="left" />
                    {noMatch && <NoMatchBanner />}
                  </div>

                  {showTopMatchButton && (
                    <button
                      onClick={getNewMatch}
                      disabled={matchLoading || atChatLimit}
                      className={
                        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium " +
                        (matchLoading
                          ? "bg-slate-200 text-slate-500 cursor-wait dark:bg-slate-800 dark:text-slate-400"
                          : atChatLimit
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
                          : "bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 text-white shadow-sm hover:brightness-110")
                      }
                      title={
                        matchLoading
                          ? "Matching..."
                          : atChatLimit
                          ? `Max ${MAX_ACTIVE_CHATS} chats reached`
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

              {/* ✅ ONLY scrolling part on the left */}
              <div className={`mt-4 flex-1 min-h-0 space-y-1 pr-1 ${scrollNice}`}>
                {filtered.map((c) => {
                  const isActive = activeId === c.id;
                  const isMenuOpen = menuFor === c.id;

                  const pin = pinnedFeedback[c.id];

                  return (
                    <div
                      key={c.id}
                      className={`flex items-start gap-2 rounded-2xl px-2 py-2 transition ${
                        isActive
                          ? "bg-indigo-50/80 ring-1 ring-indigo-200 dark:bg-indigo-950/40 dark:ring-indigo-800/60"
                          : "hover:bg-slate-50/80 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <button
                        onClick={() => openConversation(c.id)}
                        className="flex flex-1 items-start gap-3 text-left"
                      >
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-indigo-500 via-violet-500 to-rose-500 text-xs font-semibold text-white">
                          {c.partnerName?.substring(0, 1) ?? "?"}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">
                              {c.partnerName}
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
                          </div>

                          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            {typeof c.compatibility === "number" && (
                              <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                <Star className="h-3 w-3 text-rose-500" />
                                <span>{Math.round((c.compatibility || 0) * 100)}%</span>
                              </div>
                            )}

                            {pin && (
                              <span
                                className={
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                                  (pin === "yes"
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200")
                                }
                                title="Your feedback"
                              >
                                You: {pin === "yes" ? "Yes" : "No"}
                              </span>
                            )}

                            {c.unread ? (
                              <span className="ml-auto inline-flex rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                                {c.unread}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>

                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuFor(isMenuOpen ? null : c.id);
                          }}
                          onWheel={(e) => e.stopPropagation()}
                          className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          title="More options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        <AnimatePresence>
                          {isMenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 6, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 6, scale: 0.98 }}
                              transition={{ duration: 0.14 }}
                              onWheel={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-10 z-30 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuFor(null);
                                  setReportOpen({ cid: c.id, partnerName: c.partnerName });
                                  setReportReason("");
                                  setReportDetails("");
                                }}
                                className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/60"
                              >
                                Report
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  endChat(c.id);
                                }}
                                className="w-full px-4 py-2.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
                              >
                                End chat
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}

                {filtered.length === 0 && (
                  <div className="flex flex-col items-center px-4 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    <MessageSquareHeart className="mb-2 h-6 w-6 text-indigo-500 dark:text-indigo-300" />
                    <div className="text-sm text-slate-700 dark:text-slate-200">
                      No conversations yet.
                    </div>

                    <div className="mt-3">
                      <button
                        onClick={getNewMatch}
                        disabled={matchLoading || !canMatch || atChatLimit}
                        className={
                          "inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium " +
                          (matchLoading
                            ? "bg-slate-200 text-slate-500 cursor-wait dark:bg-slate-800 dark:text-slate-400"
                            : atChatLimit
                            ? "bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
                            : !canMatch
                            ? "bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
                            : "bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 text-white shadow-sm hover:brightness-110")
                        }
                      >
                        {matchLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
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

            {/* RIGHT */}
            <section className="relative flex h-[72vh] min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/80 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/30">
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
                              {atChatLimit ? (
                                <span>
                                  Limit reached: {MAX_ACTIVE_CHATS} active chats. End one to match
                                  again.
                                </span>
                              ) : canMatch ? (
                                <span>You can request a new match now.</span>
                              ) : nextEligibleAt ? (
                                <span>Next curated match in {countdown}.</span>
                              ) : (
                                <span>Matching is currently unavailable.</span>
                              )}
                            </div>

                            <MatchBlockers status={matchStatus} align="left" />
                            {noMatch && <NoMatchBanner />}
                          </div>

                          <button
                            onClick={getNewMatch}
                            disabled={matchLoading || !canMatch || atChatLimit}
                            className={
                              "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-medium " +
                              (matchLoading
                                ? "bg-slate-200 text-slate-500 cursor-wait dark:bg-slate-800 dark:text-slate-400"
                                : atChatLimit
                                ? "bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
                                : !canMatch
                                ? "bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
                                : "bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 text-white shadow-sm hover:brightness-110")
                            }
                          >
                            {matchLoading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Plus className="h-3.5 w-3.5" />
                            )}
                            <span>New match</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-sm text-slate-600 dark:text-slate-300">
                        <MessageSquareHeart className="mx-auto h-10 w-10 text-indigo-500 dark:text-indigo-300" />
                        <p className="mt-3">No conversations yet. Try creating your first match.</p>
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
                  <AnimatePresence>
                    {openingChat && (
                      <motion.div
                        className="absolute inset-0 z-20 grid place-items-center bg-white/55 backdrop-blur-sm dark:bg-slate-950/40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading chat…
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/80">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold text-slate-900 dark:text-slate-50">
                          {active?.partnerName}
                        </span>

                        {typeof (active as any)?.compatibility === "number" && (
                          <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
                            {Math.round(((active as any).compatibility || 0) * 100)}% match
                          </span>
                        )}

                        {/* ✅ pinned feedback next to name */}
                        {pinnedForActive && (
                          <span
                            className={
                              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold " +
                              (pinnedForActive === "yes"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200")
                            }
                            title="Your feedback"
                          >
                            You: {pinnedForActive === "yes" ? "Yes" : "No"}
                          </span>
                        )}
                      </div>

                      {/* ✅ last active + typing (no Active now) */}
                      <div className="mt-0.5 flex items-center gap-3 text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">
                          Last active: {activeLastActive}
                        </span>

                        {partnerTyping && (
                          <span className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Typing…
                          </span>
                        )}
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
                          onChange={(e) => {
                            const v = e.target.value as any as "" | "yes" | "no";
                            setFeedbackChoice(v);

                            // ✅ pin as soon as user selects (so you remember even before submit)
                            if (activeId && (v === "yes" || v === "no")) {
                              savePinnedForCid(activeId, v);
                            }
                          }}
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

                      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {PHOTO_UNLOCK_NOTE}
                      </div>
                    </div>
                  )}

                  {/* ✅ Foldable photos section (saves space) */}
                  {active && (
                    <div className="mx-4 mt-3">
                      <button
                        type="button"
                        onClick={() => setPhotosExpanded((v) => !v)}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-left text-xs text-slate-700 shadow-sm hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900/80"
                        aria-expanded={photosExpanded}
                        aria-controls="photos-panel"
                        title={photosExpanded ? "Collapse" : "Expand"}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="grid h-7 w-7 place-items-center rounded-xl bg-slate-100/80 dark:bg-slate-800/60">
                            <ShieldCheck className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-900 dark:text-slate-50">
                              Photos
                            </div>
                            <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                              {photosSummary}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* compact pill (still visible even collapsed) */}
                          {photoCountdown && (!unlockedPhotos || unlockedPhotos.length === 0) && (
                            <span
                              className={
                                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                                (photosShouldBeUnlockedByTime
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200")
                              }
                              title="Time remaining"
                            >
                              {photosShouldBeUnlockedByTime ? "Time passed" : `Unlocks in ${photoCountdown}`}
                            </span>
                          )}

                          <motion.span
                            animate={{ rotate: photosExpanded ? 180 : 0 }}
                            transition={{ duration: 0.18 }}
                            className="grid h-7 w-7 place-items-center rounded-xl bg-slate-100/70 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </motion.span>
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {photosExpanded && (
                          <motion.div
                            id="photos-panel"
                            initial={{ height: 0, opacity: 0, y: -4 }}
                            animate={{ height: "auto", opacity: 1, y: 0 }}
                            exit={{ height: 0, opacity: 0, y: -4 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            {unlockedPhotos && unlockedPhotos.length > 0 ? (
                              <div className={`mt-2 flex gap-2 overflow-x-auto pb-1 ${scrollNice}`}>
                                {unlockedPhotos.map((u) => (
                                  <button
                                    key={u}
                                    type="button"
                                    onClick={() => setPhotoViewerUrl(u)}
                                    className="shrink-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    title="Open photo"
                                  >
                                    <img
                                      src={u}
                                      className="h-24 w-24 rounded-2xl object-cover"
                                      alt="Unlocked"
                                      loading="lazy"
                                    />
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                                <div className="flex items-start gap-2">
                                  <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-xl bg-white/70 shadow-sm dark:bg-slate-950/60">
                                    <ShieldCheck className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="font-semibold">Photos locked</div>

                                      {/* ✅ countdown pill */}
                                      {photoCountdown && (
                                        <span
                                          className={
                                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                                            (photosShouldBeUnlockedByTime
                                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200")
                                          }
                                          title="Time remaining"
                                        >
                                          {photosShouldBeUnlockedByTime
                                            ? "Time passed"
                                            : `Unlocks in ${photoCountdown}`}
                                        </span>
                                      )}
                                    </div>

                                    <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                      {PHOTO_UNLOCK_NOTE}
                                    </div>

                                    {/* ✅ tiny progress bar (optional, looks good) */}
                                    {activeMatchedAtMs && photoUnlockAtMs && (
                                      <div className="mt-2">
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/60 dark:bg-white/10">
                                          <motion.div
                                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500"
                                            initial={false}
                                            animate={{
                                              width: `${Math.max(
                                                0,
                                                Math.min(
                                                  100,
                                                  ((now - activeMatchedAtMs) /
                                                    (photoUnlockAtMs - activeMatchedAtMs)) *
                                                    100
                                                )
                                              )}%`,
                                            }}
                                            transition={{ duration: 0.25 }}
                                          />
                                        </div>
                                        <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                                          {photosShouldBeUnlockedByTime
                                            ? "24 hours passed. Still requires mutual consent."
                                            : "Countdown is time-based. Consent still required."}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* ✅ main scrolling thread area */}
                  <div className={`flex-1 min-h-0 space-y-3 px-4 py-4 ${scrollNice}`}>
                    {thread.map((m) => {
                      const ts = fmtMsgTimeFromSec((m as any).ts);

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

                              {ts && (
                                <div className="mt-2 text-right text-[10px] text-slate-500/80 dark:text-slate-300/60">
                                  {ts}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      }

                      const isMe = (m as any).role === "me";

                      return (
                        <motion.div
                          key={(m as any).id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                              isMe
                                ? "bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 text-white"
                                : "border border-slate-200/70 bg-white/85 text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.06)] dark:border-slate-700/60 dark:bg-slate-900/65 dark:text-slate-50"
                            }`}
                          >
                            <div className="whitespace-pre-wrap">{(m as any).text}</div>

                            {ts && (
                              <div
                                className={`mt-1 text-[10px] ${
                                  isMe ? "text-white/75" : "text-slate-500 dark:text-slate-300/70"
                                }`}
                                style={{ textAlign: "right" }}
                              >
                                {ts}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* ✅ typing bubble (other person) */}
                    <AnimatePresence>
                      {partnerTyping && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          className="flex justify-start"
                        >
                          <div className="max-w-[60%] rounded-2xl border border-slate-200/70 bg-white/85 px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.06)] dark:border-slate-700/60 dark:bg-slate-900/65">
                            <TypingDots />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div ref={bottomRef} />
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
                      disabled={openingChat}
                    />
                    <button
                      type="submit"
                      disabled={sending || openingChat}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-60"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <SendHorizontal className="h-4 w-4" />
                      )}
                      Send
                    </button>
                  </form>

                  <div className="px-4 pb-3 text-[11px] text-slate-400 dark:text-slate-500">
                    WS status: {wsStatus}
                  </div>
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
