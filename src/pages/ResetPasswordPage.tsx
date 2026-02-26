// src/pages/ResetPasswordPage.tsx
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  LogIn,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";

function getHashParam(key: string): string | null {
  const raw = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;

  if (!raw) return null;

  const params = new URLSearchParams(raw);
  return params.get(key);
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);
  const [hasRecovery, setHasRecovery] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const minOk = useMemo(() => password.length >= 6, [password]);
  const matchOk = useMemo(() => password === confirm, [password, confirm]);

  useEffect(() => {
    let alive = true;

    const init = async () => {
      setError(null);
      setNotice(null);

      const type = getHashParam("type");
      const hasToken =
        !!getHashParam("access_token") || !!getHashParam("refresh_token");

      const { data } = await supabase.auth.getSession();
      const sessionExists = !!data.session;

      if (!alive) return;

      const recovery = type === "recovery" || hasToken || sessionExists;

      setHasRecovery(recovery);
      setReady(true);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      if (session) setHasRecovery(true);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function onSetPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!minOk) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!matchOk) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setNotice("Password updated. You can sign in now.");
      setPassword("");
      setConfirm("");

      await supabase.auth.signOut();

      window.setTimeout(() => navigate("/login", { replace: true }), 650);
    } catch (e: any) {
      setError(e?.message || "Could not update password.");
    } finally {
      setBusy(false);
    }
  }

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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/60 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/40"
          >
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-300">
              Password reset
            </div>
            <h1 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-50">
              Set a new password
            </h1>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Choose a new password for your account.
            </p>

            {!ready ? (
              <div className="mt-6 text-sm text-slate-600 dark:text-slate-300">
                Loading…
              </div>
            ) : !hasRecovery ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <div>
                    <div className="font-semibold">Invalid or expired link</div>
                    <div className="mt-1 text-xs opacity-90">
                      Go back to login and request a new reset email.
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                    >
                      <LogIn className="h-4 w-4" />
                      Back to login
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={onSetPassword} className="mt-6 space-y-3 text-sm">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
                  New password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-10 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
                  Confirm new password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-10 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="pt-1 text-xs text-slate-500 dark:text-slate-400">
                  Minimum 6 characters.
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110 disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Update password
                </button>

                {notice && (
                  <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-300">
                    {notice}
                  </div>
                )}
                {error && (
                  <div className="mt-3 text-xs text-rose-600 dark:text-rose-300">
                    {error}
                  </div>
                )}
              </form>
            )}
          </motion.div>
        </main>

        <AppFooter />
      </div>
    </div>
  );
}
