// src/theme/ThemeProvider.tsx
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";

  // 1) Respect saved choice first
  const match = document.cookie.match(/(?:^|;\s*)theme=(dark|light)/);
  if (match) return match[1] as Theme;

  // 2) ✅ Default is ALWAYS light (ignore system preference)
  return "light";
}

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Apply theme-specific CSS variables for "world class" background blobs.
 * This keeps styling centralized in ThemeProvider while still using CSS vars.
 */
function applyThemeVars(theme: Theme) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;

  // You can tune these later without touching CSS files.
  if (theme === "dark") {
    root.style.setProperty("--app-bg", "#070711");
    root.style.setProperty("--app-text", "#f8fafc");

    root.style.setProperty("--blob-opacity", "0.65");
    root.style.setProperty("--blob-blur", "90px");

    root.style.setProperty("--blob-1", "rgba(168, 85, 247, 0.65)"); // purple
    root.style.setProperty("--blob-2", "rgba(236, 72, 153, 0.55)"); // pink
    root.style.setProperty("--blob-3", "rgba(99, 102, 241, 0.45)"); // indigo
    root.style.setProperty("--blob-4", "rgba(244, 63, 94, 0.35)");  // rose

    root.style.setProperty("--grain-opacity", "0.08");
  } else {
    root.style.setProperty("--app-bg", "#f9fafb");
    root.style.setProperty("--app-text", "#111827");

    root.style.setProperty("--blob-opacity", "0.55");
    root.style.setProperty("--blob-blur", "70px");

    root.style.setProperty("--blob-1", "rgba(168, 85, 247, 0.55)"); // purple
    root.style.setProperty("--blob-2", "rgba(236, 72, 153, 0.45)"); // pink
    root.style.setProperty("--blob-3", "rgba(99, 102, 241, 0.35)"); // indigo
    root.style.setProperty("--blob-4", "rgba(244, 63, 94, 0.28)");  // rose

    root.style.setProperty("--grain-opacity", "0.06");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;

    // Tailwind dark mode hook (your @custom-variant dark uses .dark)
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");

    // Optional attribute hook (nice for debugging / styling)
    root.setAttribute("data-theme", theme);

    // ✅ Apply your per-theme "bg stuff" via CSS variables
    applyThemeVars(theme);

    // Persist choice
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `theme=${theme}; path=/; max-age=${maxAge}`;
  }, [theme]);

  const toggleTheme = () =>
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
