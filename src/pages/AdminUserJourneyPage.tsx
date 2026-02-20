// src/pages/AdminUserJourneyPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  User,
  BadgeCheck,
  Ban,
  Shield,
  Calendar,
  Clock,
  Filter,
  RefreshCw,
  Copy,
} from "lucide-react";
import { api } from "../lib/api";

import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";

type UserRow = {
  id: string;
  full_name?: string | null;
  verified?: boolean;
  banned?: boolean;
  admin?: boolean;
  is_admin?: boolean;
  created_at?: string | null;
  last_active?: string | null;
  gender?: string | null;
  age?: number | null;
  location?: string | null;
  gender_pref?: string | null;
  preferred_min_age?: number | null;
  preferred_max_age?: number | null;
  active_chats?: number | null;
};

type SummaryResp = {
  user: UserRow;
  flags: {
    signup_completed: boolean;
    assessment_completed: boolean;
    match_opened: boolean;
    message_sent: boolean;
    subscription_active: boolean;
  };
  latest_events?: Array<{ event_name: string; ts: string }>;
};

type EventRow = {
  id: number;
  ts: string;
  event_name: string;
  session_id: string;
  properties: Record<string, any>;
};

function fmtTs(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function pillClass(kind: "ok" | "warn" | "bad" | "neutral") {
  switch (kind) {
    case "ok":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200";
    case "warn":
      return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200";
    case "bad":
      return "bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
  }
}

function shortId(id?: string | null, n = 8) {
  if (!id) return "—";
  if (id.length <= n) return id;
  return `${id.slice(0, n)}…`;
}

function pickPropsPreview(p: Record<string, any>) {
  const keys = [
    "conversation_id",
    "match_user_id",
    "message_type",
    "placement",
    "plan_id",
    "provider",
    "time_taken_ms",
    "assessment_version",
  ];
  const out: Array<[string, any]> = [];
  for (const k of keys) {
    if (p?.[k] != null) out.push([k, p[k]]);
  }
  if (out.length === 0 && p) {
    const first = Object.keys(p).slice(0, 2);
    for (const k of first) out.push([k, p[k]]);
  }
  return out;
}

export default function AdminUserJourneyPage() {
  const { id } = useParams<{ id: string }>();
  const userId = id || "";

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryResp | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [eventFilter, setEventFilter] = useState<string>("");
  const [since, setSince] = useState<string>(""); // YYYY-MM-DD
  const [until, setUntil] = useState<string>(""); // YYYY-MM-DD

  const [expandedId, setExpandedId] = useState<number | null>(null);

  async function loadSummary() {
    const s = await api.adminUserSummary(userId);
    setSummary(s as SummaryResp);
  }

  async function loadEvents(opts?: { reset?: boolean }) {
    setEventsLoading(true);
    try {
      const params: Record<string, any> = {
        limit,
        offset: opts?.reset ? 0 : offset,
      };
      if (eventFilter.trim()) params.event = eventFilter.trim();
      if (since) params.since = new Date(since + "T00:00:00Z").toISOString();
      if (until) params.until = new Date(until + "T23:59:59Z").toISOString();

      const rows = await api.adminUserEvents(userId, params);
      const typed = rows as EventRow[];

      if (opts?.reset) {
        setEvents(typed);
        setOffset(typed.length);
      } else {
        setEvents((prev) => [...prev, ...typed]);
        setOffset((prev) => prev + typed.length);
      }
    } finally {
      setEventsLoading(false);
    }
  }

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      try {
        await loadSummary();
        setOffset(0);
        await loadEvents({ reset: true });
      } catch (e) {
        console.error(e);
        setSummary(null);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const u = summary?.user;

  const headerName = u?.full_name || `User ${shortId(userId, 10)}`;
  const isAdmin = !!(u?.admin || u?.is_admin);

  const statusPills = useMemo(() => {
    const pills: Array<{ label: string; kind: "ok" | "warn" | "bad" | "neutral" }> = [];
    if (u?.verified) pills.push({ label: "Verified", kind: "ok" });
    else pills.push({ label: "Unverified", kind: "warn" });

    if (u?.banned) pills.push({ label: "Banned", kind: "bad" });
    if (isAdmin) pills.push({ label: "Admin", kind: "neutral" });

    if (summary?.flags.subscription_active) pills.push({ label: "Paid", kind: "ok" });
    if (summary?.flags.assessment_completed) pills.push({ label: "Assessment done", kind: "ok" });
    else pills.push({ label: "Assessment pending", kind: "warn" });

    return pills;
  }, [u, isAdmin, summary]);

  async function copyToClipboard(txt: string) {
    try {
      await navigator.clipboard.writeText(txt);
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-500 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-400 grid place-items-center transition-colors duration-300">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-50 transition-colors duration-300">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/30">
            <div className="text-sm font-semibold">User not found / forbidden</div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Couldn’t load user journey. Check admin permissions or user id.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-50 transition-colors duration-300">
      {/* Soft background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-0 right-0 mx-auto h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,140,248,0.25),_transparent_60%)] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,_rgba(244,114,182,0.18),_transparent_60%)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        <AppHeader />

        <main className="flex-1 py-8">
          {/* Page toolbar (admin-specific) */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                to="/admin"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800"
                title="Back to admin"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-rose-500 shadow-md shadow-indigo-400/30">
                  <User className="h-4 w-4 text-white" />
                </div>

                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold tracking-tight">{headerName}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    User journey & lifecycle
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(userId)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800"
              title="Copy full user id"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy ID
            </button>
          </div>

          {/* Summary cards */}
          <section className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/30">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col">
                  <div className="text-sm font-semibold">{headerName}</div>
                  <div className="mt-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {userId}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {statusPills.map((p, i) => (
                    <span
                      key={i}
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${pillClass(
                        p.kind
                      )}`}
                    >
                      {p.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    Created
                  </div>
                  <div className="mt-1">{u?.created_at ? fmtTs(u.created_at) : "—"}</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    Last active
                  </div>
                  <div className="mt-1">{u?.last_active ? fmtTs(u.last_active) : "—"}</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Profile
                  </div>
                  <div className="mt-1">
                    {[
                      u?.age != null ? `Age ${u.age}` : null,
                      u?.gender ? u.gender : null,
                      u?.location ? u.location : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <Shield className="h-3.5 w-3.5" />
                    Preferences
                  </div>
                  <div className="mt-1">
                    {[
                      u?.gender_pref ? `Pref ${u.gender_pref}` : null,
                      u?.preferred_min_age != null || u?.preferred_max_age != null
                        ? `Age ${u?.preferred_min_age ?? "—"}-${u?.preferred_max_age ?? "—"}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/30">
              <div className="text-sm font-semibold">Lifecycle flags</div>
              <div className="mt-3 space-y-2 text-xs">
                <FlagRow label="Signup completed" on={summary.flags.signup_completed} />
                <FlagRow label="Assessment completed" on={summary.flags.assessment_completed} />
                <FlagRow label="Opened a match" on={summary.flags.match_opened} />
                <FlagRow label="Sent a message" on={summary.flags.message_sent} />
                <FlagRow label="Subscription active" on={summary.flags.subscription_active} />
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={async () => {
                    setExpandedId(null);
                    setOffset(0);
                    await loadSummary();
                    await loadEvents({ reset: true });
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>

              {(u?.banned || false) && (
                <div className="mt-4 rounded-2xl bg-rose-50/70 p-3 text-[11px] text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
                  <div className="flex items-center gap-2 font-medium">
                    <Ban className="h-4 w-4" />
                    User is banned
                  </div>
                  <div className="mt-1">Admin actions are still available in the Users list.</div>
                </div>
              )}
            </div>
          </section>

          {/* Filters */}
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/30">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />
                <div className="text-sm font-semibold">Event timeline</div>
              </div>

              <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-4">
                <input
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  placeholder="event_name (exact)"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                />
                <input
                  type="date"
                  value={since}
                  onChange={(e) => setSince(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                />
                <input
                  type="date"
                  value={until}
                  onChange={(e) => setUntil(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                />
                <button
                  onClick={async () => {
                    setExpandedId(null);
                    setOffset(0);
                    await loadEvents({ reset: true });
                  }}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-slate-50 hover:bg-black dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Timeline list */}
            <div className="mt-4 space-y-2">
              {events.map((e) => {
                const preview = pickPropsPreview(e.properties || {});
                const expanded = expandedId === e.id;

                return (
                  <div
                    key={e.id}
                    className="rounded-2xl border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/70"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200">
                            {e.event_name}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {fmtTs(e.ts)}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            session {shortId(e.session_id, 10)}
                          </span>
                        </div>

                        {preview.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                            {preview.map(([k, v]) => (
                              <span
                                key={k}
                                className="rounded-full border border-slate-200 bg-slate-50/70 px-2 py-0.5 dark:border-slate-700 dark:bg-slate-900/60"
                              >
                                <span className="text-slate-500 dark:text-slate-400">{k}:</span>{" "}
                                <span className="font-mono">{String(v)}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedId(expanded ? null : e.id)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          {expanded ? "Hide" : "Details"}
                        </button>

                        <button
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(
                                {
                                  event_name: e.event_name,
                                  ts: e.ts,
                                  session_id: e.session_id,
                                  properties: e.properties,
                                },
                                null,
                                2
                              )
                            )
                          }
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                          title="Copy event JSON"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <pre className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-[11px] text-slate-700 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200">
{JSON.stringify(e.properties || {}, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })}

              {!events.length && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-3 py-8 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                  No events for this user (yet).
                </div>
              )}
            </div>

            {/* Load more */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => loadEvents()}
                disabled={eventsLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {eventsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Load more
              </button>
            </div>
          </section>
        </main>

        <AppFooter />
      </div>
    </div>
  );
}

function FlagRow({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60">
      <span className="text-[11px] text-slate-600 dark:text-slate-300">{label}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
          on
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        }`}
      >
        {on ? "Yes" : "No"}
      </span>
    </div>
  );
}