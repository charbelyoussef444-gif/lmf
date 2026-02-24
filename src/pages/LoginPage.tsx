// src/pages/LoginPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

function useNextParam() {
  const loc = useLocation();
  return useMemo(() => {
    const sp = new URLSearchParams(loc.search);
    return sp.get("next") || "/";
  }, [loc.search]);
}

export default function LoginPage() {
  const navigate = useNavigate();
  const next = useNextParam();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // If already logged in, go straight to next
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate(next, { replace: true });
    });
  }, [navigate, next]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErr("Email and password are required.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
        navigate(next, { replace: true });
      } else {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              // if you later use this in onboarding, it's ready:
              country: "Lebanon",
            },
          },
        });
        if (error) throw error;

        // Some projects require email confirmation; still route user forward.
        // If you enforce confirmation later, backend will 401 and api.ts will bounce back to /login anyway.
        navigate(next, { replace: true });
      }
    } catch (e: any) {
      setErr(e?.message || "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
            <h1 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {mode === "login" ? "Sign in" : "Create account"}
            </h1>
            <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Lebanon only (for now)
            </span>
          </div>

          <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
            {mode === "login"
              ? "Enter your email and password."
              : "Pick an email + password. You can finish your profile after."}
          </p>

          {err && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100">
              {err}
            </div>
          )}

          <form className="mt-5 space-y-3" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                Email
              </span>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950/40">
                <Mail className="h-4 w-4 text-slate-400" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-50"
                  placeholder="you@example.com"
                  disabled={busy}
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                Password
              </span>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950/40">
                <Lock className="h-4 w-4 text-slate-400" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-50"
                  placeholder="••••••••"
                  disabled={busy}
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-medium text-slate-50 hover:bg-black disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy
                ? mode === "login"
                  ? "Signing in…"
                  : "Creating…"
                : mode === "login"
                ? "Sign in"
                : "Create account"}
            </button>

            <button
              type="button"
              onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
              disabled={busy}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </form>
        </div>

        <div className="mt-4 text-center text-[11px] text-slate-500 dark:text-slate-400">
          If anything breaks or your session expires, you’ll be redirected back here automatically.
        </div>
      </div>
    </div>
  );
}
