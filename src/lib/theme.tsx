"use client";

import * as React from "react";

type Theme = "light" | "dark";

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const Ctx = React.createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>("light");

  React.useEffect(() => {
    const saved = (localStorage.getItem("vibe-theme") as Theme | null) || null;
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("vibe-theme", theme);
  }, [theme]);

  const toggle = React.useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    []
  );

  return (
    <Ctx.Provider value={{ theme, toggle, setTheme }}>{children}</Ctx.Provider>
  );
}

export function useTheme() {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useTheme must be used within ThemeProvider");
  return v;
}
