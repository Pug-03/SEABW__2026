"use client";

import * as React from "react";
import { MapPin, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Destination } from "@/lib/types";
import { DESTINATIONS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface SeasonalCarouselProps {
  destinations?: Destination[];
  onSelect?: (id: string) => void;
}

export function SeasonalCarousel({
  destinations = DESTINATIONS,
  onSelect,
}: SeasonalCarouselProps) {
  const [paused, setPaused] = React.useState(false);
  // Duplicate the list to enable a seamless -50% translate loop.
  const looped = React.useMemo(
    () => [...destinations, ...destinations],
    [destinations]
  );

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between px-1">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            <Sparkles className="h-3 w-3" /> Seasonal picks
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Trending this season
          </h2>
        </div>
        <p className="hidden text-sm text-muted-foreground sm:block">
          Hover to pause · {destinations.length} destinations
        </p>
      </div>

      <div
        className="group relative overflow-hidden rounded-3xl"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Edge fade masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background to-transparent" />

        <div
          className={cn(
            "flex gap-4 will-change-transform animate-marquee-x",
            paused && "[animation-play-state:paused]"
          )}
          style={{ width: "max-content" }}
        >
          {looped.map((d, idx) => (
            <DestinationCard
              key={`${d.id}-${idx}`}
              destination={d}
              onClick={() => onSelect?.(d.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface DestinationCardProps {
  destination: Destination;
  onClick?: () => void;
}

function DestinationCard({ destination, onClick }: DestinationCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group/card relative shrink-0 overflow-hidden rounded-3xl border border-border/60 bg-card text-left shadow-sm transition-all",
        "hover:-translate-y-1 hover:shadow-xl",
        // 5 cards visible on desktop (~ 1/5 of container) - use fixed widths for predictability
        "w-[78vw] sm:w-[44vw] md:w-[30vw] lg:w-[18vw] xl:w-[220px]"
      )}
      style={{ aspectRatio: "3/4" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={destination.imageUrl}
        alt={destination.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
        <div className="flex flex-wrap gap-1">
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
        <div>
          <div className="flex items-center gap-1 text-[11px] text-white/80">
            <MapPin className="h-3 w-3" /> {destination.region}
          </div>
          <div className="text-lg font-semibold tracking-tight">
            {destination.title}
          </div>
        </div>
      </div>
    </button>
  );
}
