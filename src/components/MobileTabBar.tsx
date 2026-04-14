// src/components/MobileTabBar.tsx
// Bottom tab bar shown only on mobile viewports for authenticated users.
// Mirrors the native app's 3-tab navigation: Matches, Assessment, Profile.

import { Link, useLocation } from "react-router-dom";
import { Heart, Sparkles, UserCircle } from "lucide-react";

const TABS = [
  {
    path: "/conversations",
    label: "Matches",
    icon: Heart,
  },
  {
    path: "/chatbot",
    label: "Assessment",
    icon: Sparkles,
  },
  {
    path: "/profile",
    label: "Profile",
    icon: UserCircle,
  },
] as const;

export default function MobileTabBar() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex md:hidden border-t border-slate-200/60 bg-slate-50/95 backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-950/95">
      {TABS.map((tab) => {
        const active =
          pathname === tab.path || pathname.startsWith(tab.path + "/");
        const Icon = tab.icon;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={[
              "flex flex-1 flex-col items-center gap-0.5 pb-[env(safe-area-inset-bottom,8px)] pt-2 text-[11px] font-medium transition-colors",
              active
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-400 dark:text-slate-500",
            ].join(" ")}
          >
            <Icon
              className="h-6 w-6"
              fill={active ? "currentColor" : "none"}
              strokeWidth={active ? 1.5 : 2}
            />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
