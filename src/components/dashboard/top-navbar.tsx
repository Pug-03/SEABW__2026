"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut, MessageSquare, Plane, RefreshCw, Settings, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import type { User } from "@/lib/types";
import { useVibeStore } from "@/lib/store";

interface TopNavbarProps {
  user: User | null;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

export function TopNavbar({
  user,
  onOpenSettings,
  onOpenProfile,
}: TopNavbarProps) {
  const router = useRouter();
  const reset = useVibeStore((s) => s.reset);
  const setUser = useVibeStore((s) => s.setUser);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleSwitchAccount = () => {
    setMenuOpen(false);
    setUser(null);
    router.push("/");
  };

  const handleLogout = () => {
    setMenuOpen(false);
    reset();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="glass-strong flex items-center justify-between gap-2 rounded-2xl px-3 py-2 shadow-sm">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSettings}
              aria-label="Open settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <div className="hidden sm:block">
              <Logo />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/trip")}
              className="hidden sm:inline-flex"
            >
              <MessageSquare className="h-4 w-4" /> Trips
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/trip")}
              className="sm:hidden"
              aria-label="Trips"
            >
              <Plane className="h-4 w-4" />
            </Button>
            <ThemeToggle />

            <div ref={menuRef} className="relative ml-1">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-full ring-1 ring-border/60 transition-shadow hover:ring-accent/50"
                aria-label="Account menu"
                aria-expanded={menuOpen}
              >
                <Avatar className="h-9 w-9">
                  {user?.avatarDataUrl && (
                    <AvatarImage src={user.avatarDataUrl} alt={user.firstName} />
                  )}
                  <AvatarFallback>
                    {user
                      ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`
                      : "VT"}
                  </AvatarFallback>
                </Avatar>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-11 z-50 w-48 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl backdrop-blur-xl">
                  {user && (
                    <div className="border-b border-border/60 px-3 py-2">
                      <div className="truncate text-sm font-medium">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        @{user.nickname}
                      </div>
                    </div>
                  )}
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent/10"
                    onClick={() => { setMenuOpen(false); onOpenProfile(); }}
                  >
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    Profile
                  </button>
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent/10"
                    onClick={handleSwitchAccount}
                  >
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    Switch account
                  </button>
                  <button
                    className="flex w-full items-center gap-2 border-t border-border/60 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
