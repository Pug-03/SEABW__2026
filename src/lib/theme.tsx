/**
 * @file Light/dark theme provider for the app.
 *
 * Tailwind's `dark:` variants react to the `.dark` class on `<html>`,
 * so this provider's job is simply to:
 *   1. Decide the initial theme (saved preference > OS preference > light).
 *   2. Mirror that choice to `documentElement.classList` and `localStorage`.
 *   3. Expose `toggle()` / `setTheme()` to consumers via `useTheme()`.
 *
 * Mounted near the top of `app/layout.tsx`.
 */

"use client";

import * as React from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Theme = "light" | "dark";

interface ThemeCtx {
  /** Currently active theme. */
  theme: Theme;
  /** Flip between light and dark. */
  toggle: () => void;
  /** Set the theme directly to a specific value. */
  setTheme: (t: Theme) => void;
}

// LocalStorage key for the persisted theme choice.
const STORAGE_KEY = "vibe-theme";

// React context — `null` outside the provider so `useTheme` can throw.
const Ctx = React.createContext<ThemeCtx | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

/**
 * Wrap the app (or a subtree) with `<ThemeProvider>` to enable theming.
 *
 * On first paint the theme defaults to `"light"` (SSR-safe). Once mounted
 * on the client, the saved/preferred theme is read and applied.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // SSR-safe initial value — replaced by the effect below on the client.
  const [theme, setTheme] = React.useState<Theme>("light");

  // Read the previously saved theme (or OS preference) once, on mount.
  React.useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme | null) || null;
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
  }, []);

  // Sync the theme to <html class="dark"> and localStorage on every change.
  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Memoized so consumers don't re-render just because the callback changed.
  const toggle = React.useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    []
  );

  return (
    <Ctx.Provider value={{ theme, toggle, setTheme }}>{children}</Ctx.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Read and update the current theme.
 *
 * @throws If called outside `<ThemeProvider>`.
 */
export function useTheme() {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useTheme must be used within ThemeProvider");
  return v;
}
