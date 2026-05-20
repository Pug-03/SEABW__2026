"use client";

import * as React from "react";
import { Search, Sparkles, X } from "lucide-react";
import { DESTINATIONS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface SmartSearchProps {
  onSelect?: (destinationId: string) => void;
}

export function SmartSearch({ onSelect }: SmartSearchProps) {
  const [q, setQ] = React.useState("");
  const [focused, setFocused] = React.useState(false);

  const results = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return DESTINATIONS.filter(
      (d) =>
        d.title.toLowerCase().includes(query) ||
        d.region.toLowerCase().includes(query) ||
        d.tags.some((t) => t.toLowerCase().includes(query))
    ).slice(0, 6);
  }, [q]);

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div
        className={cn(
          "glass-strong flex items-center gap-3 rounded-full border px-5 py-3 shadow-lg transition-all",
          focused && "ring-2 ring-accent/40 shadow-2xl"
        )}
      >
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="Where to next? Try Phuket, Kyoto, mountain trip…"
          className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            aria-label="Clear"
            className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="hidden items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent sm:flex">
          <Sparkles className="h-3 w-3" /> Smart
        </div>
      </div>

      {focused && results.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-3xl border border-border/60 bg-card/95 shadow-xl backdrop-blur-2xl">
          {results.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                onSelect?.(d.id);
                setQ(d.title);
                setFocused(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={d.imageUrl}
                alt={d.title}
                className="h-10 w-10 rounded-xl object-cover"
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{d.title}</div>
                <div className="text-xs text-muted-foreground">
                  {d.region} · {d.tags.join(", ")}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
