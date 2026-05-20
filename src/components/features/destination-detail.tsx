"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  MapPin,
  MessageSquare,
  Navigation,
  Sparkles,
  Star,
  Tag,
  BedDouble,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ACCOMMODATIONS, PREFERENCE_META } from "@/lib/mock-data";
import { useVibeStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import type { Destination } from "@/lib/types";

interface DestinationDetailProps {
  destination: Destination | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelectStay?: (accommodationId: string) => void;
}

const PRICE_SYMBOLS = ["", "฿", "฿฿", "฿฿฿"] as const;
const SEASON_LABELS: Record<string, string> = {
  spring: "Spring",
  summer: "Summer",
  autumn: "Autumn",
  winter: "Winter",
  all: "Year-round",
};

export function DestinationDetail({
  destination,
  open,
  onOpenChange,
  onSelectStay,
}: DestinationDetailProps) {
  const router = useRouter();
  const [shared, setShared] = React.useState(false);

  const activeGroupId = useVibeStore((s) => s.activeGroupId);
  const groups = useVibeStore((s) => s.groups);
  const addMessage = useVibeStore((s) => s.addMessage);
  const user = useVibeStore((s) => s.user);
  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? groups[0] ?? null;

  const stays = React.useMemo(
    () => ACCOMMODATIONS.filter((a) => a.destinationId === destination?.id).slice(0, 3),
    [destination?.id]
  );

  if (!destination) return null;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${destination.coords.lat},${destination.coords.lng}`;
  const prefMeta = PREFERENCE_META[destination.tripType];

  const shareToChat = () => {
    if (!activeGroup || !user) return;
    addMessage(activeGroup.id, {
      authorId: user.id,
      authorName: `${user.firstName} ${user.lastName}`,
      authorAvatar: user.avatarDataUrl,
      content: `${destination.title}, ${destination.region}`,
      kind: "place",
      placeCard: {
        type: "destination",
        id: destination.id,
        name: `${destination.title}, ${destination.region}`,
        imageUrl: destination.imageUrl,
        subtitle: destination.tags.join(" · "),
      },
    });
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <div className="relative h-52 w-full overflow-hidden rounded-t-3xl sm:h-64">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={destination.imageUrl}
            alt={destination.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
            {destination.tags.slice(0, 2).map((t) => (
              <Badge key={t} variant="secondary" className="border-white/20 bg-white/15 text-white backdrop-blur">
                {t}
              </Badge>
            ))}
          </div>
          <div className="absolute inset-x-4 bottom-4 text-white">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-2xl font-semibold tracking-tight drop-shadow">
                {destination.title}
              </DialogTitle>
              <DialogDescription className="text-white/80">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {destination.region}
                </span>
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              <Tag className="h-3 w-3" /> {prefMeta.label}
            </Badge>
            <Badge variant="secondary">{PRICE_SYMBOLS[destination.priceLevel]}</Badge>
            <Badge variant="secondary">
              <Sparkles className="h-3 w-3" /> Best in {SEASON_LABELS[destination.season]}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Navigation className="h-3.5 w-3.5" />
            {destination.coords.lat.toFixed(4)}°, {destination.coords.lng.toFixed(4)}°
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-1 text-accent hover:underline"
            >
              Open in Maps ↗
            </a>
          </div>

          {stays.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <BedDouble className="h-3.5 w-3.5" /> Available stays
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {stays.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      if (onSelectStay) {
                        onOpenChange(false);
                        onSelectStay(a.id);
                      }
                    }}
                    className="overflow-hidden rounded-2xl border border-border/60 bg-secondary/30 text-left transition-colors hover:border-accent/50 hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none"
                    disabled={!onSelectStay}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.imageUrl}
                      alt={a.name}
                      className="h-20 w-full object-cover"
                    />
                    <div className="p-2">
                      <div className="flex items-center justify-between">
                        <span className="truncate text-xs font-semibold">{a.name}</span>
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {a.rating}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {formatCurrency(a.pricePerNight)}/night
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {activeGroup && (
              <Button variant="glass" size="sm" onClick={shareToChat} className="flex-1 sm:flex-none">
                {shared ? (
                  <><Check className="h-3.5 w-3.5" /> Shared!</>
                ) : (
                  <><MessageSquare className="h-3.5 w-3.5" /> Share to Chat</>
                )}
              </Button>
            )}
            <Button
              variant="accent"
              className="flex-1"
              onClick={() => { onOpenChange(false); router.push("/trip"); }}
            >
              <Navigation className="h-4 w-4" /> Plan this trip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
