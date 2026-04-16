// Bottom tab bar for the mobile-replica web UI. Matches the native app's
// 3-tab MainTabs: Matches / Assessment / Profile.
//
// Only visible on mobile viewports (< md) and only within .mobile-app-scope.

import { Link, useLocation } from "react-router-dom";
import { Heart, Sparkles, UserCircle } from "lucide-react";

const TABS = [
  { path: "/conversations", label: "Matches", icon: Heart },
  { path: "/chatbot", label: "Assessment", icon: Sparkles },
  { path: "/profile", label: "Profile", icon: UserCircle },
] as const;

export default function MobileTabBar() {
  const { pathname } = useLocation();
  return (
    <nav
      className="mobile-app-scope m-tab-bar md:hidden"
      aria-label="Main navigation"
    >
      {TABS.map((tab) => {
        const active =
          pathname === tab.path || pathname.startsWith(tab.path + "/");
        const Icon = tab.icon;
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
              strokeWidth={active ? 2 : 1.75}
              fill={active ? "currentColor" : "none"}
            />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
