"use client";

import * as React from "react";
import {
  BedDouble,
  Calendar,
  Check,
  Copy,
  ExternalLink,
  Info,
  LogOut,
  MapPin,
  MessageSquare,
  Navigation,
  Sparkles,
  Star,
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
import { cn, formatCurrency, haversineDistanceKm } from "@/lib/utils";
import { DESTINATIONS } from "@/lib/mock-data";
import { useVibeStore } from "@/lib/store";
import type { Accommodation, GeoCoords, Preference } from "@/lib/types";

interface AccommodationDetailProps {
  accommodation: Accommodation | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  origin?: GeoCoords | null;
  matchedPreferences?: Preference[];
  withinBudget?: boolean;
}

export function AccommodationDetail({
  accommodation,
  open,
  onOpenChange,
  origin,
  matchedPreferences = [],
  withinBudget = true,
}: AccommodationDetailProps) {
  const [activeImage, setActiveImage] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [shared, setShared] = React.useState(false);

  const activeGroupId = useVibeStore((s) => s.activeGroupId);
  const groups = useVibeStore((s) => s.groups);
  const addMessage = useVibeStore((s) => s.addMessage);
  const user = useVibeStore((s) => s.user);
  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? groups[0] ?? null;

  React.useEffect(() => {
    if (accommodation) setActiveImage(accommodation.imageUrl);
    setCopied(false);
  }, [accommodation]);

  if (!accommodation) return null;

  const destination = DESTINATIONS.find(
    (d) => d.id === accommodation.destinationId
  );
  const distanceFromYou = origin
    ? Math.round(haversineDistanceKm(origin, accommodation.coords))
    : null;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${accommodation.coords.lat},${accommodation.coords.lng}`;

  const copyAddress = async () => {
    await navigator.clipboard.writeText(accommodation.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const shareToChat = () => {
    if (!activeGroup || !user) return;
    addMessage(activeGroup.id, {
      authorId: user.id,
      authorName: `${user.firstName} ${user.lastName}`,
      authorAvatar: user.avatarDataUrl,
      content: `📍 *${accommodation.name}*\n${accommodation.address}\n💰 ${formatCurrency(accommodation.pricePerNight)}/night · ⭐ ${accommodation.rating} (${accommodation.reviewCount.toLocaleString()} reviews)`,
      kind: "text",
    });
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <div className="relative h-56 w-full overflow-hidden rounded-t-3xl sm:h-64">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeImage ?? accommodation.imageUrl}
            alt={accommodation.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
            {matchedPreferences.length > 0 && (
              <Badge variant="ai">
                <Sparkles className="h-3 w-3" /> AI Recommended
              </Badge>
            )}
            {!withinBudget && <Badge variant="warning">Over budget</Badge>}
          </div>
          <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {accommodation.rating}
            <span className="opacity-70">
              · {accommodation.reviewCount.toLocaleString()} reviews
            </span>
          </div>
          <div className="absolute inset-x-4 bottom-4 text-white">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-2xl font-semibold tracking-tight drop-shadow">
                {accommodation.name}
              </DialogTitle>
              <DialogDescription className="text-white/80">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {destination
                    ? `${destination.title}, ${destination.region}`
                    : "Location"}
                </span>
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {accommodation.gallery.length > 0 && (
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 scrollbar-hide">
              {[accommodation.imageUrl, ...accommodation.gallery].map((src) => (
                <button
                  key={src}
                  onClick={() => setActiveImage(src)}
                  className={cn(
                    "shrink-0 overflow-hidden rounded-xl border transition-all",
                    activeImage === src
                      ? "border-accent ring-2 ring-accent/40"
                      : "border-border/60 hover:border-accent/40"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-14 w-20 object-cover" />
                </button>
              ))}
            </div>
          )}

          <p className="text-sm leading-relaxed text-muted-foreground">
            {accommodation.description}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> Address
              </div>
              <p className="text-sm leading-snug">{accommodation.address}</p>
              <div className="mt-2 flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={copyAddress}>
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </>
                  )}
                </Button>
                <Button size="sm" variant="glass" asChild>
                  <a href={mapsUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> Maps
                  </a>
                </Button>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                {accommodation.coords.lat.toFixed(4)}°,{" "}
                {accommodation.coords.lng.toFixed(4)}°
                {distanceFromYou != null && (
                  <span className="ml-2 inline-flex items-center gap-1">
                    <Navigation className="h-3 w-3" /> {distanceFromYou} km from you
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> Stay
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <BedDouble className="h-4 w-4 text-accent" />
                  <span className="text-muted-foreground">Check-in</span>
                  <span className="ml-auto font-medium">
                    {accommodation.checkIn}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <LogOut className="h-4 w-4 text-accent" />
                  <span className="text-muted-foreground">Check-out</span>
                  <span className="ml-auto font-medium">
                    {accommodation.checkOut}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                {accommodation.cancellationPolicy}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Amenities
            </div>
            <div className="flex flex-wrap gap-1.5">
              {accommodation.amenities.map((a) => (
                <Badge key={a} variant="secondary">
                  <Check className="h-3 w-3 text-emerald-500" /> {a}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                From
              </div>
              <div className="text-2xl font-semibold tracking-tighter">
                {formatCurrency(accommodation.pricePerNight)}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / night
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeGroup && (
                <Button
                  variant="glass"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onClick={shareToChat}
                >
                  {shared ? (
                    <><Check className="h-3.5 w-3.5" /> Shared!</>
                  ) : (
                    <><MessageSquare className="h-3.5 w-3.5" /> Share to Chat</>
                  )}
                </Button>
              )}
              <Button variant="glass" className="flex-1" asChild>
                <a href={mapsUrl} target="_blank" rel="noreferrer">
                  <Navigation className="h-4 w-4" /> Directions
                </a>
              </Button>
              <Button variant="accent" size="lg" className="flex-1">
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
