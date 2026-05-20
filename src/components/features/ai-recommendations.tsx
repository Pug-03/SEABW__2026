"use client";

import * as React from "react";
import { BedDouble, Info, MapPin, Sparkles, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AccommodationDetail } from "@/components/features/accommodation-detail";
import { ACCOMMODATIONS, PREFERENCE_META } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import type {
  Accommodation,
  Destination,
  GeoCoords,
  Preference,
} from "@/lib/types";

interface AIRecProps {
  destination: Destination;
  preferences: Preference[];
  remainingBudget: number;
  showHeader?: boolean;
  origin?: GeoCoords | null;
}

interface ScoredAccommodation {
  accommodation: Accommodation;
  score: number;
  reasons: string[];
  withinBudget: boolean;
  matchedPrefs: Preference[];
}

function scoreAccommodation(
  a: Accommodation,
  destination: Destination,
  preferences: Preference[],
  remainingBudget: number
): ScoredAccommodation {
  let score = 0;
  const reasons: string[] = [];
  if (a.destinationId === destination.id) {
    score += 5;
    reasons.push(`Located in ${destination.title}`);
  }
  const matchedPrefs = a.tags.filter((t) => preferences.includes(t));
  if (matchedPrefs.length > 0) {
    score += matchedPrefs.length * 3;
    reasons.push(
      `Fits your ${matchedPrefs
        .map((p) => PREFERENCE_META[p].label.toLowerCase())
        .join(" + ")} vibe`
    );
  }
  const withinBudget =
    remainingBudget <= 0 || a.pricePerNight <= remainingBudget;
  if (withinBudget && remainingBudget > 0) {
    score += 2;
    reasons.push("Within group's remaining budget");
  } else if (!withinBudget) {
    score -= 2;
    reasons.push("Over current budget — splurge option");
  }
  score += (a.rating - 4) * 2;
  return { accommodation: a, score, reasons, withinBudget, matchedPrefs };
}

export function AIRecommendationsCard({
  destination,
  preferences,
  remainingBudget,
  showHeader = true,
  origin,
}: AIRecProps) {
  const [openId, setOpenId] = React.useState<string | null>(null);

  const ranked = React.useMemo(() => {
    return ACCOMMODATIONS.map((a) =>
      scoreAccommodation(a, destination, preferences, remainingBudget)
    )
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [destination, preferences, remainingBudget]);

  const opened = ranked.find((r) => r.accommodation.id === openId);

  return (
    <div className="space-y-3">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold tracking-tight">
            Stays picked for your crew
          </h4>
          <Badge variant="ai">
            <Sparkles className="h-3 w-3" /> AI
          </Badge>
        </div>
      )}
      <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ranked.map(({ accommodation, reasons, withinBudget }, idx) => (
          <AccommodationCard
            key={accommodation.id}
            a={accommodation}
            reasons={reasons}
            featured={idx === 0}
            withinBudget={withinBudget}
            onOpen={() => setOpenId(accommodation.id)}
          />
        ))}
      </div>

      <AccommodationDetail
        accommodation={opened?.accommodation ?? null}
        open={!!opened}
        onOpenChange={(v) => !v && setOpenId(null)}
        origin={origin}
        matchedPreferences={opened?.matchedPrefs}
        withinBudget={opened?.withinBudget ?? true}
      />
    </div>
  );
}

interface AccCardProps {
  a: Accommodation;
  reasons: string[];
  featured: boolean;
  withinBudget: boolean;
  onOpen: () => void;
}

function AccommodationCard({
  a,
  reasons,
  featured,
  withinBudget,
  onOpen,
}: AccCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group flex h-full cursor-pointer flex-col overflow-hidden outline-none transition-shadow hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative h-32 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={a.imageUrl}
          alt={a.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {featured && (
            <Badge variant="ai">
              <Sparkles className="h-3 w-3" /> AI Recommended for you
            </Badge>
          )}
          {!withinBudget && <Badge variant="warning">Over budget</Badge>}
        </div>
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-xs text-white">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {a.rating}
        </div>
      </div>
      <CardContent className="flex flex-1 flex-col p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-tight">
              {a.name}
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{a.address}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatCurrency(a.pricePerNight)} / night ·{" "}
              {a.reviewCount.toLocaleString()} reviews
            </div>
          </div>
          <BedDouble className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
        {reasons.length > 0 ? (
          <p className="mt-2 line-clamp-2 min-h-9 text-[11px] leading-4 text-muted-foreground">
            {reasons.join(" · ")}
          </p>
        ) : (
          <div className="mt-2 min-h-9" aria-hidden />
        )}
        <div className="mt-auto grid grid-cols-2 items-end gap-2 pt-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-11 w-full"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            <Info className="h-3.5 w-3.5" /> Details
          </Button>
          <Button
            variant="accent"
            size="sm"
            className="h-11 w-full"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            Book Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
