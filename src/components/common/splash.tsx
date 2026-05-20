"use client";

import { Loader2 } from "lucide-react";
import { Logo } from "@/components/common/logo";

export function Splash({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="flex flex-col items-center gap-3">
        <Logo />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {label}
        </div>
      </div>
    </div>
  );
}
