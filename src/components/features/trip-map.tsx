"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Fuel, Hospital, Map as MapIcon, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Destination, GeoCoords } from "@/lib/types";
import type { PoiFilter } from "./trip-map-inner";

const TripMapInner = dynamic(() => import("./trip-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

interface TripMapProps {
  origin: GeoCoords | null;
  destination: Destination;
}

const FILTERS: { label: string; value: PoiFilter; icon: React.ElementType; color: string }[] = [
  { label: "All POI", value: "all", icon: MapIcon, color: "text-muted-foreground" },
  { label: "Hospitals", value: "Hospital", icon: Hospital, color: "text-rose-500" },
  { label: "Police", value: "Police", icon: Shield, color: "text-blue-500" },
  { label: "Gas", value: "Gas", icon: Fuel, color: "text-emerald-500" },
];

export function TripMap({ origin, destination }: TripMapProps) {
  const [filter, setFilter] = React.useState<PoiFilter>("all");

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapIcon className="h-4 w-4 text-accent" /> Navigation Map
          </CardTitle>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
                    filter === f.value
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border bg-secondary text-muted-foreground hover:bg-secondary/70"
                  )}
                >
                  <Icon className={cn("h-3 w-3", filter === f.value ? "text-accent" : f.color)} />
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-72 w-full overflow-hidden sm:h-96">
          <TripMapInner origin={origin} destination={destination} poiFilter={filter} />
        </div>
        {!origin && (
          <p className="px-4 py-2 text-center text-xs text-muted-foreground">
            Enable location to see your route and distance
          </p>
        )}
      </CardContent>
    </Card>
  );
}
