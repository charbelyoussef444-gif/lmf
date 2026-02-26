// src/theme/ThemeProvider.tsx
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const match = document.cookie.match(/(?:^|;\s*)theme=(dark|light)/);
  if (match) return match[1] as Theme;

  // ✅ default ALWAYS light
  return "light";
}

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Applies theme-specific background + blob styling.
 * This controls the global purple/pink glow.
 */
function applyThemeVars(theme: Theme) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;

  if (theme === "dark") {
    /* DARK MODE */

    root.style.setProperty("--app-bg", "#070711");
    root.style.setProperty("--app-text", "#f8fafc");

    root.style.setProperty("--blob-opacity", "0.65");
    root.style.setProperty("--blob-blur", "95px");

    root.style.setProperty("--blob-1", "rgba(139, 92, 246, 0.70)");
    root.style.setProperty("--blob-2", "rgba(236, 72, 153, 0.60)");
    root.style.setProperty("--blob-3", "rgba(99, 102, 241, 0.50)");
    root.style.setProperty("--blob-4", "rgba(244, 63, 94, 0.40)");

    root.style.setProperty("--grain-opacity", "0.08");
  } else {
    /* LIGHT MODE (boosted visibility) */

    /* softened background so glow is visible */
    root.style.setProperty("--app-bg", "#f4f4ff");
    root.style.setProperty("--app-text", "#111827");

    /* stronger glow */
    root.style.setProperty("--blob-opacity", "0.8");
    root.style.setProperty("--blob-blur", "85px");

    /* richer colors for visibility */
    root.style.setProperty("--blob-1", "rgba(139, 92, 246, 0.75)");
    root.style.setProperty("--blob-2", "rgba(236, 72, 153, 0.65)");
    root.style.setProperty("--blob-3", "rgba(99, 102, 241, 0.55)");
    root.style.setProperty("--blob-4", "rgba(244, 63, 94, 0.45)");

    root.style.setProperty("--grain-opacity", "0.06");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;

    // Tailwind dark mode hook
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");

    root.setAttribute("data-theme", theme);

    // ✅ apply blob + background styling
    applyThemeVars(theme);

    // persist preference
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `theme=${theme}; path=/; max-age=${maxAge}`;
  }, [theme]);

  const toggleTheme = () =>
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, setTheme: setThemeState }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
