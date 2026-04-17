// Bottom tab bar for the mobile-replica web UI. Matches the native app's
// 3-tab MainTabs: Matches / Assessment / Profile.
//
// Only visible on mobile viewports (< md) and only within .mobile-app-scope.
// Also auto-hides on detail / sub-routes so pushed screens (conversations,
// chatbot session, profile sub-pages, onboarding, auth) aren't overlaid by
// a tab bar — mirroring the native app's stack navigation.

import { Link, useLocation } from "react-router-dom";
import { Heart, Sparkles, User } from "lucide-react";

const TABS = [
  { path: "/conversations", label: "Matches", icon: Heart },
  { path: "/chatbot", label: "Assessment", icon: Sparkles },
  { path: "/profile", label: "Profile", icon: User },
] as const;

// Routes that SHOULD show the tab bar (exact match only — sub-routes hide it)
const ROOT_ROUTES = new Set<string>([
  "/conversations",
  "/chatbot",
  "/profile",
]);

export default function MobileTabBar() {
  const { pathname } = useLocation();

  // Only show on root tab routes — hide on detail / pushed screens
  // (e.g. /conversations/:id, /chatbot/session, /profile/interests, /onboarding/*).
  if (!ROOT_ROUTES.has(pathname)) return null;

  return (
    <nav
      className="mobile-app-scope m-tab-bar md:hidden"
      aria-label="Main navigation"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.path;
        const Icon = tab.icon;
        // For Heart/Sparkles a filled look reads well when active.
        // For the User silhouette, filling would turn the whole icon into
        // a solid blob — so keep stroke-only and rely on colour for state.
        const fill =
          active && tab.label !== "Profile" ? "currentColor" : "none";
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={[
              "m-tab-item",
              active ? "m-tab-item-active" : "",
            ]
              .join(" ")
              .trim()}
          >
            <Icon
              size={24}
              strokeWidth={active ? 2.25 : 1.75}
              fill={fill}
            />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
