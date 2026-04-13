// src/lib/api.ts
import { supabase } from "./supabaseClient";

const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

/** Gallery photo with review status (matches backend /me/photos shape) */
export type GalleryPhotoStatus = "pending" | "approved" | "rejected";

export type GalleryPhotoSlot = {
  position: 1 | 2 | 3;
  url: string;
  status: GalleryPhotoStatus;
  rejection_reason: string | null;
};

/** Admin: pending gallery review queue row */
export type AdminPendingGalleryRow = {
  user_id: string;
  full_name: string | null;
  age: number | null;
  pending_count: number;
  oldest_pending_at: string | null;
};

/** Admin: full gallery review payload for a single user */
export type AdminGalleryReview = {
  user_id: string;
  full_name: string | null;
  age: number | null;
  selfie_url: string | null;
  photos: Array<{
    position: 1 | 2 | 3;
    url: string;
    status: GalleryPhotoStatus;
    rejection_reason: string | null;
  }>;
};

/** Chatbot response type (matches backend: updated_traits) */
export type ChatbotResponse = {
  reply: string;
  phase?: "self" | "pref" | "done";
  updated_traits?: Record<string, number>; // keys are trait_id as strings, e.g. "5"
  attributes?: Record<string, number>;
  progress?: {
    self_filled?: number;
    self_total?: number;
    pref_filled?: number;
    pref_total?: number;
  };
};

/** Chatbot history type (matches /chatbot/history) */
export type ChatbotHistoryResponse = {
  messages: Array<{
    role: "assistant" | "user";
    content: string;
    ts: string;
  }>;
  phase: "self" | "pref" | "done";
  progress: {
    self_filled: number;
    self_total: number;
    pref_filled?: number;
    pref_total?: number;
  };
};

/** Personality traits from DB + per-user score */
export type Trait = {
  id: number;
  name: string;
  description: string | null;
  score?: number | null;
};

/** Assessment start response */
export type AssessmentStartResponse = {
  ok: boolean;
  attempt_id: string;
};

/* ---------- Types ---------- */
export type Conversation = {
  id: string;
  partnerName: string;
  partnerAge?: number;
  partnerCity?: string;
  lastMessage?: string;
  lastAt?: string;
  compatibility?: number | null;
  unread?: number;
};

export type Msg = {
  id: string;
  role: "me" | "them";
  text?: string;
  ts: number;
};

/** Match API response types */
export type MatchIneligible = {
  status: "ineligible";
  user_id: string;
  reason: string;
};

export type MatchNoMatch = {
  status: "no_match";
  user_id: string;
};

export type MatchSuccess = {
  status: "matched";
  user_a_id: string;
  user_b_id: string;
  score: number;
  conversation_id: string;
};

export type MatchStatus = {
  eligible: boolean;
  reason?: string | null;
  missing?: string[];
  checks?: {
    verified: boolean;
    assessment_completed: boolean;
    not_banned: boolean;
    has_interest: boolean;
    has_photos: boolean;
    photos_count?: number;
    interests_count?: number;
  };
  next_eligible_ts_utc?: string | null;
};

export type MatchResponse = MatchIneligible | MatchNoMatch | MatchSuccess;

/** NEW: Match feedback (24h prompt) */
export type MatchFeedbackStatus = {
  conversation_id: string;
  is_24h_passed: boolean;
  already_answered: boolean;
  should_prompt: boolean;
  my_response?: boolean | null;
};

export type MatchFeedbackResult = {
  conversation_id: string;
  saved: boolean;
  both_yes: boolean;
  photos_unlocked: boolean;
};

/** Profile returned by /me, /me/weights, /me/preferences */
export type ProfileResponse = {
  id: string;
  full_name: string;
  gender?: string | null;
  age?: number | null;

  // UPDATED: location now comes from locations table
  location_id?: number | null;
  location_label?: string | null;

  personality_weight: number;
  interests_weight: number;
  verified: boolean;
  admin?: boolean;
  is_admin?: boolean;

  preferred_min_age?: number | null;
  preferred_max_age?: number | null;
  preferred_gender?: "women" | "men" | "everyone" | null;

  // NEW
  preferred_max_distance_km?: number | null;

  last_login_at?: string | null;

  // Soft-delete
  deleted_at?: string | null;
  scheduled_purge_at?: string | null;
};

/** Analytics tracking types */
export type TrackEventIn = {
  event_name:
    | "signup_started"
    | "signup_completed"
    | "assessment_started"
    | "assessment_completed"
    | "match_shown"
    | "match_opened"
    | "message_sent"
    | "message_received"
    | "paywall_viewed"
    | "subscribe_clicked"
    | "subscription_active"
    | "app_opened";

  event_id?: string;
  session_id?: string;
  ts?: string;

  conversation_id?: string;
  message_id?: string;
  other_user_id?: string;

  properties?: Record<string, any>;
};

export type AdminUserJourneySummary = {
  user: {
    id: string;
    full_name?: string | null;
    verified?: boolean;
    banned?: boolean;
    admin?: boolean;
    created_at?: string | null;
    last_active?: string | null;
    gender?: string | null;
    age?: number | null;
    location?: string | null;
    gender_pref?: string | null;
    preferred_min_age?: number | null;
    preferred_max_age?: number | null;
    active_chats?: number | null;
  } | null;
  flags: {
    signup_completed: boolean;
    assessment_completed: boolean;
    match_opened: boolean;
    message_sent: boolean;
    subscription_active: boolean;
  };
  latest_events?: Array<{ event_name: string; ts: string }>;
};

export type AdminUserEventRow = {
  id: number;
  ts: string;
  event_name: string;
  session_id: string;
  properties: Record<string, any>;
};

/* ---------- NEW: Reporting types ---------- */
export type ReportReason =
  | "spam"
  | "harassment"
  | "scam"
  | "hate"
  | "sexual"
  | "impersonation"
  | "other";

export type ReportCreateIn = {
  conversation_id: string;
  reason: ReportReason;
  details?: string;
};

export type ReportCreateOut = {
  id: string;
};

/* ---------- NEW: Landing stats ---------- */
export type WaitlistCountResponse = { count: number };

/* ---------- NEW: Locations ---------- */
export type CountryRow = { country: string };
export type CityRow = { id: number; city: string; admin_name?: string | null };

/* ---------- Core fetch with Supabase bearer ---------- */
async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/login")) return;

  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.assign(`/login?next=${next}`);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init.headers);

  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { ...init, headers });
  } catch (e) {
    // Network / DNS / CORS / server down — you asked to force login on problems
    redirectToLogin();
    throw e;
  }

  if (res.status === 401) {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    const msg = await res.text().catch(() => "");
    redirectToLogin();
    throw new Error(`Unauthorized${msg ? `: ${msg}` : ""}`);
  }

  // 410 Gone — account permanently deleted (past 7-day window)
  if (res.status === 410) {
    try {
      localStorage.clear();
      sessionStorage.clear();
      await supabase.auth.signOut();
    } catch { /* ignore */ }
    redirectToLogin();
    throw new Error("Account has been permanently deleted");
  }

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${msg ? `: ${msg}` : ""}`);
  }

  // ✅ FIX: 204 No Content must not attempt json()
  if (res.status === 204) {
    return null as unknown as T;
  }

  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json")
    ? ((await res.json()) as T)
    : ((await res.text()) as unknown as T);
}

/* ---------- analytics: session id helper ---------- */
const SESSION_KEY = "lm_session_id";
function getOrCreateSessionId(): string {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

/* ---------- last active ping helper ---------- */
const PING_KEY = "lm_last_active_ping_once_v1";
const ONE_HOUR_MS = 60 * 60 * 1000;

function shouldPingOncePerTab(): boolean {
  const now = Date.now();
  const last = sessionStorage.getItem(PING_KEY);
  if (!last) return true;
  const lastNum = Number(last);
  if (Number.isNaN(lastNum)) return true;
  return now - lastNum > ONE_HOUR_MS;
}

/* ---------- single in-flight guard for chatbot ---------- */
let chatbotMessageInFlight: Promise<ChatbotResponse> | null = null;

/* ---------- API surface (matches your FastAPI backend) ---------- */
export const api = {
  // Health
  health: () => request<{ ok: boolean }>("/healthz"),

  // ✅ Landing: public stats (no auth)
  waitlistCount: () => request<WaitlistCountResponse>("/waitlist-count"),

  // Profile / weights / interests
  me: () => request<ProfileResponse>("/me"),

  // Soft-delete my account (7-day recovery window)
  deleteMe: () =>
    request<{ message: string; deleted_at: string; scheduled_purge_at: string }>("/me", { method: "DELETE" }),

  // Recover a soft-deleted account within the 7-day window
  recoverMe: () =>
    request<{ message: string }>("/me/recover", { method: "POST" }),

  // Locations for dropdowns
  getCountries: () => request<CountryRow[]>("/me/locations/countries"),
  getCities: (country: string) => {
    const qs = new URLSearchParams({ country }).toString();
    return request<CityRow[]>(`/me/locations/cities?${qs}`);
  },

  mePingOncePerTab: async () => {
    try {
      if (!shouldPingOncePerTab()) return { ok: true };
      sessionStorage.setItem(PING_KEY, String(Date.now()));
      return await request<{ ok: boolean; last_login_at?: string }>("/me/ping", {
        method: "POST",
      });
    } catch {
      return { ok: true };
    }
  },

  myInterests: () =>
    request<Array<{ id: number; name: string; category?: string | null }>>(
      "/me/interests"
    ),

  allInterests: () =>
    request<Array<{ id: number; name: string; category?: string | null }>>(
      "/me/interests/all"
    ),

  putInterests: (names: string[]) =>
    request<Array<{ id: number; name: string; category?: string | null }>>(
      "/me/interests",
      {
        method: "PUT",
        body: JSON.stringify(names.map((n) => ({ name: n }))),
      }
    ),

  putWeights: (personality_weight: number, interests_weight: number) =>
    request<ProfileResponse>("/me/weights", {
      method: "PUT",
      body: JSON.stringify({ personality_weight, interests_weight }),
    }),

  updateMatchPreferences: (payload: {
    preferred_min_age: number | null;
    preferred_max_age: number | null;
    preferred_gender: "women" | "men" | "everyone" | null;
    preferred_max_distance_km: number | null;
  }) =>
    request<ProfileResponse>("/me/preferences", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  // Photos — fixed 3-slot array; null = empty slot
  myPhotos: () => request<Array<GalleryPhotoSlot | null>>("/me/photos"),

  uploadGalleryPhoto: (file: File, position: 1 | 2 | 3) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("position", String(position));
    return request<{ ok: true; photo_id: string; path: string }>(
      "/me/photos/gallery",
      { method: "POST", body: fd }
    );
  },

  deleteGalleryPhoto: (position: 1 | 2 | 3) =>
    request<null>(`/me/photos/gallery/${position}`, { method: "DELETE" }),

  uploadVerificationId: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<{ ok: true; photo_id: string; path: string }>(
      "/me/photos/verification",
      { method: "POST", body: fd }
    );
  },

  conversationPhotos: (cid: string) =>
    request<string[]>(`/conversations/${cid}/photos`),

  // KYC
  meKycStatus: () =>
    request<{
      status: "unverified" | "pending" | "verified";
      reasons: Array<{ reason: string; created_at: string }>;
    }>("/me/kyc/status"),

  meKycUpload: (files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    return request<{ ok: boolean; count: number }>("/me/kyc/upload", {
      method: "POST",
      body: fd,
    });
  },

  meKycCancel: () =>
    request<{ ok: boolean }>("/me/kyc/cancel", { method: "DELETE" }),

  // Conversations & messages
  conversations: () => request<Conversation[]>("/conversations"),
  thread: (cid: string) => request<Msg[]>(`/conversations/${cid}/messages`),

  sendMessage: (cid: string, text: string) =>
    request<Msg>(`/conversations/${cid}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  markRead: (cid: string) =>
    request<null>(`/conversations/${cid}/read`, { method: "POST" }),
  endConversation: (cid: string) =>
    request<null>(`/conversations/${cid}/end`, { method: "POST" }),

  reportUser: (payload: ReportCreateIn) =>
    request<ReportCreateOut>("/reports", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  matchFeedbackStatus: (cid: string) =>
    request<MatchFeedbackStatus>(`/conversations/${cid}/match-feedback/status`),

  submitMatchFeedback: (cid: string, response: boolean) =>
    request<MatchFeedbackResult>(`/conversations/${cid}/match-feedback`, {
      method: "POST",
      body: JSON.stringify({ response }),
    }),

  // Matching
  matchStatus: () => request<MatchStatus>("/matching/status"),
  match: () => request<MatchResponse>("/matching/generate", { method: "POST" }),

  // Chatbot
  chatbotMessage: (message: string) => {
    if (chatbotMessageInFlight) return chatbotMessageInFlight;

    chatbotMessageInFlight = request<ChatbotResponse>("/chatbot/message", {
      method: "POST",
      body: JSON.stringify({ message }),
    }).finally(() => {
      chatbotMessageInFlight = null;
    });

    return chatbotMessageInFlight;
  },

  chatbotHistory: () => request<ChatbotHistoryResponse>("/chatbot/history"),
  listPersonalityTraits: () => request<Trait[]>("/traits"),

  assessmentStart: () =>
    request<AssessmentStartResponse>("/assessment/start", { method: "POST" }),

  trackEvent: async (payload: TrackEventIn) => {
    try {
      const body = {
        event_id: payload.event_id ?? crypto.randomUUID(),
        session_id: payload.session_id ?? getOrCreateSessionId(),
        event_name: payload.event_name,
        ts: payload.ts,
        conversation_id: payload.conversation_id,
        message_id: payload.message_id,
        other_user_id: payload.other_user_id,
        properties: payload.properties || {},
      };

      return await request<{ ok: boolean; deduped?: boolean }>("/events", {
        method: "POST",
        body: JSON.stringify(body),
      });
    } catch {
      return { ok: true };
    }
  },

  /* ---------- Admin ---------- */
  adminListPendingKyc: () =>
    request<
      Array<{
        user_id: string;
        created_at: string;
        full_name?: string | null;
        age?: number | null;
      }>
    >("/admin/kyc/pending"),

  adminKycImages: (userId: string) =>
    request<{
      user_id: string;
      full_name?: string | null;
      age?: number | null;
      images: Array<{ name: string; url: string }>;
    }>(`/admin/kyc/${userId}/images`),

  adminApproveKyc: (userId: string, idNumber: string) =>
    request<{ ok: boolean }>(`/admin/kyc/${userId}/approve`, {
      method: "POST",
      body: JSON.stringify({ id_number: idNumber }),
    }),

  adminRejectKyc: (userId: string, reason: string) =>
    request<{ ok: boolean }>(`/admin/kyc/${userId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  /* ---- Admin: gallery photo review ---- */
  adminListPendingGallery: () =>
    request<AdminPendingGalleryRow[]>("/admin/gallery/pending"),

  adminGetUserGallery: (userId: string) =>
    request<AdminGalleryReview>(`/admin/gallery/${userId}`),

  adminApprovePhoto: (userId: string, position: 1 | 2 | 3) =>
    request<{ ok: boolean }>(
      `/admin/gallery/${userId}/photos/${position}/approve`,
      { method: "POST" }
    ),

  adminRejectPhoto: (
    userId: string,
    position: 1 | 2 | 3,
    reason: string
  ) =>
    request<{ ok: boolean }>(
      `/admin/gallery/${userId}/photos/${position}/reject`,
      { method: "POST", body: JSON.stringify({ reason }) }
    ),

  adminApproveAllGallery: (userId: string) =>
    request<{ ok: boolean; updated: number }>(
      `/admin/gallery/${userId}/approve-all`,
      { method: "POST" }
    ),

  adminRejectAllGallery: (userId: string, reason: string) =>
    request<{ ok: boolean; updated: number }>(
      `/admin/gallery/${userId}/reject-all`,
      { method: "POST", body: JSON.stringify({ reason }) }
    ),

  adminListUsers: (q?: string, limit = 50, offset = 0) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (limit) params.set("limit", String(limit));
    if (offset) params.set("offset", String(offset));
    const qs = params.toString();

    return request<
      Array<{
        id: string;
        full_name?: string | null;
        email?: string | null;
        verified?: boolean;
        banned?: boolean;
        admin?: boolean;
        is_admin?: boolean;
        created_at?: string;
      }>
    >(`/admin/users${qs ? `?${qs}` : ""}`);
  },

  adminBan: (userId: string) =>
    request<{ ok: boolean }>(`/admin/users/${userId}/ban`, { method: "POST" }),

  adminUnban: (userId: string) =>
    request<{ ok: boolean }>(`/admin/users/${userId}/unban`, { method: "POST" }),

  adminPromote: (userId: string) =>
    request<{ ok: boolean }>(`/admin/users/${userId}/promote`, { method: "POST" }),

  adminDemote: (userId: string) =>
    request<{ ok: boolean }>(`/admin/users/${userId}/demote`, { method: "POST" }),

  adminUserSummary: (userId: string) =>
    request<AdminUserJourneySummary>(`/admin/users/${userId}/summary`),

  adminUserEvents: (
    userId: string,
    params?: { limit?: number; offset?: number; event?: string; since?: string; until?: string }
  ) => {
    const sp = new URLSearchParams();
    if (params?.limit != null) sp.set("limit", String(params.limit));
    if (params?.offset != null) sp.set("offset", String(params.offset));
    if (params?.event) sp.set("event", params.event);
    if (params?.since) sp.set("since", params.since);
    if (params?.until) sp.set("until", params.until);
    const qs = sp.toString();

    return request<AdminUserEventRow[]>(
      `/admin/users/${userId}/events${qs ? `?${qs}` : ""}`
    );
  },

  adminPurgeExpired: () =>
    request<{ purged: number; errors: number; error_ids: string[] }>("/me/purge-expired", {
      method: "DELETE",
    }),

  completeOnboarding: (payload: {
    age: number;
    location_id: number | null;
    gender: "woman" | "man" | "nonbinary" | null;
    preferred_min_age: number | null;
    preferred_max_age: number | null;
    preferred_gender: "women" | "men" | "everyone" | null;
    preferred_max_distance_km?: number | null;
  }) =>
    request<ProfileResponse>("/me/onboarding", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};
