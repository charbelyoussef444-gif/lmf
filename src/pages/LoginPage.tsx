// lmf/src/pages/LoginPage.tsx
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  Lock,
  User2,
  LogIn,
  UserPlus,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../auth/AuthProvider";
import { api } from "../lib/api";

import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";

type CityRow = { id: number; city: string; admin_name?: string | null };

const LOCKED_COUNTRY = "Lebanon";
const DEFAULT_MAX_DISTANCE_KM = 80;

// onboarding persistence
const ONBOARDING_FLAG_KEY = "lmf_onboarding_active_v1";
const ONBOARDING_FORM_KEY = "lmf_onboarding_form_v1";

type OnboardingDraft = {
  age: string;
  cityId: string;
  prefMin: string;
  prefMax: string;
  prefGender: "women" | "men" | "everyone" | null;
  selfGender: "woman" | "man" | "nonbinary" | null;
};

function readDraft(): OnboardingDraft | null {
  try {
    const raw = sessionStorage.getItem(ONBOARDING_FORM_KEY);
    return raw ? (JSON.parse(raw) as OnboardingDraft) : null;
  } catch {
    return null;
  }
}

function writeDraft(d: OnboardingDraft) {
  try {
    sessionStorage.setItem(ONBOARDING_FORM_KEY, JSON.stringify(d));
  } catch {}
}

function clearDraft() {
  try {
    sessionStorage.removeItem(ONBOARDING_FORM_KEY);
    sessionStorage.removeItem(ONBOARDING_FLAG_KEY);
  } catch {}
}

// Accent-insensitive, case-insensitive folding
function foldToAsciiLike(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

type SelectOption = { value: string; label: string };

function SearchableDropdown({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectedLabel = useMemo(() => {
    if (!value) return "";
    return options.find((o) => o.value === value)?.label ?? "";
  }, [options, value]);

  const filtered = useMemo(() => {
    const key = foldToAsciiLike(q);
    if (!key) return options;
    return options.filter((o) => foldToAsciiLike(o.label).includes(key));
  }, [options, q]);

  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  // When selection changes, reset query (prevents stale filter)
  useEffect(() => {
    setQ("");
  }, [value]);

  return (
    <div className="relative" ref={rootRef}>
      <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
        }}
        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
      >
        <span className={value ? "" : "text-slate-400 dark:text-slate-500"}>
          {value ? selectedLabel : placeholder}
        </span>
        <span className="ml-2 text-slate-400 dark:text-slate-500">▾</span>
      </button>

      <AnimatePresence>
        {open && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="border-b border-slate-100 p-2 dark:border-slate-700">
              <div className="relative">
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Type to filter…"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-9 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                />

                {q && (
                  <button
                    type="button"
                    onClick={() => {
                      setQ("");
                      requestAnimationFrame(() => inputRef.current?.focus());
                    }}
                    aria-label="Clear filter"
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-56 overflow-auto p-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                  No matches.
                </div>
              ) : (
                filtered.map((opt) => {
                  const active = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                        active
                          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
                          : "text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LoginPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ default redirect should be landing ("/"), not "/conversations"
  const from = (location.state as any)?.from?.pathname || "/";

  const initialPhase: "auth" | "onboarding" = (() => {
    const forced = (location.state as any)?.onboarding === true;
    const persisted = sessionStorage.getItem(ONBOARDING_FLAG_KEY) === "1";
    return forced || persisted ? "onboarding" : "auth";
  })();

  const [phase, setPhase] = useState<"auth" | "onboarding">(initialPhase);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sign in form
  const [emailIn, setEmailIn] = useState("");
  const [passwordIn, setPasswordIn] = useState("");
  const [showPasswordIn, setShowPasswordIn] = useState(false);

  // Sign up form
  const [fullName, setFullName] = useState("");
  const [emailUp, setEmailUp] = useState("");
  const [passwordUp, setPasswordUp] = useState("");
  const [confirmUp, setConfirmUp] = useState("");
  const [showPasswordUp, setShowPasswordUp] = useState(false);
  const [showConfirmUp, setShowConfirmUp] = useState(false);

  // Onboarding form
  const [age, setAge] = useState("");

  // ✅ Lebanon-only cities
  const [cities, setCities] = useState<CityRow[]>([]);
  const [cityId, setCityId] = useState<string>("");

  const [prefMin, setPrefMin] = useState("");
  const [prefMax, setPrefMax] = useState("");

  const [prefGender, setPrefGender] = useState<
    "women" | "men" | "everyone" | null
  >(null);
  const [selfGender, setSelfGender] = useState<
    "woman" | "man" | "nonbinary" | null
  >(null);

  function clearMsgs() {
    setNotice(null);
    setError(null);
  }

  // If a signed-in user lands on /login normally, just send them to "from".
  useEffect(() => {
    if (!user) return;
    if (phase !== "auth") return;
    navigate(from, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ✅ Load cities for Lebanon when onboarding opens
  useEffect(() => {
    if (phase !== "onboarding") return;

    // persist onboarding state so refresh keeps popup
    sessionStorage.setItem(ONBOARDING_FLAG_KEY, "1");

    let alive = true;
    (async () => {
      try {
        const list = (await api.getCities(LOCKED_COUNTRY)) as CityRow[];
        if (!alive) return;
        setCities(list);
      } catch (e: any) {
        if (!alive) return;
        setCities([]);
        setCityId("");
        setError(e?.message || "Could not load cities.");
      }
    })();

    return () => {
      alive = false;
    };
  }, [phase]);

  const cityOptions = useMemo<SelectOption[]>(() => {
    return cities.map((c) => {
      const label = `${c.city}${c.admin_name ? `, ${c.admin_name}` : ""}`;
      return { value: String(c.id), label };
    });
  }, [cities]);

  // ✅ Restore draft once when onboarding is active
  useEffect(() => {
    if (phase !== "onboarding") return;
    const d = readDraft();
    if (!d) return;

    setAge(d.age ?? "");
    setCityId(d.cityId ?? "");
    setPrefMin(d.prefMin ?? "");
    setPrefMax(d.prefMax ?? "");
    setPrefGender(d.prefGender ?? null);
    setSelfGender(d.selfGender ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ✅ Auto-save draft while onboarding
  useEffect(() => {
    if (phase !== "onboarding") return;
    writeDraft({ age, cityId, prefMin, prefMax, prefGender, selfGender });
  }, [phase, age, cityId, prefMin, prefMax, prefGender, selfGender]);

  async function onSignIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearMsgs();
    setBusy(true);
    try {
      sessionStorage.setItem("post_login_redirect", from);
      const { error } = await supabase.auth.signInWithPassword({
        email: emailIn,
        password: passwordIn,
      });
      if (error) throw error;
      navigate(from, { replace: true });
    } catch (e: any) {
      setError(e?.message || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  // Google Sign-In — mirrors lmm/src/services/auth.ts signInWithGoogle().
  // Same Supabase call (signInWithIdToken / provider 'google'), same Google
  // Web Client ID configured in App.tsx, so web and mobile resolve to the
  // same Supabase user for the same Google account.
  async function onGoogleSignIn(resp: CredentialResponse) {
    clearMsgs();
    const idToken = resp.credential;
    if (!idToken) {
      setError("Google sign in cancelled.");
      return;
    }
    setBusy(true);
    try {
      sessionStorage.setItem("post_login_redirect", from);
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });
      if (error) throw error;
      navigate(from, { replace: true });
    } catch (e: any) {
      setError(e?.message || "Could not sign in with Google.");
    } finally {
      setBusy(false);
    }
  }

  async function onForgotPassword() {
    clearMsgs();
    if (!emailIn) {
      setError("Enter your email above, then click Forgot password.");
      return;
    }
    setBusy(true);
    try {
      // IMPORTANT: this should be your reset-password route (see section 3)
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(emailIn, {
        redirectTo,
      });
      if (error) throw error;
      setNotice("If an account exists for this email, you’ll receive a reset link shortly.");
    } catch (e: any) {
      setError(e?.message || "Could not send reset link.");
    } finally {
      setBusy(false);
    }
  }

  async function onSignUp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearMsgs();

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (passwordUp.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (passwordUp !== confirmUp) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      sessionStorage.setItem("post_login_redirect", from);

      await api.trackEvent({
        event_name: "signup_started",
        properties: { method: "email" },
      });

      // Keep your existing callback if you use it for email confirmation.
      // For password reset, we use /reset-password above.
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { data, error } = await supabase.auth.signUp({
        email: emailUp,
        password: passwordUp,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: fullName,
            country: LOCKED_COUNTRY,
          },
        },
      });
      if (error) throw error;

      if (!data.user || !data.session) {
        setNotice("Account created! Check your email to confirm your address.");
        return;
      }

      // persist + open onboarding
      sessionStorage.setItem(ONBOARDING_FLAG_KEY, "1");
      setPhase("onboarding");
    } catch (e: any) {
      setError(e?.message || "Sign up failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onCompleteOnboarding(
    e: FormEvent<HTMLFormElement>
  ): Promise<void> {
    e.preventDefault();
    clearMsgs();

    const ageNum = Number(age);
    if (!age || Number.isNaN(ageNum)) {
      setError("Please enter your age.");
      return;
    }
    if (ageNum < 18 || ageNum > 99) {
      setError("Age must be between 18 and 99.");
      return;
    }
    if (!selfGender) {
      setError("Please select your gender.");
      return;
    }
    if (!cityId) {
      setError("Please select your city.");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        age: ageNum,
        location_id: Number(cityId),
        gender: selfGender,
        preferred_min_age: prefMin ? Number(prefMin) : null,
        preferred_max_age: prefMax ? Number(prefMax) : null,
        preferred_gender: prefGender,

        // ✅ fixed default, no UI
        preferred_max_distance_km: DEFAULT_MAX_DISTANCE_KM,
      };

      await api.completeOnboarding(payload);

      await api.trackEvent({
        event_name: "signup_completed",
        properties: { step: "onboarding_saved" },
      });

      // ✅ clear persistence only after success
      clearDraft();

      navigate(from, { replace: true });
    } catch (e: any) {
      setError(e?.message || "Could not save your preferences.");
    } finally {
      setBusy(false);
    }
  }

  // Signed-in compact panel
  if (user && phase === "auth") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-50 transition-colors duration-300">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute -top-32 left-0 right-0 mx-auto h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,140,248,0.25),_transparent_60%)] blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,_rgba(244,114,182,0.18),_transparent_60%)] blur-3xl" />
        </div>

        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
          <AppHeader />

          <main className="flex flex-1 items-center justify-center py-10">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md"
            >
              <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/60 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/40">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-300">
                  <ShieldCheck className="h-5 w-5" />
                  <h1 className="text-sm font-semibold">You’re signed in</h1>
                </div>

                <div className="mt-4 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      Name:
                    </span>{" "}
                    {user.name || "—"}
                  </div>
                  <div>
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      Email:
                    </span>{" "}
                    {user.email || "—"}
                  </div>
                </div>

                <div className="mt-6 grid gap-3 text-sm">
                  <button
                    onClick={() => navigate(from)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 px-4 py-2 font-medium text-white shadow-md hover:brightness-110"
                  >
                    <LogIn className="h-4 w-4" /> Continue
                  </button>
                  <button
                    onClick={signOut}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/70 px-4 py-2 font-medium text-slate-800 hover:border-indigo-400 hover:text-indigo-700 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-rose-400 dark:hover:text-rose-200"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </motion.div>
          </main>

          <AppFooter />
        </div>
      </div>
    );
  }

  // Auth + onboarding
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-50 transition-colors duration-300">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-0 right-0 mx-auto h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,140,248,0.25),_transparent_60%)] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,_rgba(244,114,182,0.18),_transparent_60%)] blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        <AppHeader />

        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/60 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-300">
                    Sign in to continue
                  </div>
                  <h1 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-50">
                    Welcome back to LikeMinded
                  </h1>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    Use your email to sign in. We’ll only use this to manage your
                    account and matches.
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-rose-500">
                  <ShieldCheck className="h-4 w-4 text-white" />
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-5 grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    clearMsgs();
                  }}
                  className={`rounded-xl py-1.5 transition ${
                    mode === "signin"
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-50"
                      : "hover:text-indigo-600 dark:hover:text-indigo-300"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    clearMsgs();
                  }}
                  className={`rounded-xl py-1.5 transition ${
                    mode === "signup"
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-50"
                      : "hover:text-indigo-600 dark:hover:text-indigo-300"
                  }`}
                >
                  Create account
                </button>
              </div>

              {/* Panels */}
              <div className="relative mt-4">
                <div className="h-px bg-slate-100 dark:bg-slate-700" />
                <AnimatePresence mode="popLayout" initial={false}>
                  {mode === "signin" ? (
                    <motion.div
                      key="signin-panel"
                      initial={{ x: 24, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -24, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                    >
                      <form onSubmit={onSignIn} className="space-y-3 pt-4 text-sm">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
                          Email address
                        </label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="email"
                            value={emailIn}
                            onChange={(e) => setEmailIn(e.target.value)}
                            required
                            placeholder="you@example.com"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-9 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                          />
                        </div>

                        <label className="mt-3 block text-xs font-medium text-slate-700 dark:text-slate-200">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type={showPasswordIn ? "text" : "password"}
                            value={passwordIn}
                            onChange={(e) => setPasswordIn(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-10 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswordIn((v) => !v)}
                            aria-label={
                              showPasswordIn ? "Hide password" : "Show password"
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          >
                            {showPasswordIn ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400 dark:border-slate-600"
                              defaultChecked
                            />
                            Remember for 30 days
                          </label>
                          <button
                            type="button"
                            onClick={onForgotPassword}
                            className="font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                          >
                            Forgot password
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={busy}
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110 disabled:opacity-60"
                        >
                          <LogIn className="h-4 w-4" />
                          Sign in
                        </button>

                        <div className="relative my-4 flex items-center">
                          <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
                          <span className="mx-3 text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            or continue with
                          </span>
                          <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
                        </div>

                        <div className="flex justify-center">
                          <GoogleLogin
                            onSuccess={onGoogleSignIn}
                            onError={() =>
                              setError("Could not sign in with Google.")
                            }
                            useOneTap={false}
                            theme="outline"
                            size="large"
                            text="continue_with"
                            shape="pill"
                            width="320"
                          />
                        </div>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="signup-panel"
                      initial={{ x: -24, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 24, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                    >
                      <form onSubmit={onSignUp} className="space-y-3 pt-4 text-sm">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
                          Full name
                        </label>
                        <div className="relative">
                          <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            placeholder="Alex Johnson"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-9 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                          />
                        </div>

                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
                          Email address
                        </label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="email"
                            value={emailUp}
                            onChange={(e) => setEmailUp(e.target.value)}
                            required
                            placeholder="you@example.com"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-9 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                          />
                        </div>

                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type={showPasswordUp ? "text" : "password"}
                            value={passwordUp}
                            onChange={(e) => setPasswordUp(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-10 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswordUp((v) => !v)}
                            aria-label={
                              showPasswordUp ? "Hide password" : "Show password"
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          >
                            {showPasswordUp ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
                          Confirm password
                        </label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type={showConfirmUp ? "text" : "password"}
                            value={confirmUp}
                            onChange={(e) => setConfirmUp(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-10 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmUp((v) => !v)}
                            aria-label={
                              showConfirmUp ? "Hide password" : "Show password"
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          >
                            {showConfirmUp ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={busy}
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-black disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                        >
                          <UserPlus className="h-4 w-4" />
                          Create account
                        </button>

                        <div className="relative my-4 flex items-center">
                          <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
                          <span className="mx-3 text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            or sign up with
                          </span>
                          <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
                        </div>

                        <div className="flex justify-center">
                          <GoogleLogin
                            onSuccess={onGoogleSignIn}
                            onError={() =>
                              setError("Could not sign in with Google.")
                            }
                            useOneTap={false}
                            theme="outline"
                            size="large"
                            text="signup_with"
                            shape="pill"
                            width="320"
                          />
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {notice && (
                <div className="mt-4 text-xs text-emerald-600 dark:text-emerald-300">
                  {notice}
                </div>
              )}
              {error && (
                <div className="mt-3 text-xs text-rose-600 dark:text-rose-300">
                  {error}
                </div>
              )}

              <div className="mt-6 text-center text-xs text-slate-600 dark:text-slate-300">
                {mode === "signin" ? (
                  <>
                    Don’t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("signup")}
                      className="font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("signin")}
                      className="font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </main>

        <AppFooter />
      </div>

      {/* Onboarding sheet */}
      {phase === "onboarding" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900/95"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Set up your profile
                </h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  This helps us match you with people who actually fit your pace
                  and preferences.
                </p>
              </div>
            </div>

            <form
              onSubmit={onCompleteOnboarding}
              className="mt-4 space-y-3 text-sm"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-200">
                  Your age
                </label>
                <input
                  type="number"
                  min={18}
                  max={99}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                  required
                />
              </div>

              {/* Country (locked display) */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-200">
                  Country
                </label>
                <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200">
                  {LOCKED_COUNTRY}
                </div>
              </div>

              {/* City */}
              <SearchableDropdown
                label="City"
                value={cityId}
                onChange={(v) => {
                  setCityId(v);
                  clearMsgs();
                }}
                options={cityOptions}
                placeholder="Select a city"
                disabled={cities.length === 0}
              />

              {/* Your gender */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-200">
                  Your gender
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "woman" as const, label: "Woman" },
                    { value: "man" as const, label: "Man" },
                    { value: "nonbinary" as const, label: "Non-binary" },
                  ].map((opt) => {
                    const active = selfGender === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelfGender(opt.value)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          active
                            ? "border-slate-900 bg-slate-900 text-slate-50 shadow-sm dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                            : "border-slate-300 bg-white text-slate-700 hover:border-indigo-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-400"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-200">
                  Preferred age range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={18}
                    max={99}
                    value={prefMin}
                    onChange={(e) => setPrefMin(e.target.value)}
                    placeholder="Min"
                    className="w-1/2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                  />
                  <input
                    type="number"
                    min={18}
                    max={99}
                    value={prefMax}
                    onChange={(e) => setPrefMax(e.target.value)}
                    placeholder="Max"
                    className="w-1/2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                  />
                </div>
              </div>

              {/* Gender preference */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-200">
                  Gender preference
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["women", "men", "everyone"] as const).map((g) => {
                    const active = prefGender === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setPrefGender(g)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          active
                            ? "border-rose-500 bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 text-white shadow-sm"
                            : "border-slate-300 bg-white text-slate-700 hover:border-indigo-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-400"
                        }`}
                      >
                        {g[0].toUpperCase() + g.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2 text-xs">
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 px-4 py-2 font-semibold text-white shadow-md hover:brightness-110 disabled:opacity-60"
                >
                  Save and continue
                </button>
              </div>

              {error && (
                <div className="mt-3 text-xs text-rose-600 dark:text-rose-300">
                  {error}
                </div>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
