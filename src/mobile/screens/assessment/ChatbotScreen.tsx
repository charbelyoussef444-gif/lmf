// Mobile replica of /likeminded/src/screens/assessment/ChatbotScreen.tsx
// Personality-assessment chatbot — MCQ options + optional "Other" freeform.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, SendHorizontal, CheckCircle2, Trophy } from "lucide-react";
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
};

function stripTags(text: string) {
  return text
    .replace(/\[\[mcq:[^\]]*\]\]/g, "")
    .replace(/\[\[dyn:[^\]]*\]\]/g, "")
    .replace(/\[\[freeform:[^\]]*\]\]/g, "")
    .trim();
}

function parseReply(reply: string): {
  questionText: string;
  options: ParsedOption[];
  isFreeform: boolean;
} {
  if (!reply)
    return { questionText: "", options: [], isFreeform: false };

  const freeformMatch = reply.match(/\[\[freeform:([^\]]*)\]\]/);
  const isFreeform = !!freeformMatch;
  const cleaned = stripTags(reply);

  if (isFreeform) {
    return { questionText: cleaned, options: [], isFreeform };
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

  return { questionText, options, isFreeform };
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const h = await api.chatbotHistory();
        if (cancelled) return;
        const loaded: ChatMessage[] = (h.messages || []).map((m, idx) => {
          if (m.role === "assistant") {
            const parsed = parseReply(m.content);
            return {
              id: `hist-${idx}`,
              role: "assistant",
              content: parsed.questionText,
              options: parsed.options,
              isFreeform: parsed.isFreeform,
            };
          }
          return {
            id: `hist-${idx}`,
            role: "user",
            content: m.content,
          };
        });
        setMessages(loaded);
        setPhase(h.phase || "self");
        setIsDone(h.phase === "done");
        const total =
          (h.progress?.self_total ?? 0) + (h.progress?.pref_total ?? 0);
        const filled =
          (h.progress?.self_filled ?? 0) + (h.progress?.pref_filled ?? 0);
        setProgressPct(total > 0 ? Math.round((filled / total) * 100) : 0);
      } catch {
        // Start a fresh session if no history
        try {
          await api.assessmentStart();
          const first = await api.chatbotMessage("start");
          if (cancelled) return;
          const parsed = parseReply(first.reply || "");
          setMessages([
            {
              id: `bot-${Date.now()}`,
              role: "assistant",
              content: parsed.questionText,
              options: parsed.options,
              isFreeform: parsed.isFreeform,
            },
          ]);
          if (first.phase) setPhase(first.phase);
        } catch (e) {
          /* noop */
        }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSend = async (text: string) => {
    if (!text.trim() || isDone) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setShowCustomInput(false);
    setCustomInput("");

    try {
      const res = await api.chatbotMessage(text);
      setIsTyping(false);

      if (res.phase) setPhase(res.phase);
      if (res.progress) {
        const total =
          (res.progress.self_total ?? 0) + (res.progress.pref_total ?? 0);
        const filled =
          (res.progress.self_filled ?? 0) +
          ((res.progress as any).pref_filled ?? 0);
        setProgressPct(total > 0 ? Math.round((filled / total) * 100) : 0);
      }

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
          content: parsed.questionText,
          options: parsed.options,
          isFreeform: parsed.isFreeform,
        },
      ]);
    } catch (e: any) {
      setIsTyping(false);
      alert(e?.message || "Failed to send message");
    }
  };

  const handleOptionClick = (opt: ParsedOption) => {
    // The convention used is that "D) Write your own answer" triggers freeform input
    const isOther = /write your own|other/i.test(opt.text);
    if (isOther) {
      setShowCustomInput(true);
      return;
    }
    handleSend(opt.label);
  };

  const currentBot =
    messages.length > 0 && messages[messages.length - 1].role === "assistant"
      ? messages[messages.length - 1]
      : null;

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

      {!isDone && currentBot ? (
        <div
          className="px-4 pb-3 pt-2"
          style={{
            borderTop: "1px solid var(--m-separator-light)",
            background: "var(--m-bg)",
            paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0))",
          }}
        >
          {currentBot.isFreeform || showCustomInput ? (
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
                autoFocus
                placeholder="Type your answer..."
                className="m-input flex-1"
              />
              <button
                type="button"
                onClick={() => handleSend(customInput)}
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
          ) : (currentBot.options?.length ?? 0) > 0 ? (
            <div className="flex flex-col gap-2">
              {currentBot.options!.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => handleOptionClick(opt)}
                  disabled={isTyping}
                  className="flex items-start gap-2 text-left rounded-[12px] px-4 py-3"
                  style={{
                    background: "var(--m-surface)",
                    border: "1px solid var(--m-border-glass)",
                    color: "var(--m-text-primary)",
                  }}
                >
                  <span
                    className="flex-shrink-0 flex items-center justify-center rounded-full"
                    style={{
                      width: 28,
                      height: 28,
                      background: "var(--m-primary-muted)",
                      color: "var(--m-primary)",
                      fontWeight: 700,
                    }}
                  >
                    {opt.label}
                  </span>
                  <span className="m-body flex-1">{opt.text}</span>
                </button>
              ))}
            </div>
          ) : null}
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
