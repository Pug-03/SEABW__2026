"use client";

import * as React from "react";
import {
  BedDouble, ExternalLink, Info, Loader2, Mail,
  MapPin, Phone, RefreshCw, Sparkles, Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Destination, GeoCoords, Hotel, Preference } from "@/lib/types";
import type { HotelRec } from "@/app/api/ai/recommendations/route";

interface AIRecProps {
  destination: Destination;
  preferences: Preference[];
  remainingBudget: number;
  origin?: GeoCoords | null;
  nickname?: string;
  homeAddress?: string;
}

export function AIRecommendationsCard({
  destination,
  preferences,
  remainingBudget,
  origin,
  nickname,
  homeAddress,
}: AIRecProps) {
  const [recs, setRecs] = React.useState<HotelRec[] | null>(null);
  const [source, setSource] = React.useState<"anthropic" | "algorithmic" | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<Hotel | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/recommendations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          preferences,
          location: origin ?? undefined,
          budget: remainingBudget > 0 ? remainingBudget : undefined,
          nickname,
          homeAddress,
          region: preferences.some((p) => ["beach", "island"].includes(p))
            ? "Southern Thailand"
            : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json() as { recommendations: HotelRec[]; source: "anthropic" | "algorithmic" };
        setRecs(data.recommendations);
        setSource(data.source);
      }
    } finally {
      setLoading(false);
    }
  }, [preferences, origin, remainingBudget, nickname, homeAddress]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold tracking-tight">
          Stays picked for you
        </h4>
        <div className="flex items-center gap-2">
          <Badge variant={source === "anthropic" ? "ai" : "secondary"}>
            {source === "anthropic" ? <><Sparkles className="h-3 w-3" /> Claude AI</> : <><Sparkles className="h-3 w-3" /> Smart Pick</>}
          </Badge>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={load} disabled={loading} aria-label="Refresh">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {loading && !recs ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Finding best stays for you…
        </div>
      ) : (
        <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(recs ?? []).slice(0, 3).map(({ hotel, reason }, idx) => (
            <RecCard
              key={hotel.id}
              hotel={hotel}
              reason={reason}
              featured={idx === 0}
              budget={remainingBudget}
              onOpen={() => setSelected(hotel)}
            />
          ))}
        </div>
      )}

      {selected && (
        <QuickDetail hotel={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

// ─── Rec card ─────────────────────────────────────────────────────────────────
function RecCard({
  hotel: h, reason, featured, budget, onOpen,
}: { hotel: Hotel; reason: string; featured: boolean; budget: number; onOpen: () => void }) {
  const overBudget = budget > 0 && h.priceMin > budget;
  return (
    <Card
      role="button" tabIndex={0} onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      className="group flex h-full cursor-pointer flex-col overflow-hidden outline-none transition-shadow hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative h-32 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={h.imageUrl} alt={h.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {featured && <Badge variant="ai"><Sparkles className="h-3 w-3" /> Best match</Badge>}
          {overBudget && <Badge variant="warning">Over budget</Badge>}
        </div>
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-xs text-white">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {h.rating}
        </div>
      </div>
      <CardContent className="flex flex-1 flex-col p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{h.name}</div>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{h.district}, {h.province}</span>
            </div>
            <div className="text-xs text-accent font-medium">
              {formatCurrency(h.priceMin)} – {formatCurrency(h.priceMax)}/night
            </div>
          </div>
          <BedDouble className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
        <p className="mt-2 line-clamp-2 min-h-8 text-[11px] leading-4 text-muted-foreground">
          {reason}
        </p>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
          <Button variant="ghost" size="sm" className="h-9 w-full" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
            <Info className="h-3.5 w-3.5" /> Details
          </Button>
          <Button variant="accent" size="sm" className="h-9 w-full" asChild onClick={(e) => e.stopPropagation()}>
            <a href={`https://www.booking.com/search.html?ss=${encodeURIComponent(h.name)}`} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5" /> Book
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Quick detail ─────────────────────────────────────────────────────────────
function QuickDetail({ hotel: h, onClose }: { hotel: Hotel; onClose: () => void }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{h.name}</div>
          <div className="text-xs text-muted-foreground">{h.address}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded-xl bg-secondary/50 p-2 text-center">
          <div className="text-muted-foreground">Stars</div>
          <div className="font-medium">{"★".repeat(h.stars)}</div>
        </div>
        <div className="rounded-xl bg-secondary/50 p-2 text-center">
          <div className="text-muted-foreground">Price / night</div>
          <div className="font-medium">฿{h.priceMin.toLocaleString()} – ฿{h.priceMax.toLocaleString()}</div>
        </div>
        <div className="rounded-xl bg-secondary/50 p-2 text-center">
          <div className="text-muted-foreground">Check-in</div>
          <div className="font-medium">{h.checkIn}</div>
        </div>
        <div className="rounded-xl bg-secondary/50 p-2 text-center">
          <div className="text-muted-foreground">Check-out</div>
          <div className="font-medium">{h.checkOut}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {h.amenities.slice(0, 6).map((a) => (
          <span key={a} className="rounded-lg border border-border/60 bg-background/50 px-2 py-0.5 text-[11px]">{a}</span>
        ))}
      </div>
      <div className="space-y-1 text-sm">
        <a href={`tel:${h.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <Phone className="h-3.5 w-3.5" /> {h.phone}
        </a>
        <a href={`mailto:${h.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <Mail className="h-3.5 w-3.5" /> {h.email}
        </a>
      </div>
      <div className="flex gap-2">
        <Button variant="glass" size="sm" className="flex-1" asChild>
          <a href={`https://www.google.com/maps/search/${encodeURIComponent(h.name + " " + h.province)}`} target="_blank" rel="noreferrer">
            <MapPin className="h-4 w-4" /> Map
          </a>
        </Button>
        <Button variant="accent" size="sm" className="flex-1" asChild>
          <a href={`https://www.booking.com/search.html?ss=${encodeURIComponent(h.name)}`} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" /> Book on Booking.com
          </a>
        </Button>
      </div>
    </div>
  );
}
