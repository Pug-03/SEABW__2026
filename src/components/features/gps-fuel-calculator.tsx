"use client";

import * as React from "react";
import { Clock, Fuel, Gauge, Navigation, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Destination, GeoCoords } from "@/lib/types";
import { formatCurrency, haversineDistanceKm } from "@/lib/utils";
import {
  AVG_KM_PER_LITER as DEFAULT_KM_PER_L,
  FUEL_RATE_THB_PER_LITER,
} from "@/lib/mock-data";

interface GpsFuelCalculatorProps {
  origin: GeoCoords | null;
  destination: Destination;
}

export function GpsFuelCalculator({
  origin,
  destination,
}: GpsFuelCalculatorProps) {
  const [kmPerLiter, setKmPerLiter] = React.useState(DEFAULT_KM_PER_L);
  const [fuelRate, setFuelRate] = React.useState(FUEL_RATE_THB_PER_LITER);
  const [avgKmh, setAvgKmh] = React.useState(80);

  const distanceKm = origin
    ? Math.round(haversineDistanceKm(origin, destination.coords))
    : null;
  const liters = distanceKm ? distanceKm / kmPerLiter : 0;
  const fuelCost = liters * fuelRate;
  const etaHours = distanceKm ? distanceKm / avgKmh : 0;
  const etaH = Math.floor(etaHours);
  const etaM = Math.round((etaHours - etaH) * 60);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Navigation className="h-4 w-4 text-accent" /> GPS & Fuel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!origin && (
          <p className="text-xs text-muted-foreground">
            Enable location to estimate distance & fuel.
          </p>
        )}
        <div className="grid grid-cols-3 gap-2">
          <Stat
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Distance"
            value={distanceKm != null ? `${distanceKm} km` : "—"}
          />
          <Stat
            icon={<Clock className="h-3.5 w-3.5" />}
            label="ETA"
            value={distanceKm != null ? `${etaH}h ${etaM}m` : "—"}
          />
          <Stat
            icon={<Fuel className="h-3.5 w-3.5" />}
            label="Fuel cost"
            value={distanceKm != null ? formatCurrency(fuelCost) : "—"}
          />
        </div>

        <details className="rounded-xl border border-border/60 bg-secondary/30 p-3">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
            <Gauge className="mr-1 inline h-3 w-3" /> Adjust vehicle assumptions
          </summary>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px]">km / L</Label>
              <Input
                type="number"
                value={kmPerLiter}
                onChange={(e) => setKmPerLiter(Number(e.target.value) || 0)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-[10px]">฿ / L</Label>
              <Input
                type="number"
                value={fuelRate}
                onChange={(e) => setFuelRate(Number(e.target.value) || 0)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-[10px]">avg km/h</Label>
              <Input
                type="number"
                value={avgKmh}
                onChange={(e) =>
                  setAvgKmh(Math.max(1, Number(e.target.value) || 1))
                }
                className="h-9"
              />
            </div>
          </div>
        </details>

        <Button variant="glass" size="sm" className="w-full" asChild>
          <a
            href={`https://www.google.com/maps/dir/${origin ? `${origin.lat},${origin.lng}` : ""}/${destination.coords.lat},${destination.coords.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            <Navigation className="h-3.5 w-3.5" /> Open in Maps
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-2.5 text-center">
      <div className="mx-auto mb-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="text-sm font-semibold tracking-tight">{value}</div>
    </div>
  );
}
