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
  Images,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  api,
  type AdminGalleryReview,
  type AdminPendingGalleryRow,
} from "../lib/api";

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
  const [tab, setTab] = useState<"kyc" | "gallery" | "users">("kyc");

  const [pending, setPending] = useState<PendingKycRow[]>([]);
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<
    Array<{ name: string; url: string }>
  >([]);
  const [kycBusy, setKycBusy] = useState(false);
  const [idNumber, setIdNumber] = useState("");

  // Gallery review state
  const [galleryPending, setGalleryPending] = useState<AdminPendingGalleryRow[]>(
    []
  );
  const [galleryPreviewUserId, setGalleryPreviewUserId] = useState<string | null>(
    null
  );
  const [galleryPreview, setGalleryPreview] = useState<AdminGalleryReview | null>(
    null
  );
  const [galleryBusy, setGalleryBusy] = useState(false);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [userBusyId, setUserBusyId] = useState<string | null>(null);

  // Purge expired soft-deleted accounts
  const [purgeBusy, setPurgeBusy] = useState(false);
  const [purgeResult, setPurgeResult] = useState<{ purged: number; errors: number } | null>(null);

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
    if (tab === "gallery") refreshGalleryPending();
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
      setIdNumber("");
      const imgs = await api.adminKycImages(userId);
      setPreviewImages(imgs.images);
    } catch (e) {
      console.error(e);
      setPreviewImages([]);
    }
  }

  async function approve(userId: string) {
    const trimmed = idNumber.trim();
    if (!trimmed) {
      alert("Please enter the ID number from the document before approving.");
      return;
    }
    if (!confirm("Approve verification?")) return;
    setKycBusy(true);
    try {
      await api.adminApproveKyc(userId, trimmed);
      setIdNumber("");
      await refreshPending();
      setPreviewUserId(null);
      setPreviewImages([]);
    } catch (e: any) {
      const msg =
        e?.message || e?.body?.detail || "Approve failed.";
      alert(msg);
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

  /* ---- Gallery review helpers ---- */

  async function refreshGalleryPending() {
    try {
      const rows = await api.adminListPendingGallery();
      setGalleryPending(rows);
      if (galleryPreviewUserId) {
        try {
          const review = await api.adminGetUserGallery(galleryPreviewUserId);
          setGalleryPreview(review);
        } catch {
          setGalleryPreview(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function openGalleryPreview(userId: string) {
    setGalleryPreviewUserId(userId);
    try {
      const review = await api.adminGetUserGallery(userId);
      setGalleryPreview(review);
    } catch (e) {
      console.error(e);
      setGalleryPreview(null);
    }
  }

  async function afterGalleryAction() {
    // If the user has no more pending photos, drop them from the queue view.
    await refreshGalleryPending();
    if (galleryPreviewUserId) {
      try {
        const review = await api.adminGetUserGallery(galleryPreviewUserId);
        const stillHasPending = review.photos.some(
          (p) => p.status === "pending"
        );
        if (!stillHasPending) {
          setGalleryPreviewUserId(null);
          setGalleryPreview(null);
        } else {
          setGalleryPreview(review);
        }
      } catch {
        setGalleryPreviewUserId(null);
        setGalleryPreview(null);
      }
    }
  }

  async function approvePhoto(userId: string, position: 1 | 2 | 3) {
    setGalleryBusy(true);
    try {
      await api.adminApprovePhoto(userId, position);
      await afterGalleryAction();
    } catch (e: any) {
      alert(e?.message || "Approve failed.");
    } finally {
      setGalleryBusy(false);
    }
  }

  async function rejectPhoto(userId: string, position: 1 | 2 | 3) {
    const reason = prompt("Why is this photo rejected?");
    if (!reason?.trim()) return;
    setGalleryBusy(true);
    try {
      await api.adminRejectPhoto(userId, position, reason.trim());
      await afterGalleryAction();
    } catch (e: any) {
      alert(e?.message || "Reject failed.");
    } finally {
      setGalleryBusy(false);
    }
  }

  async function approveAllPhotos(userId: string) {
    if (!confirm("Approve ALL pending photos for this user?")) return;
    setGalleryBusy(true);
    try {
      await api.adminApproveAllGallery(userId);
      await afterGalleryAction();
    } catch (e: any) {
      alert(e?.message || "Approve all failed.");
    } finally {
      setGalleryBusy(false);
    }
  }

  async function rejectAllPhotos(userId: string) {
    const reason = prompt(
      "Enter a single rejection reason to apply to ALL pending photos:"
    );
    if (!reason?.trim()) return;
    setGalleryBusy(true);
    try {
      await api.adminRejectAllGallery(userId, reason.trim());
      await afterGalleryAction();
    } catch (e: any) {
      alert(e?.message || "Reject all failed.");
    } finally {
      setGalleryBusy(false);
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

  async function handlePurgeExpired() {
    if (!confirm("Permanently delete all accounts that have been soft-deleted for 7+ days?")) return;
    setPurgeBusy(true);
    setPurgeResult(null);
    try {
      const res = await api.adminPurgeExpired();
      setPurgeResult({ purged: res.purged, errors: res.errors });
    } catch {
      setPurgeResult({ purged: 0, errors: -1 });
    } finally {
      setPurgeBusy(false);
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
                  onClick={() => setTab("gallery")}
                  className={`rounded-full px-3 py-1.5 transition ${
                    tab === "gallery"
                      ? "bg-slate-900 text-slate-50 dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  Gallery review
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

              <button
                onClick={handlePurgeExpired}
                disabled={purgeBusy}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
              >
                {purgeBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                Purge deleted accounts
              </button>
              {purgeResult && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {purgeResult.errors === -1
                    ? "Failed"
                    : `${purgeResult.purged} purged${purgeResult.errors > 0 ? `, ${purgeResult.errors} errors` : ""}`}
                </span>
              )}
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
              KYC
            </button>
            <button
              onClick={() => setTab("gallery")}
              className={`flex-1 rounded-2xl px-3 py-2 text-xs font-medium transition ${
                tab === "gallery"
                  ? "bg-slate-900 text-slate-50 dark:bg-slate-100 dark:text-slate-900"
                  : "border border-slate-200 bg-white/70 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              }`}
            >
              Gallery
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

                    {/* ID number input for duplicate check */}
                    <div className="pt-2">
                      <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        ID number (from document)
                      </label>
                      <input
                        type="text"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        placeholder="Enter the ID number shown on the document"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        onClick={() => approve(previewUserId)}
                        disabled={kycBusy || !idNumber.trim()}
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

          {tab === "gallery" && (
            <section className="grid gap-6 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)]">
              <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/30">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Images className="h-5 w-5 text-indigo-500 dark:text-indigo-300" />
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      Pending gallery reviews
                    </h2>
                  </div>
                  <button
                    onClick={refreshGalleryPending}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Refresh
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  {galleryPending.map((row) => (
                    <button
                      key={row.user_id}
                      onClick={() => openGalleryPreview(row.user_id)}
                      className={`w-full rounded-2xl border px-3 py-2 text-left transition ${
                        galleryPreviewUserId === row.user_id
                          ? "border-indigo-400 bg-indigo-50 dark:border-indigo-500/80 dark:bg-indigo-950/30"
                          : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-slate-800 dark:text-slate-100">
                          {row.full_name ||
                            `User ${row.user_id.slice(0, 8)}…`}
                        </div>
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                          {row.pending_count}
                        </span>
                      </div>

                      {typeof row.age === "number" && (
                        <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          Age {row.age}
                        </div>
                      )}

                      {row.oldest_pending_at && (
                        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          Submitted{" "}
                          {new Date(row.oldest_pending_at).toLocaleString()}
                        </div>
                      )}
                    </button>
                  ))}

                  {!galleryPending.length && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-3 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                      No pending gallery photos.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/30">
                <div className="mb-3 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-rose-500 dark:text-rose-300" />
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Review photos
                  </h2>
                </div>

                {!galleryPreviewUserId || !galleryPreview ? (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                    Select a user from the queue to review their photos.
                  </div>
                ) : (
                  <div className="space-y-4 text-sm">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                      <div>
                        <span className="font-medium">
                          {galleryPreview.full_name || "Unknown user"}
                        </span>
                        {typeof galleryPreview.age === "number" && (
                          <span className="ml-2 text-slate-400">
                            · Age {galleryPreview.age}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px]">
                        {galleryPreview.user_id}
                      </div>
                    </div>

                    {/* Verified selfie reference */}
                    <div>
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Verified selfie (reference)
                      </div>
                      {galleryPreview.selfie_url ? (
                        <a
                          href={galleryPreview.selfie_url}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-2xl border border-emerald-300/60 bg-slate-100 dark:border-emerald-500/40 dark:bg-slate-900"
                        >
                          <img
                            src={galleryPreview.selfie_url}
                            alt="verified selfie"
                            className="h-48 w-full object-cover"
                          />
                        </a>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-3 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                          No verified selfie on file.
                        </div>
                      )}
                    </div>

                    {/* Photo grid */}
                    <div>
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Gallery photos
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                        {galleryPreview.photos.map((p) => {
                          const isPending = p.status === "pending";
                          const isRejected = p.status === "rejected";
                          const isApproved = p.status === "approved";
                          return (
                            <div
                              key={p.position}
                              className={[
                                "overflow-hidden rounded-2xl border bg-slate-100 dark:bg-slate-900",
                                isRejected
                                  ? "border-2 border-rose-500"
                                  : isApproved
                                    ? "border-emerald-400"
                                    : "border-slate-200 dark:border-slate-700",
                              ].join(" ")}
                            >
                              <div className="relative">
                                <a
                                  href={p.url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <img
                                    src={p.url}
                                    alt={`Photo ${p.position}`}
                                    className="h-48 w-full object-cover"
                                  />
                                </a>
                                <span
                                  className={[
                                    "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white",
                                    isPending
                                      ? "bg-amber-500"
                                      : isRejected
                                        ? "bg-rose-600"
                                        : "bg-emerald-600",
                                  ].join(" ")}
                                >
                                  {p.status}
                                </span>
                              </div>

                              {isRejected && p.rejection_reason && (
                                <div className="border-t border-rose-200 bg-rose-50/60 px-3 py-2 text-[11px] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                                  {p.rejection_reason}
                                </div>
                              )}

                              {isPending && (
                                <div className="flex items-center justify-between gap-2 px-3 py-2">
                                  <button
                                    onClick={() =>
                                      approvePhoto(
                                        galleryPreview.user_id,
                                        p.position
                                      )
                                    }
                                    disabled={galleryBusy}
                                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() =>
                                      rejectPhoto(
                                        galleryPreview.user_id,
                                        p.position
                                      )
                                    }
                                    disabled={galleryBusy}
                                    className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-rose-700 disabled:opacity-60"
                                  >
                                    <XCircle className="h-3 w-3" />
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {!galleryPreview.photos.length && (
                          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-3 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                            No photos uploaded for this user.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Batch actions */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        onClick={() =>
                          approveAllPhotos(galleryPreview.user_id)
                        }
                        disabled={
                          galleryBusy ||
                          !galleryPreview.photos.some(
                            (p) => p.status === "pending"
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {galleryBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Approve all pending
                      </button>
                      <button
                        onClick={() =>
                          rejectAllPhotos(galleryPreview.user_id)
                        }
                        disabled={
                          galleryBusy ||
                          !galleryPreview.photos.some(
                            (p) => p.status === "pending"
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-60"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject all pending
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