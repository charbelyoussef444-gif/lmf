// src/pages/Admin.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  ShieldCheck,
  Users,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";

type Me = {
  id: string;
  full_name: string;
  verified: boolean;
  is_admin?: boolean;
  admin?: boolean;
};

type AdminUser = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  verified?: boolean;
  banned?: boolean;
  is_admin?: boolean;
  admin?: boolean;
  created_at?: string;
};

type PendingKycRow = {
  user_id: string;
  created_at: string;
  full_name?: string | null;
  age?: number | null;
};

export default function AdminPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"kyc" | "users">("kyc");

  const [pending, setPending] = useState<PendingKycRow[]>([]);
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<
    Array<{ name: string; url: string }>
  >([]);
  const [kycBusy, setKycBusy] = useState(false);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [userBusyId, setUserBusyId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const mine = await api.me();
        setMe(mine as Me);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isMeAdmin = me?.is_admin === true || me?.admin === true;
  const gated = useMemo(() => isMeAdmin, [isMeAdmin]);

  useEffect(() => {
    if (!isMeAdmin) return;
    if (tab === "kyc") refreshPending();
    if (tab === "users") refreshUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMeAdmin, tab]);

  async function refreshPending() {
    try {
      const rows = await api.adminListPendingKyc();
      setPending(rows);
      if (previewUserId) {
        const imgs = await api.adminKycImages(previewUserId);
        setPreviewImages(imgs.images);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function openPreview(userId: string) {
    try {
      setPreviewUserId(userId);
      const imgs = await api.adminKycImages(userId);
      setPreviewImages(imgs.images);
    } catch (e) {
      console.error(e);
      setPreviewImages([]);
    }
  }

  async function approve(userId: string) {
    if (!confirm("Approve verification?")) return;
    setKycBusy(true);
    try {
      await api.adminApproveKyc(userId);
      await refreshPending();
      setPreviewUserId(null);
      setPreviewImages([]);
    } catch {
      alert("Approve failed.");
    } finally {
      setKycBusy(false);
    }
  }

  async function reject(userId: string) {
    const reason = prompt("Enter rejection reason:");
    if (!reason?.trim()) return;
    setKycBusy(true);
    try {
      await api.adminRejectKyc(userId, reason.trim());
      await refreshPending();
      setPreviewUserId(null);
      setPreviewImages([]);
    } catch {
      alert("Reject failed.");
    } finally {
      setKycBusy(false);
    }
  }

  async function refreshUsers() {
    try {
      const rows = await api.adminListUsers(query || undefined, 50, 0);
      setUsers(rows);
    } catch (e) {
      console.error(e);
    }
  }

  async function toggleBan(u: AdminUser) {
    setUserBusyId(u.id);
    try {
      if (u.banned) await api.adminUnban(u.id);
      else await api.adminBan(u.id);
      await refreshUsers();
    } finally {
      setUserBusyId(null);
    }
  }

  async function toggleAdmin(u: AdminUser) {
    setUserBusyId(u.id);
    try {
      if (u.is_admin || u.admin) await api.adminDemote(u.id);
      else await api.adminPromote(u.id);
      await refreshUsers();
    } finally {
      setUserBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-500 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-400 grid place-items-center transition-colors duration-300">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!gated) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-50 transition-colors duration-300">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute -top-32 left-0 right-0 mx-auto h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,140,248,0.25),_transparent_60%)] blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,_rgba(244,114,182,0.18),_transparent_60%)] blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col px-4 sm:px-6 lg:px-8">
          <AppHeader showNav={false} showVerifiedBadge={false} />

          <main className="flex-1 py-16">
            <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white/80 p-6 text-center shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:shadow-black/30">
              <h1 className="text-lg font-semibold">Page not found</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                This page is only available to administrators.
              </p>
              <Link
                to="/"
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-slate-50 hover:bg-black dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                Go home
              </Link>
            </div>
          </main>

          <AppFooter />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-50 transition-colors duration-300">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-0 right-0 mx-auto h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,140,248,0.25),_transparent_60%)] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,_rgba(244,114,182,0.18),_transparent_60%)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        <AppHeader />

        <main className="flex-1 py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                LikeMinded Admin
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Moderation & verification
              </div>
            </div>

            <div className="flex items-center gap-3">
              <nav className="hidden items-center gap-2 text-xs font-medium md:flex">
                <button
                  onClick={() => setTab("kyc")}
                  className={`rounded-full px-3 py-1.5 transition ${
                    tab === "kyc"
                      ? "bg-slate-900 text-slate-50 dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  KYC review
                </button>
                <button
                  onClick={() => setTab("users")}
                  className={`rounded-full px-3 py-1.5 transition ${
                    tab === "users"
                      ? "bg-slate-900 text-slate-50 dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  Users
                </button>
              </nav>

              <span className="hidden text-[11px] text-slate-500 dark:text-slate-400 sm:inline-flex">
                {me?.full_name || "Admin"}
              </span>
            </div>
          </div>

          {/* Mobile tab switcher */}
          <div className="mb-6 flex items-center gap-2 md:hidden">
            <button
              onClick={() => setTab("kyc")}
              className={`flex-1 rounded-2xl px-3 py-2 text-xs font-medium transition ${
                tab === "kyc"
                  ? "bg-slate-900 text-slate-50 dark:bg-slate-100 dark:text-slate-900"
                  : "border border-slate-200 bg-white/70 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              }`}
            >
              KYC review
            </button>
            <button
              onClick={() => setTab("users")}
              className={`flex-1 rounded-2xl px-3 py-2 text-xs font-medium transition ${
                tab === "users"
                  ? "bg-slate-900 text-slate-50 dark:bg-slate-100 dark:text-slate-900"
                  : "border border-slate-200 bg-white/70 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              }`}
            >
              Users
            </button>
          </div>

          {tab === "kyc" && (
            <section className="grid gap-6 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)]">
              <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/30">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-500 dark:text-indigo-300" />
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      Pending verifications
                    </h2>
                  </div>
                  <button
                    onClick={refreshPending}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Refresh
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  {pending.map((row) => (
                    <button
                      key={row.user_id}
                      onClick={() => openPreview(row.user_id)}
                      className={`w-full rounded-2xl border px-3 py-2 text-left transition ${
                        previewUserId === row.user_id
                          ? "border-indigo-400 bg-indigo-50 dark:border-indigo-500/80 dark:bg-indigo-950/30"
                          : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-slate-800 dark:text-slate-100">
                          {row.full_name || `User ${row.user_id.slice(0, 8)}…`}
                        </div>
                        <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          New
                        </span>
                      </div>

                      {typeof row.age === "number" && (
                        <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          Age {row.age}
                        </div>
                      )}

                      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(row.created_at).toLocaleString()}
                      </div>
                    </button>
                  ))}

                  {!pending.length && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-3 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                      No pending requests.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/30">
                <div className="mb-3 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-rose-500 dark:text-rose-300" />
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Review submission
                  </h2>
                </div>
                {!previewUserId ? (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                    Select a user from the queue to review their images.
                  </div>
                ) : (
                  <div className="space-y-4 text-sm">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                      <span className="font-medium">User ID:</span>{" "}
                      <span className="font-mono text-[11px]">
                        {previewUserId}
                      </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {previewImages.map((img) => (
                        <a
                          key={img.name}
                          href={img.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900"
                        >
                          <img
                            src={img.url}
                            alt={img.name}
                            className="h-40 w-full object-cover"
                          />
                        </a>
                      ))}
                      {!previewImages.length && (
                        <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-3 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                          No images found for this user.
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        onClick={() => approve(previewUserId)}
                        disabled={kycBusy}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {kycBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => reject(previewUserId)}
                        disabled={kycBusy}
                        className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-60"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {tab === "users" && (
            <section className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/30">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500 dark:text-indigo-300" />
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Users
                  </h2>
                </div>
                <div className="hidden text-[11px] text-slate-500 dark:text-slate-400 sm:inline-flex">
                  Basic moderation tools: ban/unban, promote/demote.
                </div>
              </div>

              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, email…"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                  />
                </div>
                <button
                  onClick={refreshUsers}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Search
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      <th className="py-2 pr-4 text-left">ID</th>
                      <th className="py-2 pr-4 text-left">Name</th>
                      <th className="py-2 pr-4 text-left">Email</th>
                      <th className="py-2 pr-4 text-left">Verified</th>
                      <th className="py-2 pr-4 text-left">Banned</th>
                      <th className="py-2 pr-4 text-left">Admin</th>
                      <th className="py-2 pr-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isAdmin = !!(u.is_admin || u.admin);
                      return (
                        <tr
                          key={u.id}
                          className="border-t border-slate-100 dark:border-slate-800"
                        >
                          <td className="py-2 pr-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {u.id.slice(0, 8)}…
                          </td>
                          <td className="py-2 pr-4">
                            {u.full_name || (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">
                            {u.email || "—"}
                          </td>
                          <td className="py-2 pr-4">
                            {u.verified ? (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                                Yes
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                No
                              </span>
                            )}
                          </td>
                          <td className="py-2 pr-4">
                            {u.banned ? (
                              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                                Yes
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                No
                              </span>
                            )}
                          </td>
                          <td className="py-2 pr-4">
                            {isAdmin ? (
                              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                                Yes
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                No
                              </span>
                            )}
                          </td>
                          <td className="py-2 pr-4">
                            <div className="flex flex-wrap gap-2">
                              <Link
                                to={`/admin/users/${u.id}`}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                View
                              </Link>

                              <button
                                onClick={() => toggleBan(u)}
                                disabled={userBusyId === u.id}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                {u.banned ? "Unban" : "Ban"}
                              </button>
                              <button
                                onClick={() => toggleAdmin(u)}
                                disabled={userBusyId === u.id}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                {isAdmin ? "Demote" : "Promote"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!users.length && (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                        >
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>

        <AppFooter />
      </div>
    </div>
  );
}