"use client";

import * as React from "react";
import { ExternalLink, Landmark, Leaf, MapPin, Phone, Star, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ATTRACTIONS } from "@/lib/attractions-data";
import type { AttractionCategory } from "@/lib/types";

const PAGE_SIZE = 12;

const REGIONS = ["All regions", "Northern Thailand", "Northeastern Thailand", "Central Thailand", "Eastern Thailand", "Southern Thailand"];

const CATS: { value: AttractionCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "nature", label: "Nature" },
  { value: "culture", label: "Culture" },
  { value: "activity", label: "Activity" },
  { value: "agro", label: "Agro" },
];

const CAT_COLORS: Record<string, string> = {
  nature: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  culture: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  activity: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  agro: "bg-lime-500/15 text-lime-600 dark:text-lime-400",
  other: "bg-secondary text-muted-foreground",
};

const CAT_ICON: Record<string, React.ReactNode> = {
  nature: <Leaf className="h-3 w-3" />,
  culture: <Landmark className="h-3 w-3" />,
  activity: <Zap className="h-3 w-3" />,
};

export function AttractionsSection() {
  const [region, setRegion] = React.useState("All regions");
  const [cat, setCat] = React.useState<AttractionCategory | "all">("all");
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return ATTRACTIONS.filter((a) => {
      if (region !== "All regions" && a.region !== region) return false;
      if (cat !== "all" && a.category !== cat) return false;
      if (q) {
        return (
          a.nameEn.toLowerCase().includes(q) ||
          a.nameTh.includes(query.trim()) ||
          a.province.includes(query.trim()) ||
          a.descriptionEn.toLowerCase().includes(q) ||
          a.typeLabel.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [region, cat, query]);

  const shown = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = shown.length < filtered.length;

  React.useEffect(() => { setPage(1); }, [region, cat, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Thailand Attractions
          </h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {ATTRACTIONS.length} attractions
          </p>
        </div>
        <input
          type="search"
          placeholder="Search attractions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 w-full rounded-2xl border border-input bg-background/50 px-3 text-sm sm:w-56"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="h-8 rounded-xl border border-input bg-background/50 px-2 text-xs"
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <div className="flex flex-wrap gap-1.5">
          {CATS.map((c) => (
            <button
              key={c.value}
              onClick={() => setCat(c.value)}
              className={`rounded-xl border px-3 py-1 text-xs font-medium transition-colors ${
                cat === c.value
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-card/50 text-muted-foreground hover:border-accent/50 hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 bg-card/50 py-12 text-center text-sm text-muted-foreground">
          No attractions match your filters.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((a) => (
            <div
              key={a.id}
              className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-xl transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold leading-snug">{a.nameEn}</div>
                  {a.nameTh && a.nameTh !== a.nameEn && (
                    <div className="truncate text-xs text-muted-foreground">{a.nameTh}</div>
                  )}
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${CAT_COLORS[a.category] ?? CAT_COLORS.other}`}
                >
                  {CAT_ICON[a.category]} {a.category}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{a.province}{a.district ? ` · ${a.district}` : ""}</span>
                <span className="ml-auto shrink-0">{a.region}</span>
              </div>

              {a.typeLabel && (
                <Badge variant="secondary" className="w-fit text-[10px]">
                  {a.typeLabel}
                </Badge>
              )}

              {a.descriptionEn && (
                <p className="line-clamp-3 text-xs text-muted-foreground">
                  {a.descriptionEn}
                </p>
              )}

              {(a.phone || a.openHours || a.website) && (
                <div className="mt-auto space-y-1 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                  {a.openHours && (
                    <div className="flex items-start gap-1">
                      <Star className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                      <span className="line-clamp-1">{a.openHours}</span>
                    </div>
                  )}
                  {a.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span className="truncate">{a.phone}</span>
                    </div>
                  )}
                  {a.website && (
                    <a
                      href={a.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-accent hover:underline"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="truncate">{a.website.replace(/^https?:\/\/(www\.)?/, "")}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="pt-2 text-center">
          <Button variant="glass" onClick={() => setPage((p) => p + 1)}>
            Load more ({filtered.length - shown.length} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
