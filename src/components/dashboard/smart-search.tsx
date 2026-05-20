"use client";

import * as React from "react";
import { Search, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DESTINATIONS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface SmartSearchProps {
  initialQuery?: string;
  onSubmit: (query: string) => void;
  onClear?: () => void;
  onPickSuggestion?: (destinationId: string) => void;
}

export function SmartSearch({
  initialQuery = "",
  onSubmit,
  onClear,
  onPickSuggestion,
}: SmartSearchProps) {
  const [q, setQ] = React.useState(initialQuery);
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    setQ(initialQuery);
  }, [initialQuery]);

  const suggestions = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return DESTINATIONS.filter(
      (d) =>
        d.title.toLowerCase().includes(query) ||
        d.region.toLowerCase().includes(query) ||
        d.tags.some((t) => t.toLowerCase().includes(query))
    ).slice(0, 6);
  }, [q]);

  const submit = () => {
    onSubmit(q.trim());
    setFocused(false);
  };

  const clear = () => {
    setQ("");
    onClear?.();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="relative mx-auto w-full max-w-2xl"
      role="search"
    >
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
          aria-label="Search destinations"
          className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
        />
        {q && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="hidden items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent sm:flex">
          <Sparkles className="h-3 w-3" /> Smart
        </div>
        <Button
          type="submit"
          variant="accent"
          size="sm"
          className="hidden sm:inline-flex"
          disabled={!q.trim()}
        >
          Search
        </Button>
      </div>

      {focused && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-3xl border border-border/60 bg-card/95 shadow-xl backdrop-blur-2xl">
          {suggestions.map((d) => (
            <button
              key={d.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setQ(d.title);
                onPickSuggestion?.(d.id);
                onSubmit(d.title);
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
    </form>
  );
}
