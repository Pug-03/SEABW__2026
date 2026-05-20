"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Settings, MessageSquare, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import type { User } from "@/lib/types";

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
            <button
              onClick={onOpenProfile}
              className="ml-1 rounded-full ring-1 ring-border/60 transition-shadow hover:ring-accent/50"
              aria-label="Open profile"
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
          </div>
        </div>
      </div>
    </header>
  );
}
