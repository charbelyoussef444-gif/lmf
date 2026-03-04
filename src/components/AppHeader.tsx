// src/components/AppHeader.tsx
import { useEffect, useMemo, useState } from "react";
import { Moon, Sun, User2, LogIn } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../theme/ThemeProvider";
import { api } from "../lib/api";
import logoMark from "../assets/likeminded-mark.png";

type Props = {
  className?: string;
  showNav?: boolean;

  // ✅ new prop name
  showUserBadge?: boolean;

  // ✅ backwards compatibility with old usage
  showVerifiedBadge?: boolean;

  signInPath?: string; // default "/login"
};

export default function AppHeader({
  className,
  showNav = true,
  showUserBadge,
  showVerifiedBadge,
  signInPath = "/login",
}: Props) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const [fullName, setFullName] = useState<string | null>(null);

  const shouldShowUserBadge = showUserBadge ?? (showVerifiedBadge ?? true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const me = await api.me();
        if (!alive) return;
        setFullName(me?.full_name ?? null);
      } catch {
        if (!alive) return;
        setFullName(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const activePath = location.pathname;

  const isActive = useMemo(() => {
    const norm = (p: string) => (p.endsWith("/") && p !== "/" ? p.slice(0, -1) : p);
    const cur = norm(activePath);

    const startsWithExact = (base: string) => {
      const b = norm(base);
      if (b === "/") return cur === "/";
      return cur === b || cur.startsWith(b + "/");
    };

    return {
      conversations: startsWithExact("/conversations"),
      chatbot: startsWithExact("/chatbot"),
      profile: startsWithExact("/profile"),
    };
  }, [activePath]);

  // ✅ ONLY color active text (no bg)
  const navLinkClass = (active: boolean) =>
    [
      "relative rounded-full px-3 py-1.5 transition text-xs font-medium",
      active
        ? "text-indigo-600 dark:text-indigo-300"
        : "text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300",
    ].join(" ");

  return (
    <header className={`flex h-16 items-center justify-between ${className || ""}`}>
      {/* LEFT SIDE */}
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-4">
          <img
            src={logoMark}
            alt="LikeMinded"
            className="h-[80px] w-[80px] mt-[5px] object-contain"
          />

          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">LikeMinded</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Compatibility-first dating
            </span>
          </div>
        </Link>
      </div>

      {/* NAV */}
      {showNav && (
        <nav className="hidden md:flex items-center gap-2 text-xs font-medium">
          <Link to="/conversations" className={navLinkClass(isActive.conversations)}>
            Matches
          </Link>

          <Link to="/chatbot" className={navLinkClass(isActive.chatbot)}>
            Assessment
          </Link>

          <Link to="/profile" className={navLinkClass(isActive.profile)}>
            Profile
          </Link>
        </nav>
      )}

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3">
        {shouldShowUserBadge && (
          <>
            {fullName ? (
              <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/70 px-3 py-1 text-[11px] font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200">
                <User2 className="h-3.5 w-3.5 opacity-80" />
                <span className="max-w-[160px] truncate">{fullName}</span>
              </div>
            ) : (
              <Link
                to={signInPath}
                className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/70 px-3 py-1 text-[11px] font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-200"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign in
              </Link>
            )}
          </>
        )}

        {/* THEME TOGGLE */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle light/dark mode"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white/70 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-200"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
