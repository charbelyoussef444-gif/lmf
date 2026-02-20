import { ShieldCheck, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../theme/ThemeProvider";
import logoMark from "../assets/likeminded-mark.png";

type Props = {
  className?: string;
  showNav?: boolean;
  showVerifiedBadge?: boolean;
};

export default function AppHeader({
  className,
  showNav = true,
  showVerifiedBadge = true,
}: Props) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={`flex h-16 items-center justify-between ${className || ""}`}>
      {/* LEFT SIDE */}
      <div className="flex items-center gap-4">
        
        {/* CLICKABLE LOGO + TITLE */}
        <Link to="/" className="flex items-center gap-4">
          <img
            src={logoMark}
            alt="LikeMinded"
            className="h-[80px] w-[80px] mt-[5px] object-contain"
          />

          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">
              LikeMinded
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Compatibility-first dating
            </span>
          </div>
        </Link>

      </div>

      {/* NAV */}
      {showNav && (
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-300">
          <Link
            to="/conversations"
            className="hover:text-indigo-600 dark:hover:text-indigo-300"
          >
            Matches
          </Link>

          <Link
            to="/chatbot"
            className="hover:text-indigo-600 dark:hover:text-indigo-300"
          >
            Assessment
          </Link>

          <Link
            to="/profile"
            className="hover:text-indigo-600 dark:hover:text-indigo-300"
          >
            Profile
          </Link>
        </nav>
      )}

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3">
        {showVerifiedBadge && (
          <div className="hidden sm:inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-50/70 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-900/40 dark:text-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified community
          </div>
        )}

        {/* THEME TOGGLE */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle light/dark mode"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white/70 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-200"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </div>
    </header>
  );
}