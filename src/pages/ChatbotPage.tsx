// src/pages/ChatbotPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  ChevronRight,
  ShieldCheck,
  Brain,
  HelpCircle,
  Lock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { api } from "../lib/api";

import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";
import Skeleton from "../components/Skeleton";

type ChatPhase = "self" | "pref" | "done";

type HistoryProgress = {
  answered?: number;
  total?: number;
  self_total?: number;
  pref_total?: number;
  self_answered?: number;
  pref_answered?: number;
  threshold?: number;
};

const STARTED_KEY = "lm_assessment_started_v2";
const ATTEMPT_KEY = "lm_assessment_attempt_id_v1";
const PHASE1_POPUP_SHOWN_KEY = "lm_phase1_congrats_shown_v1";
const LAST_UID_KEY = "lm_last_uid_v1";

/** Supports dynamic IDs (B1_S, B2_P, etc.) */
const MCQ_TAG_RE = /\[\[mcq:([A-Z0-9_]+)\]\]/g;
/** Prevents the base64url config blob from leaking into UI. */
const MCQCFG_TAG_RE = /\[\[mcqcfg:([A-Za-z0-9_-]+)\]\]/g;
/** Freeform tag (ideal match) */
const FREEFORM_TAG_RE = /\[\[freeform:ideal_match\]\]/g;

function stripMcqArtifacts(text: string) {
  return (text || "")
    .replace(MCQ_TAG_RE, "")
    .replace(MCQCFG_TAG_RE, "")
    .replace(FREEFORM_TAG_RE, "")
    .trim();
}

function extractMcqId(text: string): string | null {
  const m = (text || "").match(/\[\[mcq:([A-Z0-9_]+)\]\]/);
  return m?.[1] ?? null;
}

function isFreeformPrompt(text: string) {
  return FREEFORM_TAG_RE.test(text || "");
}

function isMcqPrompt(text: string) {
  const t = text || "";
  return (
    /\nA\)\s+/m.test(t) &&
    /\nB\)\s+/m.test(t) &&
    /\nC\)\s+/m.test(t) &&
    /\nD\)\s+/m.test(t)
  );
}

type ParsedMcq = {
  question: string;
  options: { key: "A" | "B" | "C" | "D"; text: string }[];
};

function parseMcq(text: string): ParsedMcq | null {
  const cleaned = stripMcqArtifacts(text);
  if (!isMcqPrompt(cleaned)) return null;

  const lines = cleaned
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !l.startsWith("[[mcqcfg:"));

  const optionRegex = /^([ABCD])\)\s*(.+)$/;
  const optMap: Record<string, string> = {};
  const questionLines: string[] = [];

  for (const line of lines) {
    const m = line.match(optionRegex);
    if (m) {
      optMap[m[1]] = m[2];
      continue;
    }
    if (/^Reply with/i.test(line)) continue;
    questionLines.push(line);
  }

  const question = questionLines[0] || "Quick question:";
  const options: ParsedMcq["options"] = (["A", "B", "C", "D"] as const)
    .filter((k) => optMap[k])
    .map((k) => ({ key: k, text: optMap[k] }));

  if (options.length < 4) return null;
  return { question, options };
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function phaseName(p: ChatPhase) {
  if (p === "self") return "Phase 1 : About you";
  if (p === "pref") return "Phase 2 : Preferences";
  if (p === "done") return "Complete";
  return "Assessment";
}

function phaseBlurb(p: ChatPhase) {
  if (p === "self") return "We’re building a stable read on your personality.";
  if (p === "pref") return "Now we lock what actually matters to you in a match.";
  if (p === "done") return "You’re fully profiled. You can update anytime.";
  return "Short. Focused. Saved automatically.";
}

function easeOutCubic(t: number) {
  const x = clamp(t, 0, 1);
  return 1 - Math.pow(1 - x, 3);
}

function ConfirmModal({
  open,
  title,
  subtitle,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="confirm-modal"
          className="fixed inset-0 z-[80] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/45"
            onClick={onCancel}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.985 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="relative w-full max-w-md rounded-3xl border border-white/20 bg-white/92 p-6 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/92"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500/85 via-violet-500/85 to-rose-500/85 shadow-sm shadow-indigo-400/15">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {title}
                </div>
                {subtitle ? (
                  <div className="mt-1 text-[12px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {subtitle}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onConfirm}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500/85 via-violet-500/85 to-rose-500/85 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-400/15 hover:brightness-105"
              >
                {confirmText} <CheckCircle2 className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-200/30 backdrop-blur hover:bg-white dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-200 dark:shadow-black/20 dark:hover:bg-slate-950/45"
              >
                {cancelText}
              </button>
            </div>

            <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
              You can’t go back after confirming.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CongratsModal({
  open,
  onContinue,
}: {
  open: boolean;
  onContinue: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="congrats-modal"
          className="fixed inset-0 z-[75] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.985 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative w-full max-w-md rounded-3xl border border-white/20 bg-white/92 p-6 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/92"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500/85 via-fuchsia-500/85 to-indigo-500/85 shadow-sm shadow-rose-400/15">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Phase 1 completed 🎉
                </div>
                <div className="mt-1 text-[12px] text-slate-600 dark:text-slate-300">
                  Congrats — now you’re in the final phase (Preferences).
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onContinue}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500/85 via-violet-500/85 to-rose-500/85 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-400/15 hover:brightness-105"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ProgressHeader({
  phase,
  bubblesCount,
}: {
  phase: ChatPhase;
  bubblesCount: number;
}) {
  const bubbles = Array.from({ length: Math.max(0, bubblesCount) });
  const isSelfActive = phase === "self";
  const isPrefActive = phase === "pref";

  const bubbleClass = (p: ChatPhase) => {
    if (p === "self") {
      return isSelfActive
        ? "bg-gradient-to-r from-indigo-500/75 via-violet-500/75 to-rose-500/75 shadow-[0_0_0_4px_rgba(129,140,248,0.10)]"
        : "bg-slate-300/70 dark:bg-slate-700/70";
    }
    if (p === "pref") {
      return isPrefActive
        ? "bg-gradient-to-r from-rose-500/75 via-fuchsia-500/70 to-indigo-500/70 shadow-[0_0_0_4px_rgba(244,114,182,0.10)]"
        : "bg-slate-300/70 dark:bg-slate-700/70";
    }
    return "bg-slate-300/70 dark:bg-slate-700/70";
  };

  return (
    <div className="border-b border-slate-200/70 px-4 py-4 dark:border-slate-800/70 sm:px-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-500/75 dark:text-indigo-300/75">
            Progress
          </div>
          <span className="rounded-full border border-slate-200/70 bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-slate-600 shadow-sm shadow-slate-200/20 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/30 dark:text-slate-300 dark:shadow-black/20">
            1–5 mins per phase
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-label="Progress bubbles">
          <AnimatePresence initial={false}>
            {bubbles.map((_, i) => (
              <motion.span
                key={`${phase}-${i}`}
                initial={{ opacity: 0, scale: 0.7, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7, y: -6 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className={["h-2.5 w-2.5 rounded-full transition", bubbleClass(phase)].join(
                  " "
                )}
              />
            ))}
          </AnimatePresence>

          {bubblesCount <= 0 ? (
            <span className="text-[12px] text-slate-500 dark:text-slate-400">
              Answer the first question to start building your profile.
            </span>
          ) : null}
        </div>

        <div className="mt-2 text-[12px] text-slate-600 dark:text-slate-300">
          {phaseName(phase)} • {phaseBlurb(phase)}
        </div>
      </div>
    </div>
  );
}

function CalmProgressLoader({
  label = "Saving your answer…",
  percent,
  done,
}: {
  label?: string;
  percent: number;
  done: boolean;
}) {
  const p = done ? 100 : clamp(percent, 0, 99);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200/45 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-black/35">
      <div className="mb-2 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-[12px] font-medium text-slate-700 dark:text-slate-200">
          <Loader2 className="h-4 w-4 animate-spin text-slate-500 dark:text-slate-400" />
          {label}
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          {done ? "Saved" : `${Math.round(p)}%`}
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-400/70 via-violet-400/70 to-rose-400/70 transition-[width] duration-100 ease-linear"
          style={{ width: `${p}%` }}
        />
      </div>
    </div>
  );
}

// ✅ icons are back, title centered, icon pinned
function SidebarTallCard({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="relative flex flex-1 items-center rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-black/35">
      <div className="absolute left-5 top-1/2 -translate-y-1/2">
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200/70 bg-white/70 shadow-sm shadow-slate-200/20 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/30 dark:shadow-black/20">
          <span className="[&>svg]:h-5 [&>svg]:w-5 [&>svg]:shrink-0">{icon}</span>
        </div>
      </div>

      <div className="w-full px-14">
        <h2 className="text-center text-sm font-semibold text-slate-900 dark:text-slate-50">
          {title}
        </h2>
      </div>
    </div>
  );
}

type PendingConfirm =
  | { kind: "mcq"; key: "A" | "B" | "C"; label: string }
  | { kind: "other"; text: string };

export default function ChatbotPage() {
  const navigate = useNavigate();

  const assessmentCompletedRef = useRef(false);
  const isSendingRef = useRef(false);
  const prevPhaseRef = useRef<ChatPhase>("self");

  // ✅ per-account scoping: get a stable UID
  const [uid, setUid] = useState<string>("anon");
  const [uidReady, setUidReady] = useState(false);

  const scopedKey = useMemo(() => {
    const safe = (uid || "anon").trim() || "anon";
    return (base: string) => `${base}::${safe}`;
  }, [uid]);

  // ✅ determine current user id (safe: won't break TS if api shape differs)
  useEffect(() => {
    let cancelled = false;

    async function resolveUid() {
      const apiAny = api as any;
      let next = "anon";

      try {
        // preferred: api.me()
        if (typeof apiAny.me === "function") {
          const me = await apiAny.me();
          next = (me?.id || me?.user_id || me?.uid || "anon") as string;
        } else if (typeof apiAny.getMe === "function") {
          const me = await apiAny.getMe();
          next = (me?.id || me?.user_id || me?.uid || "anon") as string;
        } else if (typeof apiAny.profile === "function") {
          const p = await apiAny.profile();
          next = (p?.id || p?.user_id || "anon") as string;
        } else if (typeof apiAny.getProfile === "function") {
          const p = await apiAny.getProfile();
          next = (p?.id || p?.user_id || "anon") as string;
        }
      } catch {
        // if not logged in / request fails -> anon
      }

      if (cancelled) return;

      next = (next || "anon").toString();
      const prev = localStorage.getItem(LAST_UID_KEY) || "anon";

      // if account changed, just switch scope (no global clears needed)
      localStorage.setItem(LAST_UID_KEY, next);

      setUid(next);
      setUidReady(true);

      // ✅ re-read started state for this account
      const started = localStorage.getItem(`${STARTED_KEY}::${next}`) === "1";
      setHasStarted(started);

      // also reset local-only bubbles when user changes
      if (prev !== next) {
        setSelfBubbles(0);
        setPrefBubbles(0);
        setPhase("self");
        prevPhaseRef.current = "self";
        assessmentCompletedRef.current = false;
        setCurrentAssistantText(
          "Hi — I’ll ask some quick questions. Tap one option (or write one sentence for “Other”). Your progress is saved."
        );
      }
    }

    resolveUid();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ hasStarted must be scoped per uid, not global
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [starting, setStarting] = useState(false);

  const [phase, setPhase] = useState<ChatPhase>("self");
  const [, setServerProgress] = useState<HistoryProgress | null>(null);

  const [selfBubbles, setSelfBubbles] = useState(0);
  const [prefBubbles, setPrefBubbles] = useState(0);

  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingNext, setIsLoadingNext] = useState(false);

  const [showLoader, setShowLoader] = useState(false);
  const [saveDone, setSaveDone] = useState(false);
  const [savePercent, setSavePercent] = useState(0);

  const [selectedOption, setSelectedOption] = useState<"A" | "B" | "C" | "D" | null>(
    null
  );

  const [currentAssistantText, setCurrentAssistantText] = useState<string>(
    "Hi — I’ll ask some quick questions. Tap one option (or write one sentence for “Other”). Your progress is saved."
  );

  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [freeformText, setFreeformText] = useState("");

  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPhase1Congrats, setShowPhase1Congrats] = useState(false);

  // ✅ wait for uidReady so localStorage scoping is correct
  useEffect(() => {
    if (!uidReady) return;

    let cancelled = false;

    async function loadHistory() {
      try {
        const data = await api.chatbotHistory();
        if (cancelled) return;

        if (data?.phase) {
          const newPhase = data.phase as ChatPhase;
          setPhase(newPhase);
          prevPhaseRef.current = newPhase;
        }

        if (data?.progress) setServerProgress(data.progress);

        const msgs: any[] = data?.messages || [];
        const lastAssistant = [...msgs].reverse().find((m) => m.role === "assistant");
        if (lastAssistant?.content) {
          setCurrentAssistantText(lastAssistant.content);

          // ✅ started flag is per-account
          setHasStarted(true);
          localStorage.setItem(scopedKey(STARTED_KEY), "1");
        }

        if (data?.phase === "done" && !assessmentCompletedRef.current) {
          assessmentCompletedRef.current = true;
          api.trackEvent({
            event_name: "assessment_completed",
            properties: { source: "history_phase_done" },
          });
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [uidReady, scopedKey]);

  const isFreeform = useMemo(
    () => isFreeformPrompt(currentAssistantText),
    [currentAssistantText]
  );
  const parsedMcq = useMemo(() => parseMcq(currentAssistantText), [currentAssistantText]);
  const mcqId = useMemo(
    () => extractMcqId(currentAssistantText) || "mcq",
    [currentAssistantText]
  );

  useEffect(() => {
    setSelectedOption(null);
    setShowOtherInput(false);
    setOtherText("");
    setFreeformText("");
    setPendingConfirm(null);
    setShowConfirm(false);
  }, [mcqId]);

  useEffect(() => {
    if (!isLoadingNext) {
      setShowLoader(false);
      return;
    }
    const t = window.setTimeout(() => setShowLoader(true), 160);
    return () => window.clearTimeout(t);
  }, [isLoadingNext]);

  useEffect(() => {
    if (!isLoadingNext) {
      setSavePercent(0);
      return;
    }

    const TOTAL_MS = 8_000;
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const t = clamp(elapsed / TOTAL_MS, 0, 1);
      const eased = easeOutCubic(t) * 100;

      setSavePercent((prev) => {
        const next = Math.max(prev, eased);
        return next >= 99 ? 99 : next;
      });
    };

    tick();
    const id = window.setInterval(tick, 80);
    return () => window.clearInterval(id);
  }, [isLoadingNext]);

  async function onPressOk() {
    if (starting) return;
    setStarting(true);
    try {
      let attemptId: string | null = localStorage.getItem(scopedKey(ATTEMPT_KEY));
      if (!attemptId) {
        const start = await api.assessmentStart();
        attemptId = start.attempt_id;
        localStorage.setItem(scopedKey(ATTEMPT_KEY), attemptId);
      }

      api.trackEvent({
        event_name: "assessment_started",
        properties: { attempt_id: attemptId, source: "ok_button" },
      });

      localStorage.setItem(scopedKey(STARTED_KEY), "1");
      setHasStarted(true);

      await sendAnswer("ok");
    } finally {
      setStarting(false);
    }
  }

  async function sendAnswer(content: string) {
    const msg = (content || "").trim();
    if (!msg) return;
    if (isSendingRef.current) return;

    const phaseAtSend = phase;
    isSendingRef.current = true;
    setIsLoadingNext(true);
    setSaveDone(false);

    try {
      const res = await api.chatbotMessage(msg);

      if (res?.phase) {
        const newPhase = res.phase as ChatPhase;

        const prev = prevPhaseRef.current;

        // ✅ phase transition popup is now per-account
        if (
          prev === "self" &&
          newPhase === "pref" &&
          localStorage.getItem(scopedKey(PHASE1_POPUP_SHOWN_KEY)) !== "1"
        ) {
          setShowPhase1Congrats(true);
          localStorage.setItem(scopedKey(PHASE1_POPUP_SHOWN_KEY), "1");
        }

        prevPhaseRef.current = newPhase;
        setPhase(newPhase);

        if (newPhase === "done" && !assessmentCompletedRef.current) {
          assessmentCompletedRef.current = true;
          api.trackEvent({
            event_name: "assessment_completed",
            properties: { source: "chatbot_phase_done" },
          });
        }
      }

      if (res?.progress) setServerProgress((prev) => ({ ...(prev || {}), ...res.progress }));

      setSaveDone(true);
      setCurrentAssistantText(res?.reply || "");
    } catch {
      if (phaseAtSend === "self") setSelfBubbles((n) => Math.max(0, n - 1));
      else if (phaseAtSend === "pref") setPrefBubbles((n) => Math.max(0, n - 1));
      setCurrentAssistantText("Network error — try again.");
    } finally {
      window.setTimeout(() => {
        setIsLoadingNext(false);
        setSaveDone(false);
        setSavePercent(0);
        isSendingRef.current = false;
      }, 300);
    }
  }

  function openConfirmForMcq(key: "A" | "B" | "C", label: string) {
    if (isLoadingNext) return;
    setSelectedOption(key);
    setPendingConfirm({ kind: "mcq", key, label });
    setShowConfirm(true);
  }

  function onTapOther() {
    if (isLoadingNext) return;
    setSelectedOption("D");
    setShowOtherInput(true);
    setTimeout(() => {
      const el = document.getElementById("other-one-liner") as HTMLInputElement | null;
      el?.focus();
    }, 25);
  }

  function submitOther() {
    const txt = otherText.trim();
    if (!txt || isLoadingNext) return;

    setSelectedOption("D");
    setPendingConfirm({ kind: "other", text: `D ${txt}` });
    setShowConfirm(true);
  }

  function confirmPending() {
    if (!pendingConfirm) return;

    setShowConfirm(false);

    if (phase === "self") setSelfBubbles((n) => n + 1);
    else if (phase === "pref") setPrefBubbles((n) => n + 1);

    if (pendingConfirm.kind === "mcq") {
      void sendAnswer(pendingConfirm.key);
      return;
    }
    if (pendingConfirm.kind === "other") {
      void sendAnswer(pendingConfirm.text);
      return;
    }
  }

  function cancelPending() {
    setShowConfirm(false);
    setPendingConfirm(null);
    setSelectedOption(null);
  }

  function submitFreeform() {
    const txt = freeformText.trim();
    if (!txt || isLoadingNext) return;
    void sendAnswer(txt);
  }

  function skipFreeform() {
    if (isLoadingNext) return;
    void sendAnswer("skip");
  }

  const optionButtonClass = (isSelected: boolean) =>
    [
      "group relative rounded-2xl md:rounded-3xl border bg-white px-3 md:px-4 py-3 text-left shadow-sm transition disabled:opacity-60 dark:bg-slate-950/35 w-full",
      "border-slate-200 hover:border-indigo-200/70 hover:shadow-md dark:border-slate-800 dark:hover:border-indigo-500/25",
      isSelected
        ? "border-indigo-300/70 ring-2 ring-indigo-200/50 bg-indigo-50/40 dark:bg-indigo-500/10 dark:ring-indigo-400/20"
        : "",
    ].join(" ");

  const otherButtonClass = (isSelected: boolean) =>
    [
      "group relative rounded-2xl md:rounded-3xl border bg-white px-3 md:px-4 py-3 text-left shadow-sm transition disabled:opacity-60 dark:bg-slate-950/35 w-full",
      "border-slate-200 hover:border-rose-200/70 hover:shadow-md dark:border-slate-800 dark:hover:border-rose-400/20",
      isSelected
        ? "border-rose-300/60 ring-2 ring-rose-200/40 bg-rose-50/40 dark:bg-rose-500/10 dark:ring-rose-400/15"
        : "",
    ].join(" ");

  const freeformCard = (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.995 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="rounded-2xl md:rounded-3xl border border-slate-200 bg-white/90 p-3 md:p-5 shadow-sm shadow-slate-200/50 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/35"
    >
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-500/80 dark:text-rose-300/80">
          Optional
        </div>
        <div className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-50">
          {stripMcqArtifacts(currentAssistantText)}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <textarea
          value={freeformText}
          onChange={(e) => setFreeformText(e.target.value)}
          placeholder="Type anything…"
          rows={5}
          className="w-full rounded-3xl border border-slate-300 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-300/70 focus:ring-2 focus:ring-rose-100 dark:border-slate-700 dark:bg-slate-950/45 dark:text-slate-50 dark:focus:ring-rose-500/15"
          disabled={isLoadingNext}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={submitFreeform}
            disabled={isLoadingNext || !freeformText.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500/85 via-violet-500/85 to-rose-500/85 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-400/15 hover:brightness-105 disabled:opacity-60"
          >
            Send <ArrowRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={skipFreeform}
            disabled={isLoadingNext}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-200/30 backdrop-blur hover:bg-white disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-200 dark:shadow-black/20 dark:hover:bg-slate-950/45"
          >
            Skip
          </button>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          This shows once, right when preferences start.
        </div>
      </div>
    </motion.div>
  );

  const questionCard = parsedMcq ? (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.995 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="rounded-2xl md:rounded-3xl border border-slate-200 bg-white/90 p-3 md:p-5 shadow-sm shadow-slate-200/50 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/35"
    >
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-500/80 dark:text-indigo-300/80">
          Tap one
        </div>
        <div className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-50">
          {parsedMcq.question}
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {parsedMcq.options
          .filter((o) => o.key !== "D")
          .map((opt) => {
            const isSelected = selectedOption === opt.key;
            return (
              <motion.button
                key={opt.key}
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => openConfirmForMcq(opt.key as "A" | "B" | "C", opt.text)}
                disabled={isLoadingNext}
                className={optionButtonClass(isSelected)}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                  <div className="absolute -right-24 -top-24 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,140,248,0.12),_transparent_60%)] blur-2xl" />
                </div>

                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={[
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold",
                        isSelected
                          ? "bg-indigo-500/15 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-100"
                          : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-50",
                      ].join(" ")}
                    >
                      {opt.key}
                    </div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-50">
                      {opt.text}
                    </div>
                  </div>

                  {isSelected ? (
                    <CheckCircle2 className="mt-1 h-5 w-5 text-indigo-500/80 dark:text-indigo-300/80" />
                  ) : (
                    <ChevronRight className="mt-1 h-5 w-5 text-slate-400 transition group-hover:text-indigo-400/80 dark:group-hover:text-indigo-300/80" />
                  )}
                </div>
              </motion.button>
            );
          })}

        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.99 }}
          onClick={onTapOther}
          disabled={isLoadingNext}
          className={otherButtonClass(selectedOption === "D")}
        >
          <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
            <div className="absolute -left-24 -bottom-24 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,_rgba(244,114,182,0.10),_transparent_60%)] blur-2xl" />
          </div>

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={[
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold",
                  selectedOption === "D"
                    ? "bg-rose-500/12 text-rose-700 dark:bg-rose-500/18 dark:text-rose-100"
                    : "bg-rose-50 text-rose-600/80 dark:bg-rose-500/10 dark:text-rose-200/80",
                ].join(" ")}
              >
                D
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-50">
                  Write your own
                </div>
                <div className="text-[12px] text-slate-500 dark:text-slate-400">
                  One sentence is enough.
                </div>
              </div>
            </div>

            {selectedOption === "D" ? (
              <CheckCircle2 className="mt-1 h-5 w-5 text-rose-500/75 dark:text-rose-300/75" />
            ) : (
              <ChevronRight className="mt-1 h-5 w-5 text-slate-400 transition group-hover:text-rose-400/80 dark:group-hover:text-rose-300/80" />
            )}
          </div>
        </motion.button>

        <AnimatePresence>
          {showOtherInput && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              className="mt-1 overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-950/25"
            >
              <div className="flex gap-2">
                <input
                  id="other-one-liner"
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  placeholder="One sentence…"
                  className="flex-1 rounded-2xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 outline-none focus:border-rose-300/70 focus:ring-2 focus:ring-rose-100 dark:border-slate-700 dark:bg-slate-950/45 dark:text-slate-50 dark:focus:ring-rose-500/15"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitOther();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={submitOther}
                  disabled={isLoadingNext || !otherText.trim()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500/80 via-violet-500/80 to-rose-500/80 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-300/10 hover:brightness-105 disabled:opacity-60"
                >
                  Send <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
        Tip: choose the closest option. Don’t overthink it.
      </div>
    </motion.div>
  ) : (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.995 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="rounded-2xl md:rounded-3xl border border-slate-200 bg-white/90 p-3 md:p-5 shadow-sm shadow-slate-200/50 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/35"
    >
      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
        {stripMcqArtifacts(currentAssistantText)}
      </div>
    </motion.div>
  );

  const showMatchCta = phase === "done";

  const confirmTitle = useMemo(() => "Confirm your answer", []);
  const confirmSubtitle = useMemo(() => {
    if (!pendingConfirm) return "";
    if (pendingConfirm.kind === "mcq")
      return `You selected: ${pendingConfirm.key}) ${pendingConfirm.label}`;
    return `You wrote: ${pendingConfirm.text.replace(/^D\s*/, "")}`;
  }, [pendingConfirm]);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-50 transition-colors duration-300">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-28 left-0 right-0 mx-auto h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,140,248,0.14),_transparent_60%)] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,_rgba(244,114,182,0.12),_transparent_60%)] blur-3xl" />
      </div>

      <ConfirmModal
        open={showConfirm}
        title={confirmTitle}
        subtitle={confirmSubtitle}
        confirmText="Yes, confirm"
        cancelText="Change"
        onConfirm={confirmPending}
        onCancel={cancelPending}
      />

      <CongratsModal
        open={showPhase1Congrats}
        onContinue={() => setShowPhase1Congrats(false)}
      />

      {!isLoadingHistory && !hasStarted && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-md rounded-3xl border border-white/20 bg-white/92 p-6 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/92"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500/85 via-violet-500/85 to-rose-500/85 shadow-sm shadow-indigo-400/15">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">Start assessment</div>
                <div className="text-[12px] text-slate-600 dark:text-slate-300">
                  Saved automatically.
                </div>
              </div>
            </div>

            <button
              onClick={onPressOk}
              disabled={starting}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500/85 via-violet-500/85 to-rose-500/85 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-400/15 hover:brightness-105 disabled:opacity-60"
            >
              {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Start
            </button>
          </motion.div>
        </div>
      )}

      <div className="relative mx-auto flex min-h-screen max-w-6xl max-md:max-w-full flex-col px-4 max-md:px-3 sm:px-6 lg:px-8">
        <AppHeader />

        <main className="flex-1 pt-4 md:pt-6 pb-20 md:pb-10">
          <div className="grid items-stretch grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[1fr_340px]">
            <section className="h-full">
              <div className="h-full rounded-2xl md:rounded-3xl border border-slate-200 bg-white/90 shadow-sm shadow-slate-200/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-black/35">
                <ProgressHeader
                  phase={phase}
                  bubblesCount={
                    phase === "self"
                      ? selfBubbles
                      : phase === "pref"
                      ? prefBubbles
                      : selfBubbles + prefBubbles
                  }
                />

                <div className="px-3 py-4 sm:px-5 sm:py-5">
                  {isLoadingHistory ? (
                    <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-950/25 space-y-4">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="space-y-2 pt-2">
                        {[...Array(4)].map((_, i) => (
                          <Skeleton key={i} className="h-10 w-full" variant="rect" />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <AnimatePresence mode="wait">
                      <motion.div key={mcqId} layout>
                        {isFreeform ? freeformCard : questionCard}
                      </motion.div>
                    </AnimatePresence>
                  )}

                  {showMatchCta ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-5 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200/40 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                            Bio ready ✅
                          </div>
                          <div className="mt-1 text-[12px] text-slate-600 dark:text-slate-300">
                            You can start matching now.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate("/conversations")}
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500/85 via-violet-500/85 to-rose-500/85 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-400/15 hover:brightness-105"
                        >
                          Match now <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ) : null}
                </div>
              </div>
            </section>

            <aside className="hidden md:block h-full">
              <div className="flex h-full flex-col gap-4">
                <SidebarTallCard
                  icon={<Brain className="h-5 w-5 text-indigo-500/70 dark:text-indigo-300/70" />}
                  title="Answer fast. Match better."
                />
                <SidebarTallCard
                  icon={<HelpCircle className="h-5 w-5 text-rose-500/65 dark:text-rose-300/70" />}
                  title="Be honest, not perfect."
                />
                <SidebarTallCard
                  icon={<Lock className="h-5 w-5 text-emerald-500/70 dark:text-emerald-300/70 " />}
                  title="Private by design."
                />
                <SidebarTallCard
                  icon={<ShieldCheck className="h-5 w-5 text-slate-500 dark:text-slate-300" />}
                  title="Progress you can trust."
                />
              </div>
            </aside>
          </div>

          <div className="mt-6">
            <AnimatePresence>
              {showLoader && (
                <motion.div
                  key="savebar"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.16 }}
                  className="w-full"
                >
                  <CalmProgressLoader
                    label="Saving your answer…"
                    percent={savePercent}
                    done={saveDone}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        <AppFooter />
      </div>
    </div>
  );
}
