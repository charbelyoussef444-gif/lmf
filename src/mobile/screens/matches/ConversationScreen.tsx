// Mobile replica of /likeminded/src/screens/matches/ConversationScreen.tsx

import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MoreVertical, SendHorizontal, Images, X, Flag } from "lucide-react";
import MobileAppShell from "../../layouts/MobileAppShell";
import MobileHeader from "../../layouts/MobileHeader";
import { LoadingSpinner } from "../../components/Primitives";
import {
  api,
  type Msg,
  type MatchFeedbackStatus,
  type ReportReason,
} from "../../../lib/api";

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "scam", label: "Scam / Fraud" },
  { value: "hate", label: "Hate speech" },
  { value: "sexual", label: "Sexual content" },
  { value: "impersonation", label: "Impersonation" },
  { value: "other", label: "Other" },
];

function formatMessageTime(ts: number) {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatChatDate(ts: number) {
  const d = new Date(ts * 1000);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export default function MobileConversationScreen() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [partnerName, setPartnerName] = useState("Match");
  const [feedback, setFeedback] = useState<MatchFeedbackStatus | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("spam");
  const [reportDetails, setReportDetails] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const load = async () => {
    if (!conversationId) return;
    try {
      const [msgs, convs, fb] = await Promise.all([
        api.thread(conversationId).catch(() => []),
        api.conversations().catch(() => []),
        api.matchFeedbackStatus(conversationId).catch(() => null),
      ]);
      setMessages(msgs || []);
      const me = convs.find((c) => c.id === conversationId);
      if (me) setPartnerName(me.partnerName || "Match");
      setFeedback(fb);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 0);
    }
  };

  useEffect(() => {
    load();
    if (conversationId) {
      api.markRead(conversationId).catch(() => {});
    }
    // Polling fallback (3s)
    pollRef.current = setInterval(() => {
      if (!conversationId) return;
      api
        .thread(conversationId)
        .then((m) => {
          setMessages((prev) => {
            if (m.length === prev.length) return prev;
            setTimeout(scrollToBottom, 0);
            return m;
          });
        })
        .catch(() => {});
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending || !conversationId) return;
    setInputText("");
    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const tempMsg: Msg = {
      id: tempId,
      role: "me",
      text,
      ts: Math.floor(Date.now() / 1000),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(scrollToBottom, 0);
    try {
      const real = await api.sendMessage(conversationId, text);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...real, role: "me" } : m))
      );
    } catch (e: any) {
      alert(e?.message || "Failed to send message");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleFeedback = async (yes: boolean) => {
    if (!conversationId) return;
    try {
      const res = await api.submitMatchFeedback(conversationId, yes);
      if (res.photos_unlocked) {
        alert("🎉 Photos unlocked! You can now see each other's photos.");
        navigate(`/conversations/${conversationId}/photos`);
      } else if (res.both_yes) {
        alert("Great! You both said yes.");
      } else {
        alert("Your feedback has been saved.");
      }
      const updated = await api.matchFeedbackStatus(conversationId);
      setFeedback(updated);
    } catch (e: any) {
      alert(e?.message || "Failed to submit feedback");
    }
  };

  const handleEndConversation = async () => {
    if (!conversationId) return;
    const ok = window.confirm("End this conversation? This cannot be undone.");
    if (!ok) return;
    try {
      await api.endConversation(conversationId);
      navigate("/conversations");
    } catch (e: any) {
      alert(e?.message || "Failed to end conversation");
    }
  };

  const handleReport = async () => {
    if (!conversationId) return;
    try {
      await api.reportUser({
        conversation_id: conversationId,
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });
      setShowReport(false);
      setReportDetails("");
      alert("Report submitted. Our team will review it.");
    } catch (e: any) {
      alert(e?.message || "Failed to submit report");
    }
  };

  if (loading) {
    return (
      <MobileAppShell bare className="md:hidden">
        <MobileHeader title={partnerName} />
        <LoadingSpinner fullScreen />
      </MobileAppShell>
    );
  }

  // Group messages with date separators
  const rendered: React.ReactNode[] = [];
  let lastDay = "";
  messages.forEach((m) => {
    const day = formatChatDate(m.ts);
    if (day !== lastDay) {
      rendered.push(
        <div
          key={`sep-${m.id}`}
          className="m-footnote text-center my-3"
          style={{ color: "var(--m-text-tertiary)" }}
        >
          {day}
        </div>
      );
      lastDay = day;
    }
    rendered.push(
      <div
        key={m.id}
        className="flex flex-col"
        style={{ alignItems: m.role === "me" ? "flex-end" : "flex-start" }}
      >
        <div
          className={m.role === "me" ? "m-bubble m-bubble-me" : "m-bubble m-bubble-them"}
        >
          {m.text}
        </div>
        <span
          className="m-caption2 mt-0.5 px-1"
          style={{ color: "var(--m-text-tertiary)" }}
        >
          {formatMessageTime(m.ts)}
        </span>
      </div>
    );
  });

  return (
    <MobileAppShell bare className="md:hidden">
      <MobileHeader
        title={partnerName}
        right={
          <button
            type="button"
            className="m-header-btn -mr-2"
            onClick={() => setShowActionSheet(true)}
            aria-label="More actions"
          >
            <MoreVertical size={22} />
          </button>
        }
      />

      {feedback?.should_prompt && !feedback?.already_answered ? (
        <div
          className="mx-4 mt-2 p-3 rounded-[12px]"
          style={{
            backgroundColor: "var(--m-primary-muted)",
            border: "1px solid var(--m-border-glass)",
          }}
        >
          <div
            className="m-subhead"
            style={{ color: "var(--m-text-primary)", fontWeight: 600 }}
          >
            Want to unlock photos?
          </div>
          <p
            className="m-footnote mt-1"
            style={{ color: "var(--m-text-secondary)" }}
          >
            Say yes if you'd like to see each other's photos. Both must agree.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => handleFeedback(true)}
              className="flex-1 rounded-[20px] py-2 text-white font-semibold"
              style={{
                background:
                  "linear-gradient(135deg, var(--m-gradient-start), var(--m-gradient-end))",
              }}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => handleFeedback(false)}
              className="flex-1 rounded-[20px] py-2 font-semibold"
              style={{
                background: "var(--m-surface)",
                border: "1px solid var(--m-border-glass)",
                color: "var(--m-text-primary)",
              }}
            >
              No
            </button>
          </div>
        </div>
      ) : null}

      {feedback?.photos_unlocked ? (
        <button
          type="button"
          onClick={() => navigate(`/conversations/${conversationId}/photos`)}
          className="mx-4 mt-2 flex items-center justify-center gap-2 rounded-[12px] py-3"
          style={{
            background: "var(--m-success-light)",
            color: "var(--m-success)",
            border: "1px solid var(--m-success-light)",
            fontWeight: 600,
          }}
        >
          <Images size={18} /> View match photos
        </button>
      ) : null}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto flex flex-col gap-1 px-4 pt-3 pb-3"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {messages.length === 0 ? (
          <p
            className="m-body text-center mt-10"
            style={{ color: "var(--m-text-tertiary)" }}
          >
            Say hi to start the conversation
          </p>
        ) : (
          rendered
        )}
      </div>

      <div
        className="sticky bottom-0 flex items-center gap-2 px-3 py-2"
        style={{
          borderTop: "1px solid var(--m-separator-light)",
          background: "var(--m-bg)",
          paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0))",
        }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          className="m-input flex-1"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!inputText.trim() || sending}
          className="flex items-center justify-center rounded-full"
          style={{
            width: 44,
            height: 44,
            background:
              "linear-gradient(135deg, var(--m-gradient-start), var(--m-gradient-end))",
            border: "none",
            opacity: !inputText.trim() || sending ? 0.5 : 1,
          }}
          aria-label="Send"
        >
          <SendHorizontal size={20} color="#fff" />
        </button>
      </div>

      {showActionSheet ? (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowActionSheet(false)}
        >
          <div
            className="w-full m-list-group"
            onClick={(e) => e.stopPropagation()}
            style={{
              margin: 16,
              marginBottom: "calc(16px + env(safe-area-inset-bottom, 0))",
              borderRadius: 14,
            }}
          >
            <button
              type="button"
              className="m-list-row"
              onClick={() => {
                setShowActionSheet(false);
                setShowReport(true);
              }}
              style={{ color: "var(--m-error)" }}
            >
              <Flag size={20} color="var(--m-error)" />
              <span className="m-list-row-title">Report User</span>
            </button>
            <button
              type="button"
              className="m-list-row"
              onClick={() => {
                setShowActionSheet(false);
                handleEndConversation();
              }}
              style={{ color: "var(--m-error)" }}
            >
              <X size={20} color="var(--m-error)" />
              <span className="m-list-row-title">End Conversation</span>
            </button>
            <button
              type="button"
              className="m-list-row"
              onClick={() => setShowActionSheet(false)}
            >
              <span
                className="m-list-row-title text-center"
                style={{ color: "var(--m-text-primary)" }}
              >
                Cancel
              </span>
            </button>
          </div>
        </div>
      ) : null}

      {showReport ? (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowReport(false)}
        >
          <div
            className="w-full"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--m-bg-elevated)",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0))",
            }}
          >
            <h2
              className="m-title2"
              style={{ color: "var(--m-text-primary)", marginBottom: 16 }}
            >
              Report user
            </h2>
            <div className="flex flex-col gap-2 mb-3">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.value}
                  className="flex items-center gap-2"
                  style={{ color: "var(--m-text-primary)" }}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    checked={reportReason === r.value}
                    onChange={() => setReportReason(r.value)}
                  />
                  <span className="m-body">{r.label}</span>
                </label>
              ))}
            </div>
            <textarea
              className="m-input"
              placeholder="Details (optional)"
              style={{
                minHeight: 80,
                padding: 12,
                resize: "none",
                lineHeight: 1.3,
              }}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                className="m-btn-ghost"
                onClick={() => setShowReport(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReport}
                className="flex-1 m-btn-solid"
                style={{ background: "var(--m-error)" }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </MobileAppShell>
  );
}
