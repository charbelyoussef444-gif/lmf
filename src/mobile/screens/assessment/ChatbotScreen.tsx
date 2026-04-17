// Mobile replica of /likeminded/src/screens/assessment/ChatbotScreen.tsx
// Personality-assessment chatbot — MCQ options + optional "Other" freeform.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  SendHorizontal,
  CheckCircle2,
  Trophy,
  Pencil,
  ChevronRight,
} from "lucide-react";
import MobileAppShell from "../../layouts/MobileAppShell";
import MobileHeader from "../../layouts/MobileHeader";
import { ProgressBar, LoadingSpinner } from "../../components/Primitives";
import { api } from "../../../lib/api";

type ParsedOption = { label: string; text: string };

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  options?: ParsedOption[];
  isFreeform?: boolean;
  freeformKey?: string;
};

function stripTags(text: string) {
  return text
    .replace(/\[\[mcq:[^\]]*\]\]/g, "")
    .replace(/\[\[dyn:[^\]]*\]\]/g, "")
    .replace(/\[\[freeform:[^\]]*\]\]/g, "")
    .trim();
}

/**
 * Parses the backend reply text which looks like:
 * "Question text?\nA) Option A text\nB) Option B text\nC) Option C text\nD) Write your own answer\n\n[[mcq:S1]]"
 */
function parseReply(reply: string): {
  questionText: string;
  options: ParsedOption[];
  isFreeform: boolean;
  freeformKey: string;
} {
  if (!reply)
    return { questionText: "", options: [], isFreeform: false, freeformKey: "" };

  const freeformMatch = reply.match(/\[\[freeform:([^\]]*)\]\]/);
  const isFreeform = !!freeformMatch;
  const freeformKey = freeformMatch ? freeformMatch[1] : "";
  const cleaned = stripTags(reply);

  if (isFreeform) {
    return { questionText: cleaned, options: [], isFreeform, freeformKey };
  }

  const optionRegex = /^([A-D])\)\s*(.+)$/gm;
  const options: ParsedOption[] = [];
  let match: RegExpExecArray | null;
  while ((match = optionRegex.exec(cleaned)) !== null) {
    options.push({ label: match[1], text: match[2].trim() });
  }

  let questionText = cleaned;
  if (options.length > 0) {
    const firstOptIdx = cleaned.search(/^[A-D]\)\s/m);
    if (firstOptIdx > 0) {
      questionText = cleaned.substring(0, firstOptIdx).trim();
    }
  }

  return { questionText, options, isFreeform: false, freeformKey: "" };
}

function BotAvatar() {
  return (
    <span
      className="flex-shrink-0 flex items-center justify-center rounded-full"
      style={{
        width: 24,
        height: 24,
        background:
          "linear-gradient(135deg, var(--m-gradient-start), var(--m-gradient-end))",
      }}
    >
      <Sparkles size={12} color="#fff" />
    </span>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-2 mb-2">
      <BotAvatar />
      <div
        className="flex items-center gap-1 px-3 py-2 rounded-[18px]"
        style={{ background: "var(--m-chat-them)" }}
      >
        {[0, 120, 240].map((d) => (
          <span
            key={d}
            className="inline-block"
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: "var(--m-text-tertiary)",
              animation: `mTypingDot 900ms ${d}ms infinite ease-in-out`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function MobileChatbotScreen() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [phase, setPhase] = useState<"self" | "pref" | "done">("self");
  const [isDone, setIsDone] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [progressPct, setProgressPct] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Compute progress pct from the (possibly partial) progress object
  const computeProgress = (p: {
    self_filled?: number;
    self_total?: number;
    pref_filled?: number;
    pref_total?: number;
  } | null | undefined) => {
    if (!p) return 0;
    const total = (p.self_total ?? 0) + (p.pref_total ?? 0);
    const filled = (p.self_filled ?? 0) + (p.pref_filled ?? 0);
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  };

  // Send a message to the backend and append the reply.
  const sendToBackend = async (text: string) => {
    setIsTyping(true);
    try {
      const res = await api.chatbotMessage(text);
      if (res.phase) setPhase(res.phase);
      if (res.progress) setProgressPct(computeProgress(res.progress));

      const reply = res.reply || "";
      if (res.phase === "done") {
        setIsDone(true);
      }
      const parsed = parseReply(reply);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: parsed.questionText || reply,
          options: parsed.options,
          isFreeform: parsed.isFreeform,
          freeformKey: parsed.freeformKey,
        },
      ]);
    } catch (e: any) {
      alert(e?.message || "Failed to send message");
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const h = await api.chatbotHistory();
        if (cancelled) return;

        const rawMessages = h.messages || [];
        const phaseFromHistory = h.phase || "self";
        const pctFromHistory = computeProgress(h.progress);

        setPhase(phaseFromHistory);
        setProgressPct(pctFromHistory);
        setIsDone(phaseFromHistory === "done");

        if (rawMessages.length > 0) {
          // Find the index of the last bot message — only it gets options.
          let lastBotIndex = -1;
          for (let idx = rawMessages.length - 1; idx >= 0; idx--) {
            if (rawMessages[idx].role === "assistant") {
              lastBotIndex = idx;
              break;
            }
          }

          const loaded: ChatMessage[] = rawMessages.map((m, i) => {
            if (m.role === "assistant") {
              const isLast = i === lastBotIndex;
              const parsed = parseReply(m.content);
              return {
                id: `hist-${i}`,
                role: "assistant",
                content: parsed.questionText || m.content,
                // Only attach MCQ options to the last bot message, and only
                // if we're not already done.
                options:
                  isLast && phaseFromHistory !== "done" ? parsed.options : [],
                isFreeform:
                  isLast && phaseFromHistory !== "done"
                    ? parsed.isFreeform
                    : false,
                freeformKey: isLast ? parsed.freeformKey : "",
              };
            }
            return {
              id: `hist-${i}`,
              role: "user",
              content: m.content,
            };
          });
          setMessages(loaded);

          // If the last message is from the user (they answered but didn't
          // receive the next question), ask the backend to continue. Mirrors
          // the mobile app.
          if (
            lastBotIndex < rawMessages.length - 1 &&
            phaseFromHistory !== "done"
          ) {
            await sendToBackend("continue");
          }
          setLoadingHistory(false);
          return;
        }

        // No history — kick off the assessment.
        try {
          await api.assessmentStart();
        } catch {
          /* backend tolerates this failing if already started */
        }
        if (cancelled) return;
        await sendToBackend("start");
      } catch {
        // History fetch failed entirely — try to start a fresh session.
        try {
          await api.assessmentStart();
          if (cancelled) return;
          await sendToBackend("start");
        } catch {
          /* noop */
        }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Send a user message (from MCQ click, freeform input, or custom input).
  // Clears the last bot's options so the MCQ UI disappears immediately.
  const handleSend = async (text: string, optimisticContent?: string) => {
    if (!text.trim() || isDone) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: optimisticContent || text,
    };
    setMessages((prev) => {
      // Clear options on the last bot message so MCQ UI disappears.
      const updated = prev.map((m, i) =>
        i === prev.length - 1 && m.role === "assistant"
          ? { ...m, options: [], isFreeform: false }
          : m
      );
      return [...updated, userMsg];
    });
    setShowCustomInput(false);
    setCustomInput("");
    await sendToBackend(text);
  };

  const handleOptionClick = (opt: ParsedOption) => {
    // "D) Write your own answer" — show custom input
    if (opt.label === "D" && /write your own|other/i.test(opt.text)) {
      setShowCustomInput(true);
      setCustomInput("");
      return;
    }
    // Send just the letter — show the option text as the optimistic content
    handleSend(opt.label, opt.text);
  };

  const handleSendCustom = () => {
    if (!customInput.trim()) return;
    const text = customInput.trim();
    // Send as "D: <custom text>" so backend knows this is the custom answer
    handleSend(`D: ${text}`, text);
  };

  const handleSendFreeform = () => {
    if (!customInput.trim()) return;
    handleSend(customInput.trim());
  };

  const handleSkipFreeform = () => {
    handleSend("skip", "Skip");
  };

  // Find the last bot message (even if a user message comes after) so MCQ
  // options/freeform state survive optimistic user renders.
  const lastBotMessage = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");
  const currentOptions = lastBotMessage?.options || [];
  const isFreeformQuestion = lastBotMessage?.isFreeform || false;

  // Is the last message from the user? Then MCQ should not render (we're
  // waiting on bot). Typing indicator covers the waiting state.
  const lastIsUser =
    messages.length > 0 && messages[messages.length - 1].role === "user";

  if (loadingHistory) {
    return (
      <MobileAppShell bare className="md:hidden">
        <MobileHeader title="Assessment" onBack={() => navigate(-1)} />
        <LoadingSpinner fullScreen />
      </MobileAppShell>
    );
  }

  return (
    <MobileAppShell bare className="md:hidden">
      <MobileHeader title="Assessment" onBack={() => navigate(-1)} />

      <div className="px-4 py-2">
        {isDone ? (
          <div
            className="flex items-center justify-center"
            style={{ gap: 8, paddingTop: 4, paddingBottom: 4 }}
          >
            <CheckCircle2 size={20} color="var(--m-success)" />
            <span
              className="m-headline"
              style={{
                color: "var(--m-text-primary)",
                fontWeight: 700,
              }}
            >
              Assessment Complete
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-1">
              <span
                className="m-caption1"
                style={{ color: "var(--m-text-secondary)" }}
              >
                {phase === "pref" ? "Preferences" : "About You"}
              </span>
              <span
                className="m-caption1"
                style={{ color: "var(--m-text-secondary)" }}
              >
                {progressPct}%
              </span>
            </div>
            <ProgressBar progress={progressPct / 100} height={6} />
          </>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-3 flex flex-col gap-3"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {messages.map((m) => {
          if (m.role === "user") {
            return (
              <div key={m.id} className="flex justify-end">
                <div className="m-bubble m-bubble-me">{m.content}</div>
              </div>
            );
          }
          return (
            <div key={m.id} className="flex items-start gap-2">
              <BotAvatar />
              <div className="m-bubble m-bubble-them">{m.content}</div>
            </div>
          );
        })}
        {isTyping ? <TypingDots /> : null}
      </div>

      {/* Bottom input / MCQ region — rendered only when not done. */}
      {!isDone ? (
        <div
          className="px-4 pb-3 pt-2"
          style={{
            borderTop: "1px solid var(--m-separator-light)",
            background: "var(--m-bg)",
            paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0))",
          }}
        >
          {/* Priority:
              1. User picked "Other" / D → custom text input
              2. Current bot asks a freeform question → freeform text input with Skip
              3. Current bot has MCQ options (and we're not still waiting on a
                 user→bot round-trip) → option buttons
              4. Fallback (parsing failed / unexpected state) → plain text input
                 so the user is never stuck. */}
          {showCustomInput ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendCustom();
                  }
                }}
                autoFocus
                placeholder="Type your answer..."
                className="m-input flex-1"
              />
              <button
                type="button"
                onClick={handleSendCustom}
                disabled={!customInput.trim() || isTyping}
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 44,
                  height: 44,
                  background:
                    "linear-gradient(135deg, var(--m-gradient-start), var(--m-gradient-end))",
                  border: "none",
                  opacity: !customInput.trim() || isTyping ? 0.5 : 1,
                }}
                aria-label="Send"
              >
                <SendHorizontal size={20} color="#fff" />
              </button>
            </div>
          ) : isFreeformQuestion && !lastIsUser ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Type your answer..."
                rows={3}
                className="m-input"
                style={{ resize: "none" }}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSkipFreeform}
                  disabled={isTyping}
                  className="flex-1 rounded-full text-center"
                  style={{
                    minHeight: 44,
                    border: "1px solid var(--m-separator-light)",
                    background: "var(--m-surface)",
                    color: "var(--m-text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={handleSendFreeform}
                  disabled={!customInput.trim() || isTyping}
                  className="flex-1 rounded-full text-center"
                  style={{
                    minHeight: 44,
                    border: "none",
                    background:
                      customInput.trim() && !isTyping
                        ? "linear-gradient(135deg, var(--m-gradient-start), var(--m-gradient-end))"
                        : "var(--m-disabled, #c7c7cc)",
                    color: "#fff",
                    fontWeight: 700,
                    opacity: !customInput.trim() || isTyping ? 0.7 : 1,
                  }}
                >
                  Submit
                </button>
              </div>
            </div>
          ) : currentOptions.length > 0 && !lastIsUser ? (
            <div className="flex flex-col gap-2">
              {currentOptions.map((opt) => {
                const isOther =
                  opt.label === "D" && /write your own|other/i.test(opt.text);
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleOptionClick(opt)}
                    disabled={isTyping}
                    className="flex items-center gap-3 text-left rounded-[12px] px-3 py-3"
                    style={{
                      background: isOther
                        ? "var(--m-surface-secondary, var(--m-surface))"
                        : "var(--m-surface)",
                      border: isOther
                        ? "1px dashed var(--m-text-tertiary)"
                        : "1px solid var(--m-border-glass)",
                      color: "var(--m-text-primary)",
                      minHeight: 44,
                      cursor: "pointer",
                    }}
                  >
                    <span
                      className="flex-shrink-0 flex items-center justify-center rounded-full"
                      style={{
                        width: 30,
                        height: 30,
                        background: isOther
                          ? "var(--m-surface-secondary, var(--m-surface))"
                          : "linear-gradient(135deg, var(--m-gradient-start), var(--m-gradient-end))",
                        color: isOther ? "var(--m-text-tertiary)" : "#fff",
                        fontWeight: 700,
                        fontSize: 14,
                        border: isOther
                          ? "1px solid var(--m-text-tertiary)"
                          : "none",
                      }}
                    >
                      {isOther ? <Pencil size={14} /> : opt.label}
                    </span>
                    <span
                      className="m-body flex-1"
                      style={{ lineHeight: 1.35 }}
                    >
                      {opt.text}
                    </span>
                    {isOther ? (
                      <ChevronRight
                        size={16}
                        color="var(--m-text-tertiary)"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            // Fallback — covers the brief period while waiting for the next
            // bot reply, or the rare case where parsing fails entirely.
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(customInput);
                  }
                }}
                placeholder={
                  isTyping || lastIsUser
                    ? "Waiting for next question..."
                    : "Type your answer..."
                }
                className="m-input flex-1"
                disabled={isTyping || lastIsUser}
              />
              <button
                type="button"
                onClick={() => handleSend(customInput)}
                disabled={!customInput.trim() || isTyping || lastIsUser}
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 44,
                  height: 44,
                  background:
                    "linear-gradient(135deg, var(--m-gradient-start), var(--m-gradient-end))",
                  border: "none",
                  opacity:
                    !customInput.trim() || isTyping || lastIsUser ? 0.5 : 1,
                }}
                aria-label="Send"
              >
                <SendHorizontal size={20} color="#fff" />
              </button>
            </div>
          )}
        </div>
      ) : null}

      {isDone ? (
        <div
          className="px-4 pt-3"
          style={{
            borderTop: "1px solid var(--m-separator-light)",
            background: "var(--m-bg)",
            paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0))",
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/conversations")}
            className="flex w-full items-center justify-center"
            style={{
              gap: 8,
              height: 52,
              borderRadius: 14,
              border: "none",
              background:
                "linear-gradient(135deg, var(--m-gradient-start), var(--m-gradient-end))",
              boxShadow: "0 4px 12px rgba(255,107,138,0.30)",
              color: "#fff",
              cursor: "pointer",
            }}
            aria-label="View your results"
          >
            <Trophy size={20} color="#fff" />
            <span
              className="m-headline"
              style={{ color: "#fff", fontWeight: 700 }}
            >
              View Your Results
            </span>
          </button>
        </div>
      ) : null}
    </MobileAppShell>
  );
}
