// Mobile replica of /likeminded/src/screens/matches/MatchesHomeScreen.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  MessageCircle,
  Heart,
  Images,
  ChevronRight,
  CheckCircle2,
  MessageSquareHeart,
  Clock,
  MessagesSquare,
  Loader2,
} from "lucide-react";
import MobileAppShell from "../../layouts/MobileAppShell";
import MobileTabBar from "../../layouts/MobileTabBar";
import { MobileLargeTitle } from "../../layouts/MobileHeader";
import {
  GradientButton,
  ProgressBar,
  Avatar,
  LoadingSpinner,
  EmptyState,
} from "../../components/Primitives";
import { api, type MatchStatus, type Conversation } from "../../../lib/api";

const MAX_ACTIVE_CHATS = 3;

function formatRelative(iso?: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

export default function MobileMatchesHomeScreen() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<MatchStatus | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [finding, setFinding] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [isOnCooldown, setIsOnCooldown] = useState(false);

  const refresh = async () => {
    try {
      const [st, convs] = await Promise.all([
        api.matchStatus().catch(() => null),
        api.conversations().catch(() => []),
      ]);
      setStatus(st);
      setConversations(convs || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  // Countdown
  useEffect(() => {
    const next = (status as any)?.next_eligible_ts_utc;
    if (!next) {
      setIsOnCooldown(false);
      setCountdown("");
      return;
    }
    const end = new Date(next).getTime();
    if (Number.isNaN(end) || end <= Date.now()) {
      setIsOnCooldown(false);
      setCountdown("");
      return;
    }
    const tick = () => {
      const r = end - Date.now();
      if (r <= 0) {
        setIsOnCooldown(false);
        setCountdown("");
        refresh();
        return;
      }
      setIsOnCooldown(true);
      const h = Math.floor(r / 3_600_000);
      const m = Math.floor((r % 3_600_000) / 60_000);
      const s = Math.floor((r % 60_000) / 1000);
      const pad = (n: number) => String(n).padStart(2, "0");
      setCountdown(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [status]);

  const checks = status?.checks;
  const isVerified = checks?.verified ?? false;
  const hasInterests = checks?.has_interest ?? false;
  const hasPhotos = checks?.has_photos ?? false;
  const hasAssessment = checks?.assessment_completed ?? false;
  const photosCount = checks?.photos_count ?? 0;
  const isReady = isVerified && hasInterests && hasPhotos && hasAssessment;

  const activeConversations = conversations.filter(
    (c: any) => c.status !== "ended" && c.status !== "closed"
  );
  const hasMaxChats = activeConversations.length >= MAX_ACTIVE_CHATS;
  const matchAllowed = !!status?.eligible;

  const handleFindMatch = async () => {
    setFinding(true);
    try {
      const res = await api.match();
      if (res.status === "matched") {
        navigate(`/conversations/${res.conversation_id}`);
      } else if (res.status === "no_match") {
        alert("No Match Found\n\nNo compatible matches available right now. Try again later!");
      } else if (res.status === "ineligible") {
        alert(`Not Eligible\n\n${res.reason}`);
      }
      refresh();
    } catch (e: any) {
      alert(e?.message || "Failed to generate match.");
    } finally {
      setFinding(false);
    }
  };

  if (loading) {
    return (
      <MobileAppShell className="md:hidden">
        <LoadingSpinner fullScreen />
        <MobileTabBar />
      </MobileAppShell>
    );
  }

  // Locked State
  if (!isReady) {
    const completedCount = [
      isVerified,
      hasAssessment,
      hasInterests,
      hasPhotos,
    ].filter(Boolean).length;
    const requirements = [
      {
        key: "verification",
        Icon: ShieldCheck,
        iconColor: "var(--m-secondary)",
        title: "Account Verification",
        description: "Verify your identity to build trust",
        completed: isVerified,
        onClick: () => navigate("/profile/verification"),
      },
      {
        key: "assessment",
        Icon: MessageCircle,
        iconColor: "var(--m-primary)",
        title: "Personality Assessment",
        description: "Complete the assessment for better matches",
        completed: hasAssessment,
        onClick: () => navigate("/chatbot"),
      },
      {
        key: "interests",
        Icon: Heart,
        iconColor: "var(--m-warning)",
        title: "Select Interests",
        description: "Choose at least one interest",
        completed: hasInterests,
        onClick: () => navigate("/profile/interests"),
      },
      {
        key: "photos",
        Icon: Images,
        iconColor: "var(--m-info)",
        title: "Upload 3 Photos",
        description: `${photosCount}/3 photos uploaded`,
        completed: hasPhotos,
        onClick: () => navigate("/profile/gallery"),
      },
    ];

    return (
      <MobileAppShell className="md:hidden">
        <div className="px-4 pt-3">
          <h1
            className="m-large-title"
            style={{ color: "var(--m-text-primary)" }}
          >
            Matches
          </h1>
          <p
            className="m-subhead mt-1 mb-5"
            style={{ color: "var(--m-text-secondary)" }}
          >
            Complete these steps to start matching
          </p>

          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span
                className="m-footnote"
                style={{ color: "var(--m-text-secondary)" }}
              >
                {completedCount} of 4 complete
              </span>
              <span
                className="m-footnote"
                style={{ color: "var(--m-text-secondary)" }}
              >
                {Math.round((completedCount / 4) * 100)}%
              </span>
            </div>
            <ProgressBar progress={completedCount / 4} height={8} />
          </div>

          <div className="m-list-group">
            {requirements.map((r) => {
              const Icon = r.Icon;
              const bg = r.completed
                ? "rgba(5,150,105,0.08)"
                : `color-mix(in srgb, ${r.iconColor} 15%, transparent)`;
              return (
                <button
                  key={r.key}
                  type="button"
                  className="m-list-row"
                  onClick={r.completed ? undefined : r.onClick}
                  disabled={r.completed}
                >
                  <span
                    className="m-icon-circle"
                    style={{ backgroundColor: bg }}
                  >
                    {r.completed ? (
                      <CheckCircle2 size={22} color="var(--m-success)" />
                    ) : (
                      <Icon size={22} color={r.iconColor} />
                    )}
                  </span>
                  <div className="flex-1">
                    <div
                      className="m-body"
                      style={{
                        color: r.completed
                          ? "var(--m-text-tertiary)"
                          : "var(--m-text-primary)",
                        fontWeight: 500,
                        textDecoration: r.completed ? "line-through" : "none",
                      }}
                    >
                      {r.title}
                    </div>
                    <div
                      className="m-footnote mt-0.5"
                      style={{ color: "var(--m-text-tertiary)" }}
                    >
                      {r.description}
                    </div>
                  </div>
                  {r.completed ? (
                    <CheckCircle2 size={22} color="var(--m-success)" />
                  ) : (
                    <ChevronRight size={20} color="var(--m-text-tertiary)" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <MobileTabBar />
      </MobileAppShell>
    );
  }

  return (
    <MobileAppShell className="md:hidden">
      <MobileLargeTitle title="Matches" />

      <div className="px-4 py-3">
        <GradientButton
          title={
            hasMaxChats
              ? "Chat Limit Reached"
              : isOnCooldown
              ? `Next match in ${countdown}`
              : "Find a Match"
          }
          onClick={handleFindMatch}
          loading={finding}
          disabled={isOnCooldown || hasMaxChats || !matchAllowed}
        />
        {isOnCooldown && !hasMaxChats ? (
          <p
            className="m-footnote text-center mt-2 flex items-center justify-center gap-1"
            style={{ color: "var(--m-text-tertiary)" }}
          >
            <Clock size={13} /> Next match available in {countdown}
          </p>
        ) : null}
        {hasMaxChats ? (
          <div className="mt-2 text-center">
            <p
              className="m-footnote flex items-center justify-center gap-1"
              style={{ color: "var(--m-text-tertiary)" }}
            >
              <MessagesSquare size={13} /> You can have up to{" "}
              {MAX_ACTIVE_CHATS} active conversations
            </p>
            <p
              className="m-caption1 mt-1"
              style={{ color: "var(--m-text-tertiary)" }}
            >
              End a conversation to be able to match again
            </p>
          </div>
        ) : null}
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon={<MessageSquareHeart size={36} color="var(--m-primary)" />}
          title="No conversations yet"
          description='Tap "Find a Match" to discover compatible people'
        />
      ) : (
        <div>
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => navigate(`/conversations/${c.id}`)}
              className="flex w-full items-center bg-transparent text-left"
              style={{
                padding: "12px 16px",
                minHeight: 72,
                borderBottom: "1px solid var(--m-separator-light)",
                background: "var(--m-surface)",
                border: "none",
                borderBottomWidth: 1,
                borderBottomStyle: "solid",
                borderBottomColor: "var(--m-separator-light)",
                cursor: "pointer",
              }}
            >
              <Avatar name={c.partnerName} size={52} />
              <div className="flex-1 ml-3 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className="m-headline truncate"
                    style={{ color: "var(--m-text-primary)" }}
                  >
                    {c.partnerName}
                  </span>
                  {c.lastAt ? (
                    <span
                      className="m-caption1 ml-2"
                      style={{ color: "var(--m-text-tertiary)" }}
                    >
                      {formatRelative(c.lastAt)}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span
                    className="m-subhead truncate flex-1"
                    style={{
                      color:
                        (c.unread ?? 0) > 0
                          ? "var(--m-text-primary)"
                          : "var(--m-text-secondary)",
                      fontWeight: (c.unread ?? 0) > 0 ? 600 : 400,
                    }}
                  >
                    {c.lastMessage
                      ? c.lastMessage.slice(0, 40) +
                        (c.lastMessage.length > 40 ? "..." : "")
                      : "Start a conversation..."}
                  </span>
                  {(c.unread ?? 0) > 0 ? (
                    <span
                      className="m-caption2 ml-2"
                      style={{
                        minWidth: 20,
                        height: 20,
                        padding: "0 6px",
                        borderRadius: 10,
                        background: "var(--m-primary)",
                        color: "#fff",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {c.unread}
                    </span>
                  ) : null}
                </div>
              </div>
              <ChevronRight
                size={18}
                color="var(--m-text-tertiary)"
                className="ml-2 flex-shrink-0"
              />
            </button>
          ))}
        </div>
      )}

      {finding ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="m-card text-center"
            style={{ minWidth: 280, padding: 32 }}
          >
            <div className="flex justify-center mb-4">
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 80,
                  height: 80,
                  background:
                    "linear-gradient(135deg, var(--m-gradient-start), var(--m-gradient-end))",
                }}
              >
                <Heart size={32} color="#fff" />
              </div>
            </div>
            <div
              className="m-title3"
              style={{ color: "var(--m-text-primary)" }}
            >
              Finding your match…
            </div>
            <p
              className="m-subhead mt-1"
              style={{ color: "var(--m-text-secondary)" }}
            >
              Scanning compatibility
            </p>
            <div className="flex justify-center mt-4">
              <Loader2
                size={24}
                color="var(--m-primary)"
                className="animate-spin"
              />
            </div>
          </div>
        </div>
      ) : null}

      <MobileTabBar />
    </MobileAppShell>
  );
}
