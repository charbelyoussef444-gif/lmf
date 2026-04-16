// Wraps all mobile-app-replica content so CSS variables (--m-*) only apply
// inside this scope. Outside of .mobile-app-scope, the global desktop theme
// is completely unaffected.
//
// Usage: every mobile-only page wraps its content in <MobileAppShell>.
// The shell applies mobile-specific background, font, and reserves bottom
// space for the fixed tab bar (unless `bare` is set).

import type { ReactNode } from "react";

interface MobileAppShellProps {
  children: ReactNode;
  /** Set true when the screen should occupy the full viewport (no tab bar
   *  space, used on auth/onboarding screens that aren't in MainTabs). */
  bare?: boolean;
  /** Extra class names on the scope wrapper */
  className?: string;
}

export default function MobileAppShell({
  children,
  bare = false,
  className,
}: MobileAppShellProps) {
  return (
    <div
      className={[
        "mobile-app-scope",
        "m-screen",
        "flex flex-col",
        bare ? "" : "pb-[calc(64px+env(safe-area-inset-bottom,0px))]",
        className || "",
      ]
        .join(" ")
        .trim()}
    >
      {children}
    </div>
  );
}
