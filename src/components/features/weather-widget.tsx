"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Droplet,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Destination } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Condition = "sunny" | "cloudy" | "rain" | "snow" | "storm";
type View = "today" | "week" | "month";

interface DayForecast {
  date: Date;
  condition: Condition;
  highC: number;
  lowC: number;
  precipChance: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COND_ICON: Record<Condition, React.ElementType> = {
  sunny: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

const COND_COLOR: Record<Condition, string> = {
  sunny: "text-amber-500",
  cloudy: "text-slate-400",
  rain: "text-sky-500",
  snow: "text-cyan-400",
  storm: "text-violet-500",
};

const HERO_GRADIENT: Record<Condition, string> = {
  sunny: "from-amber-300/40 to-orange-400/40 text-amber-800 dark:text-amber-100",
  cloudy: "from-slate-300/40 to-zinc-400/40 text-slate-700 dark:text-slate-200",
  rain: "from-sky-400/40 to-blue-500/40 text-sky-800 dark:text-sky-100",
  snow: "from-cyan-200/40 to-indigo-300/40 text-cyan-800 dark:text-cyan-100",
  storm: "from-violet-400/40 to-indigo-500/40 text-violet-800 dark:text-violet-100",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── Seeded RNG ───────────────────────────────────────────────────────────────

function lcg(seed: number): () => number {
  let s = ((seed % 233280) + 233280) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function destSeed(d: Destination): number {
  return d.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}

// ─── Weather generation ───────────────────────────────────────────────────────

function monthBaseTempC(dest: Destination, month: number): number {
  const ds = destSeed(dest);
  const isSouthern = dest.coords.lat < 0;
  const peakMonth = isSouthern ? 1 : 7; // Feb or Jul (0-indexed)
  const peakBase =
    dest.season === "winter" ? 9 :
    dest.season === "summer" ? 31 :
    dest.season === "spring" ? 22 :
    dest.season === "autumn" ? 18 : 27;
  const amplitude = 9 + (ds % 6);
  const angle = (((month - 1) - peakMonth + 12) % 12) * ((Math.PI * 2) / 12);
  const seasonal = Math.cos(angle) * amplitude;
  const destOffset = (ds % 9) - 4;
  return Math.round(peakBase + seasonal * 0.45 + destOffset);
}

function dayCondition(dest: Destination, date: Date): Condition {
  const ds = destSeed(dest);
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const rand = lcg(ds * 1000 + m * 37 + d * 13);
  const r = rand();
  const tropical = Math.abs(dest.coords.lat) < 25;
  const isWinter = dest.season === "winter";

  if (tropical) {
    const wet = m >= 5 && m <= 10;
    if (wet) {
      if (r < 0.32) return "rain";
      if (r < 0.52) return "cloudy";
      if (r < 0.60) return "storm";
      return "sunny";
    }
    if (r < 0.07) return "rain";
    if (r < 0.16) return "cloudy";
    return "sunny";
  }

  if (isWinter && (m <= 2 || m >= 11)) {
    if (r < 0.28) return "snow";
    if (r < 0.50) return "cloudy";
    if (r < 0.62) return "rain";
    return "sunny";
  }

  if (r < 0.18) return "rain";
  if (r < 0.30) return "cloudy";
  if (r < 0.36) return "storm";
  return "sunny";
}

function forecastDay(dest: Destination, date: Date): DayForecast {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const ds = destSeed(dest);
  const rand = lcg(ds * 500 + m * 200 + d * 17);
  const base = monthBaseTempC(dest, m);
  const highC = Math.round(base + rand() * 5 - 1);
  const lowC = Math.round(highC - 5 - rand() * 5);
  const condition = dayCondition(dest, date);
  const precip =
    condition === "rain" || condition === "storm" ? Math.round(55 + rand() * 40) :
    condition === "cloudy" ? Math.round(rand() * 25) :
    Math.round(rand() * 8);
  return { date, condition, highC, lowC, precipChance: precip };
}

function forecastRange(dest: Destination, start: Date, days: number): DayForecast[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return forecastDay(dest, d);
  });
}

function forecastMonth(dest: Destination, year: number, month: number): DayForecast[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) =>
    forecastDay(dest, new Date(year, month - 1, i + 1))
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CondIcon({ c, className }: { c: Condition; className?: string }) {
  const I = COND_ICON[c];
  return <I className={cn(COND_COLOR[c], className)} strokeWidth={1.8} />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WeatherWidget({ destination }: { destination: Destination }) {
  const today = new Date();
  const [view, setView] = React.useState<View>("today");
  const [viewMonth, setViewMonth] = React.useState(today.getMonth() + 1);
  const [viewYear, setViewYear] = React.useState(today.getFullYear());

  const todayForecast = React.useMemo(() => forecastDay(destination, today), [destination]);
  const weekForecast = React.useMemo(() => forecastRange(destination, today, 7), [destination]);
  const monthData = React.useMemo(
    () => forecastMonth(destination, viewYear, viewMonth),
    [destination, viewYear, viewMonth]
  );

  const canGoBack = React.useMemo(() => {
    const y = viewMonth === 1 ? viewYear - 1 : viewYear;
    const m = viewMonth === 1 ? 12 : viewMonth - 1;
    return y > today.getFullYear() || (y === today.getFullYear() && m >= today.getMonth() + 1);
  }, [viewMonth, viewYear, today]);

  const shiftMonth = (delta: number) => {
    setViewMonth((m) => {
      const next = m + delta;
      if (next < 1) { setViewYear((y) => y - 1); return 12; }
      if (next > 12) { setViewYear((y) => y + 1); return 1; }
      return next;
    });
  };

  // Monthly stats
  const monthStats = React.useMemo(() => {
    const avgHigh = Math.round(monthData.reduce((s, d) => s + d.highC, 0) / monthData.length);
    const avgLow = Math.round(monthData.reduce((s, d) => s + d.lowC, 0) / monthData.length);
    const rainyDays = monthData.filter((d) => d.condition === "rain" || d.condition === "storm").length;
    return { avgHigh, avgLow, rainyDays };
  }, [monthData]);

  // Week range for the temp bar
  const weekTemps = React.useMemo(() => ({
    min: Math.min(...weekForecast.map((d) => d.lowC)),
    max: Math.max(...weekForecast.map((d) => d.highC)),
  }), [weekForecast]);

  return (
    <Card className="h-fit overflow-hidden">
      {/* View tabs */}
      <div className="flex border-b border-border/60">
        {(["today", "week", "month"] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "flex-1 py-2 text-xs font-medium capitalize transition-colors",
              view === v
                ? "border-b-2 border-accent text-accent"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {v === "today" ? "Today" : v === "week" ? "7-Day" : "Monthly"}
          </button>
        ))}
      </div>

      {/* ── Today ── */}
      {view === "today" && (
        <>
          <div className={cn("relative bg-gradient-to-br p-5", HERO_GRADIENT[todayForecast.condition])}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider opacity-75">
                  {destination.title} · Now
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-5xl font-semibold tracking-tighter">
                    {todayForecast.highC}°
                  </span>
                  <span className="text-sm opacity-75">C</span>
                </div>
                <div className="mt-1 text-xs opacity-75 capitalize">
                  {todayForecast.condition} · low {todayForecast.lowC}°
                </div>
              </div>
              <CondIcon c={todayForecast.condition} className="h-12 w-12 drop-shadow" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <Stat icon={<Droplet className="h-3.5 w-3.5" />} label={`${todayForecast.precipChance}% rain`} />
              <Stat icon={<Wind className="h-3.5 w-3.5" />} label={`${10 + (destSeed(destination) % 12)} km/h`} />
              <Stat icon={<Thermometer className="h-3.5 w-3.5" />} label={`Feels ${todayForecast.highC - 1}°`} />
            </div>
          </div>
          <CardContent className="px-5 py-4">
            <div className="grid grid-cols-5 gap-2 text-center">
              {forecastRange(destination, today, 5).map((f, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-[10px] uppercase text-muted-foreground">
                    {i === 0 ? "Now" : DAY_NAMES[f.date.getDay()]}
                  </div>
                  <CondIcon c={f.condition} className="mx-auto h-4 w-4" />
                  <div className="text-sm font-medium">{f.highC}°</div>
                </div>
              ))}
            </div>
          </CardContent>
        </>
      )}

      {/* ── 7-Day ── */}
      {view === "week" && (
        <CardContent className="px-4 py-3">
          <div className="space-y-1">
            {weekForecast.map((f, i) => {
              const barMin = weekTemps.min;
              const barRange = weekTemps.max - barMin || 1;
              const left = ((f.lowC - barMin) / barRange) * 100;
              const width = ((f.highC - f.lowC) / barRange) * 100;
              const isToday = i === 0;
              return (
                <div
                  key={i}
                  className={cn(
                    "grid items-center gap-2 rounded-xl px-2 py-1.5 text-sm",
                    "grid-cols-[56px_20px_40px_1fr_36px]",
                    isToday && "bg-accent/8 font-medium"
                  )}
                >
                  <span className="text-xs text-muted-foreground">
                    {isToday
                      ? "Today"
                      : `${DAY_NAMES[f.date.getDay()]} ${f.date.getDate()}`}
                  </span>
                  <CondIcon c={f.condition} className="h-4 w-4" />
                  <span className="text-right text-xs text-muted-foreground">
                    {f.precipChance}%
                  </span>
                  <div className="relative h-1.5 rounded-full bg-muted">
                    <div
                      className="absolute h-full rounded-full bg-gradient-to-r from-sky-400 to-amber-400"
                      style={{ left: `${left}%`, width: `${Math.max(width, 6)}%` }}
                    />
                  </div>
                  <span className="text-right text-xs font-medium">
                    {f.lowC}°/{f.highC}°
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex justify-between px-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Droplet className="h-3 w-3" /> Rain chance</span>
            <span className="flex items-center gap-1"><Thermometer className="h-3 w-3" /> Low / High</span>
          </div>
        </CardContent>
      )}

      {/* ── Monthly ── */}
      {view === "month" && (
        <CardContent className="px-3 py-3">
          {/* Month navigation */}
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => shiftMonth(-1)}
              disabled={!canGoBack}
              className="rounded-lg p-1 text-muted-foreground hover:bg-accent/10 hover:text-foreground disabled:opacity-30"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-center">
              <div className="text-sm font-semibold">
                {MONTH_NAMES[viewMonth - 1]} {viewYear}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {destination.title}
              </div>
            </div>
            <button
              onClick={() => shiftMonth(1)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-accent/10 hover:text-foreground"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Monthly summary stats */}
          <div className="mb-3 grid grid-cols-3 gap-1.5 rounded-2xl border border-border/60 bg-secondary/30 p-2 text-center text-xs">
            <div>
              <div className="font-semibold text-amber-500">{monthStats.avgHigh}°</div>
              <div className="text-[10px] text-muted-foreground">Avg High</div>
            </div>
            <div>
              <div className="font-semibold text-sky-500">{monthStats.avgLow}°</div>
              <div className="text-[10px] text-muted-foreground">Avg Low</div>
            </div>
            <div>
              <div className="font-semibold text-blue-500">{monthStats.rainyDays}d</div>
              <div className="text-[10px] text-muted-foreground">Rainy Days</div>
            </div>
          </div>

          {/* Day-of-week headers */}
          <div className="mb-1 grid grid-cols-7 text-center">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-[10px] font-medium text-muted-foreground">
                {d[0]}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <CalendarGrid
            year={viewYear}
            month={viewMonth}
            days={monthData}
            today={today}
          />
        </CardContent>
      )}
    </Card>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl bg-white/40 px-2.5 py-1.5 dark:bg-black/20">
      {icon} {label}
    </div>
  );
}

function CalendarGrid({
  year,
  month,
  days,
  today,
}: {
  year: number;
  month: number;
  days: DayForecast[];
  today: Date;
}) {
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const totalCells = firstDow + days.length;
  const rows = Math.ceil(totalCells / 7);
  const cells = Array.from({ length: rows * 7 }, (_, i) => {
    const dayIndex = i - firstDow;
    return dayIndex >= 0 && dayIndex < days.length ? days[dayIndex] : null;
  });

  const isToday = (f: DayForecast) =>
    f.date.getDate() === today.getDate() &&
    f.date.getMonth() === today.getMonth() &&
    f.date.getFullYear() === today.getFullYear();

  const isPast = (f: DayForecast) => f.date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="grid grid-cols-7 gap-[3px]">
      {cells.map((f, i) => {
        if (!f) {
          return <div key={`empty-${i}`} />;
        }
        const today_ = isToday(f);
        const past = isPast(f);
        return (
          <div
            key={i}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg p-0.5 pt-1 text-center transition-colors",
              today_ && "bg-accent/20 ring-1 ring-accent/60",
              !today_ && !past && "hover:bg-secondary/60",
              past && "opacity-40"
            )}
          >
            <span
              className={cn(
                "text-[10px] leading-none",
                today_ ? "font-bold text-accent" : "text-muted-foreground"
              )}
            >
              {f.date.getDate()}
            </span>
            <CondIcon c={f.condition} className="h-3 w-3" />
            <span className="text-[10px] font-medium leading-none">{f.highC}°</span>
          </div>
        );
      })}
    </div>
  );
}
