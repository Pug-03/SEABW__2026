"use client";

import * as React from "react";
import { Cloud, CloudRain, CloudSnow, Sun, Wind, Droplet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Destination } from "@/lib/types";

interface WeatherSnap {
  condition: "sunny" | "cloudy" | "rain" | "snow";
  tempC: number;
  feelsC: number;
  humidity: number;
  wind: number;
  forecast: { day: string; tempC: number; condition: WeatherSnap["condition"] }[];
}

// Deterministic mock weather derived from destination + season — replaceable
// with a real fetch (OpenWeatherMap, Tomorrow.io) without changing the UI.
function mockWeather(destination: Destination): WeatherSnap {
  const seed = destination.id
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  const base =
    destination.season === "winter"
      ? 8
      : destination.season === "spring"
      ? 18
      : destination.season === "autumn"
      ? 16
      : 30;
  const tempC = base + (seed % 6) - 2;
  const cond: WeatherSnap["condition"] =
    destination.season === "winter"
      ? seed % 2
        ? "snow"
        : "cloudy"
      : seed % 4 === 0
      ? "rain"
      : seed % 4 === 1
      ? "cloudy"
      : "sunny";
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  return {
    condition: cond,
    tempC,
    feelsC: tempC - 1,
    humidity: 50 + (seed % 30),
    wind: 6 + (seed % 8),
    forecast: days.map((d, i) => ({
      day: d,
      tempC: tempC + ((seed + i) % 5) - 2,
      condition:
        i % 4 === 0 ? "rain" : i % 4 === 1 ? "cloudy" : "sunny",
    })),
  };
}

const ICONS: Record<WeatherSnap["condition"], React.ElementType> = {
  sunny: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
};

const COLORS: Record<WeatherSnap["condition"], string> = {
  sunny: "from-amber-300/40 to-orange-400/40 text-amber-700 dark:text-amber-200",
  cloudy: "from-slate-300/40 to-zinc-400/40 text-slate-700 dark:text-slate-200",
  rain: "from-sky-400/40 to-blue-500/40 text-sky-700 dark:text-sky-200",
  snow: "from-cyan-200/40 to-indigo-300/40 text-cyan-700 dark:text-cyan-200",
};

export function WeatherWidget({ destination }: { destination: Destination }) {
  const w = React.useMemo(() => mockWeather(destination), [destination]);
  const Icon = ICONS[w.condition];

  return (
    <Card className="overflow-hidden">
      <div className={cn("relative bg-gradient-to-br p-5", COLORS[w.condition])}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider opacity-80">
              {destination.title} · Now
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-5xl font-semibold tracking-tighter">
                {w.tempC}°
              </span>
              <span className="text-sm opacity-80">C</span>
            </div>
            <div className="mt-1 text-xs opacity-80 capitalize">
              {w.condition} · feels {w.feelsC}°
            </div>
          </div>
          <Icon className="h-12 w-12 drop-shadow" strokeWidth={1.5} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-xl bg-white/40 px-2.5 py-1.5 dark:bg-black/20">
            <Droplet className="h-3.5 w-3.5" /> Humidity {w.humidity}%
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-white/40 px-2.5 py-1.5 dark:bg-black/20">
            <Wind className="h-3.5 w-3.5" /> Wind {w.wind} km/h
          </div>
        </div>
      </div>

      <CardContent className="px-5 py-4">
        <div className="grid grid-cols-5 gap-2 text-center">
          {w.forecast.map((f) => {
            const FIcon = ICONS[f.condition];
            return (
              <div key={f.day} className="space-y-1">
                <div className="text-[10px] uppercase text-muted-foreground">
                  {f.day}
                </div>
                <FIcon className="mx-auto h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-medium">{f.tempC}°</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
