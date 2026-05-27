"use client";

import * as React from "react";
import {
  Bath, BedDouble, ChevronLeft, ChevronRight, ExternalLink, Loader2,
  Mail, MapPin, Phone, Search, Sparkles, Star, Wifi, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import type { Hotel } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ApiResponse {
  data: Hotel[];
  total: number;
  page: number;
  pages: number;
}

interface Filters {
  q: string;
  region: string;
  type: string;
  stars: string;
  tags: string;
  sort: string;
}

const REGIONS = ["", "Central Thailand", "Northern Thailand", "Northeastern Thailand", "Eastern Thailand", "Southern Thailand"];
const TYPES   = ["", "hotel", "resort", "villa", "boutique", "guesthouse", "hostel"];
const SORTS   = [{ v: "rating", label: "Top rated" }, { v: "reviews", label: "Most reviewed" }, { v: "price", label: "Lowest price" }];

// ─── Component ────────────────────────────────────────────────────────────────
export function HotelBrowser() {
  const [filters, setFilters] = React.useState<Filters>({ q: "", region: "", type: "", stars: "", tags: "", sort: "rating" });
  const [draft, setDraft] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<ApiResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<Hotel | null>(null);

  const fetchHotels = React.useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "12", sort: f.sort });
      if (f.q)      params.set("q",      f.q);
      if (f.region) params.set("region", f.region);
      if (f.type)   params.set("type",   f.type);
      if (f.stars)  params.set("stars",  f.stars);
      if (f.tags)   params.set("tags",   f.tags);
      const res = await fetch(`/api/hotels?${params}`);
      if (res.ok) setData(await res.json() as ApiResponse);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchHotels(filters, page); }, [filters, page, fetchHotels]);

  const applySearch = () => { setFilters((f) => ({ ...f, q: draft })); setPage(1); };
  const setFilter = (key: keyof Filters, val: string) => { setFilters((f) => ({ ...f, [key]: val })); setPage(1); };
  const clearSearch = () => { setDraft(""); setFilters((f) => ({ ...f, q: "" })); setPage(1); };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Thailand Accommodations</h2>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total.toLocaleString()} places · page ${data.page} of ${data.pages}` : "10,000 places across Thailand"}
          </p>
        </div>
        {/* Search */}
        <form
          onSubmit={(e) => { e.preventDefault(); applySearch(); }}
          className="flex w-full items-center gap-2 sm:w-72"
        >
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search by name, city…"
              className="h-9 w-full rounded-xl border border-input bg-background/50 pl-8 pr-8 text-sm"
            />
            {draft && (
              <button type="button" onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button type="submit" size="sm" variant="accent">Go</Button>
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select value={filters.region} onChange={(e) => setFilter("region", e.target.value)} className="h-8 rounded-xl border border-input bg-background/50 px-2 text-xs">
          <option value="">All regions</option>
          {REGIONS.filter(Boolean).map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filters.type} onChange={(e) => setFilter("type", e.target.value)} className="h-8 rounded-xl border border-input bg-background/50 px-2 text-xs">
          <option value="">All types</option>
          {TYPES.filter(Boolean).map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
        </select>
        <select value={filters.stars} onChange={(e) => setFilter("stars", e.target.value)} className="h-8 rounded-xl border border-input bg-background/50 px-2 text-xs">
          <option value="">Any stars</option>
          {[5,4,3,2,1].map((s) => <option key={s} value={String(s)}>{"★".repeat(s)}</option>)}
        </select>
        <select value={filters.sort} onChange={(e) => setFilter("sort", e.target.value)} className="h-8 rounded-xl border border-input bg-background/50 px-2 text-xs">
          {SORTS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
        </select>
        {/* Preference quick-filters */}
        {["beach","mountain","city","island","culture"].map((tag) => (
          <button
            key={tag}
            onClick={() => setFilter("tags", filters.tags === tag ? "" : tag)}
            className={cn(
              "h-8 rounded-xl border px-3 text-xs font-medium transition-colors",
              filters.tags === tag
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-card/50 text-muted-foreground hover:border-accent/50 hover:text-foreground"
            )}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : data && data.data.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 bg-card/50 py-12 text-center text-sm text-muted-foreground">
          No hotels match your filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data?.data.map((h) => (
            <HotelCard key={h.id} hotel={h} onClick={() => setSelected(h)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {data.pages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Detail panel */}
      {selected && <HotelDetail hotel={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Hotel card ───────────────────────────────────────────────────────────────
function HotelCard({ hotel: h, onClick }: { hotel: Hotel; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/70 text-left transition-shadow hover:shadow-lg"
    >
      <div className="relative h-36 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={h.imageUrl} alt={h.name} loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute left-2 top-2">
          <span className="rounded-lg bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white capitalize">{h.type}</span>
        </div>
        <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded-lg bg-black/55 px-1.5 py-0.5 text-xs text-white">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {h.rating}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="line-clamp-1 text-sm font-semibold">{h.name}</div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{h.district}, {h.province}</span>
        </div>
        <StarRow stars={h.stars} />
        <div className="text-xs font-medium text-accent">
          {formatCurrency(h.priceMin)} – {formatCurrency(h.priceMax)}<span className="font-normal text-muted-foreground"> / night</span>
        </div>
        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          {h.amenities.slice(0, 3).map((a) => (
            <span key={a} className="rounded-lg bg-secondary/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">{a}</span>
          ))}
        </div>
      </div>
    </button>
  );
}

function StarRow({ stars }: { stars: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={cn("h-3 w-3", i < stars ? "fill-amber-400 text-amber-400" : "text-border")} />
      ))}
    </div>
  );
}

// ─── Hotel detail panel ───────────────────────────────────────────────────────
function HotelDetail({ hotel: h, onClose }: { hotel: Hotel; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border/60 bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero */}
        <div className="relative h-52 w-full overflow-hidden rounded-t-3xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={h.imageUrl} alt={h.name} className="h-full w-full object-cover" />
          <button onClick={onClose} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70">
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="flex items-end justify-between">
              <div>
                <Badge variant="secondary" className="mb-1 capitalize">{h.type}</Badge>
                <h3 className="text-lg font-semibold text-white">{h.name}</h3>
                <div className="flex items-center gap-1 text-xs text-white/80">
                  <MapPin className="h-3 w-3" /> {h.address}
                </div>
              </div>
              <div className="text-right text-white">
                <StarRow stars={h.stars} />
                <div className="mt-0.5 flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {h.rating} ({h.reviewCount.toLocaleString()} reviews)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery strip */}
        {h.gallery.length > 0 && (
          <div className="flex gap-2 overflow-x-auto p-3 pb-0">
            {h.gallery.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt="" loading="lazy"
                className="h-16 w-24 shrink-0 rounded-xl object-cover" />
            ))}
          </div>
        )}

        <div className="space-y-4 p-4">
          {/* Price + times */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoBox label="Price / night" value={`฿${h.priceMin.toLocaleString()} – ฿${h.priceMax.toLocaleString()}`} />
            <InfoBox label="Check-in" value={h.checkIn} icon={<BedDouble className="h-3.5 w-3.5" />} />
            <InfoBox label="Check-out" value={h.checkOut} icon={<Bath className="h-3.5 w-3.5" />} />
            <InfoBox label="Service hours" value={h.serviceHours} />
          </div>

          {/* Amenities */}
          <div>
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Amenities</div>
            <div className="flex flex-wrap gap-1.5">
              {h.amenities.map((a) => (
                <span key={a} className="flex items-center gap-1 rounded-xl border border-border/60 bg-secondary/40 px-2.5 py-1 text-xs">
                  <Wifi className="h-3 w-3 text-accent" /> {a}
                </span>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Contact</div>
            <div className="space-y-1.5 text-sm">
              <a href={`tel:${h.phone}`} className="flex items-center gap-2 hover:text-accent">
                <Phone className="h-4 w-4 text-muted-foreground" /> {h.phone}
              </a>
              <a href={`mailto:${h.email}`} className="flex items-center gap-2 hover:text-accent">
                <Mail className="h-4 w-4 text-muted-foreground" /> {h.email}
              </a>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" /> {h.address}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="glass" className="flex-1" asChild>
              <a href={`https://www.google.com/maps/search/${encodeURIComponent(h.name + " " + h.province)}`}
                target="_blank" rel="noreferrer">
                <MapPin className="h-4 w-4" /> View on Map
              </a>
            </Button>
            <Button variant="accent" className="flex-1" asChild>
              <a href={`https://www.booking.com/search.html?ss=${encodeURIComponent(h.name)}`}
                target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> Book Now
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-secondary/30 p-2.5 text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 flex items-center justify-center gap-1 text-sm font-semibold">
        {icon}{value}
      </div>
    </div>
  );
}
