"use client";

import * as React from "react";
import { ArrowRight, MapPin, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DESTINATIONS } from "@/lib/mock-data";
import type { Destination } from "@/lib/types";

interface SearchResultsProps {
  query: string;
  onPick?: (destinationId: string) => void;
  onClear?: () => void;
}

function matches(d: Destination, q: string): boolean {
  const needle = q.toLowerCase();
  return (
    d.title.toLowerCase().includes(needle) ||
    d.region.toLowerCase().includes(needle) ||
    d.tags.some((t) => t.toLowerCase().includes(needle)) ||
    d.tripType.toLowerCase().includes(needle)
  );
}

export function SearchResults({ query, onPick, onClear }: SearchResultsProps) {
  const results = React.useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return DESTINATIONS.filter((d) => matches(d, q));
  }, [query]);

  if (!query.trim()) return null;

  return (
    <section className="space-y-4" aria-live="polite">
      <div className="flex items-end justify-between gap-2 px-1">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            Search results
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {results.length > 0
              ? `${results.length} match${results.length === 1 ? "" : "es"} for "${query}"`
              : `No results found for "${query}"`}
          </h2>
        </div>
        {onClear && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear search
          </Button>
        )}
      </div>

      {results.length === 0 ? (
        <NoResults query={query} onClear={onClear} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((d) => (
            <ResultCard
              key={d.id}
              destination={d}
              onClick={() => onPick?.(d.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ResultCard({
  destination,
  onClick,
}: {
  destination: Destination;
  onClick?: () => void;
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="group cursor-pointer overflow-hidden outline-none transition-shadow hover:-translate-y-0.5 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative h-40 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={destination.imageUrl}
          alt={destination.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {destination.tags.slice(0, 2).map((t) => (
            <Badge
              key={t}
              variant="secondary"
              className="border-white/20 bg-white/15 text-white backdrop-blur"
            >
              {t}
            </Badge>
          ))}
        </div>
      </div>
      <CardContent className="space-y-1 p-3">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" /> {destination.region}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="text-base font-semibold tracking-tight">
            {destination.title}
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
        </div>
      </CardContent>
    </Card>
  );
}

function NoResults({
  query,
  onClear,
}: {
  query: string;
  onClear?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border/60 bg-card/50 px-6 py-12 text-center backdrop-blur-xl">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <SearchX className="h-6 w-6" />
      </div>
      <div>
        <div className="text-base font-medium">
          No results found for &quot;{query}&quot;
        </div>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Try a city, region, or vibe like &quot;beach&quot;, &quot;mountain&quot;, or &quot;foodie&quot;.
        </p>
      </div>
      {onClear && (
        <Button variant="glass" size="sm" onClick={onClear}>
          Clear search
        </Button>
      )}
    </div>
  );
}
