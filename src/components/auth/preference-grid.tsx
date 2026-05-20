"use client";

import * as React from "react";
import {
  Waves,
  Mountain,
  Droplets,
  Building2,
  Tent,
  Palmtree,
  Landmark,
  UtensilsCrossed,
  Check,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Preference } from "@/lib/types";
import { PREFERENCE_META } from "@/lib/mock-data";

const ICONS: Record<Preference, LucideIcon> = {
  beach: Waves,
  mountain: Mountain,
  waterfall: Droplets,
  city: Building2,
  camping: Tent,
  island: Palmtree,
  culture: Landmark,
  foodie: UtensilsCrossed,
};

const GRADIENTS: Record<Preference, string> = {
  beach: "from-cyan-400/30 to-blue-500/30",
  mountain: "from-emerald-400/30 to-teal-600/30",
  waterfall: "from-sky-400/30 to-indigo-500/30",
  city: "from-zinc-400/30 to-slate-600/30",
  camping: "from-amber-400/30 to-orange-600/30",
  island: "from-emerald-300/30 to-cyan-500/30",
  culture: "from-rose-300/30 to-fuchsia-500/30",
  foodie: "from-orange-300/30 to-rose-500/30",
};

// Bento grid sizing — large, tall, wide, square cells
const SPANS: Record<Preference, string> = {
  beach: "md:col-span-2 md:row-span-2",
  mountain: "md:col-span-2",
  waterfall: "",
  city: "md:row-span-2",
  camping: "md:col-span-2",
  island: "",
  culture: "",
  foodie: "md:col-span-2",
};

interface PreferenceGridProps {
  selected: Preference[];
  onToggle: (p: Preference) => void;
}

export function PreferenceGrid({ selected, onToggle }: PreferenceGridProps) {
  const keys = Object.keys(PREFERENCE_META) as Preference[];
  return (
    <div className="grid auto-rows-[120px] grid-cols-2 gap-3 md:grid-cols-4 md:auto-rows-[140px]">
      {keys.map((p) => {
        const Icon = ICONS[p];
        const meta = PREFERENCE_META[p];
        const active = selected.includes(p);
        return (
          <button
            key={p}
            type="button"
            onClick={() => onToggle(p)}
            className={cn(
              "group relative overflow-hidden rounded-3xl border text-left transition-all duration-300",
              "border-border/60 bg-card/70 backdrop-blur-xl",
              "hover:scale-[1.02] hover:shadow-xl hover:border-accent/40",
              active && "border-accent ring-2 ring-accent/50 shadow-lg",
              SPANS[p]
            )}
          >
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity",
                GRADIENTS[p],
                active && "opacity-100"
              )}
            />
            <div className="relative flex h-full flex-col justify-between p-4">
              <Icon
                className={cn(
                  "h-7 w-7 transition-transform group-hover:scale-110",
                  active ? "text-accent-foreground" : "text-foreground/80"
                )}
              />
              <div>
                <div className="text-sm font-semibold tracking-tight">
                  {meta.label}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {meta.description}
                </div>
              </div>
            </div>
            {active && (
              <div className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-accent text-accent-foreground shadow-md">
                <Check className="h-3.5 w-3.5" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
