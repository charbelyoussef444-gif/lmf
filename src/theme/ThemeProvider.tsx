// src/theme/ThemeProvider.tsx
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Theme = "light" | "dark";

/**
 * Dark mode is muted for now:
 * - We always render "light"
 * - We still keep the cookie so you can re-enable later without migrations
 */
function getInitialTheme(): Theme {
  return "light";
}

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;

    // ✅ Hard force light mode (mute dark)
    root.classList.remove("dark");

    // Keep cookie consistent (always light for now)
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `theme=light; path=/; max-age=${maxAge}`;

    // Also keep state consistent
    if (theme !== "light") setThemeState("light");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = (_t: Theme) => {
    // muted — always light
    setThemeState("light");
    if (typeof window !== "undefined") {
      document.documentElement.classList.remove("dark");
      const maxAge = 60 * 60 * 24 * 365;
      document.cookie = `theme=light; path=/; max-age=${maxAge}`;
    }
  };

  const toggleTheme = () => {
    // muted — no-op (stays light)
    setTheme("light");
  };

  return (
    <ThemeContext.Provider value={{ theme: "light", toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
