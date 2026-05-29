/**
 * @file `<WeatherWidget>` — synthetic-but-deterministic weather card
 * for the dashboard. Three views: "today" hero, "7-Day" temperature
 * bars, and "Monthly" calendar. All numbers are generated from a
 * seeded RNG keyed by destination id + date, so the same dashboard
 * always shows the same forecast (no live API yet).
 *
 * (TH) วิดเจ็ตอากาศ "เสมือนจริง" สำหรับ dashboard 3 โหมด: today (hero),
 * 7-day (แถบอุณหภูมิ), monthly (ปฏิทิน) ข้อมูลถูกสร้างจาก RNG ที่ seed ด้วย
 * id ของจุดหมาย + วันที่ — ผลลัพธ์เลยซ้ำเดิมตลอด (ยังไม่เชื่อม API จริง)
 */

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

// ─── Types ───────────────────────────────────────────────────────────────────

/** Discrete weather condition value. Drives icon, color, and probabilities. */
/** (TH) สภาพอากาศแบบ discrete — ใช้เลือกไอคอน, สี, และโอกาสฝนตก */
type Condition = "sunny" | "cloudy" | "rain" | "snow" | "storm";

/** Which of the three views is currently active. */
/** (TH) โหมดที่กำลังแสดง — today / week / month */
type View = "today" | "week" | "month";

/** One day in any of the generated forecasts. */
/** (TH) ข้อมูลพยากรณ์ 1 วัน */
interface DayForecast {
  date: Date;
  condition: Condition;
  /** High temperature in Celsius. */
  /** (TH) อุณหภูมิสูงสุด (°C) */
  highC: number;
  /** Low temperature in Celsius. */
  /** (TH) อุณหภูมิต่ำสุด (°C) */
  lowC: number;
  /** Precipitation probability as percent 0..100. */
  /** (TH) โอกาสฝนตก (%) */
  precipChance: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Lucide icon per condition. */
/** (TH) ไอคอน lucide ของแต่ละสภาพอากาศ */
const COND_ICON: Record<Condition, React.ElementType> = {
  sunny: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

/** Tailwind text color per condition. */
/** (TH) สีข้อความ Tailwind ของแต่ละสภาพ */
const COND_COLOR: Record<Condition, string> = {
  sunny: "text-amber-500",
  cloudy: "text-slate-400",
  rain: "text-sky-500",
  snow: "text-cyan-400",
  storm: "text-violet-500",
};

/** Tailwind gradient + text classes for the "today" hero background. */
/** (TH) gradient/ข้อความของ hero โหมด today */
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

// ─── Seeded RNG ──────────────────────────────────────────────────────────────

/**
 * A simple Linear Congruential Generator. Returns a pure function that
 * yields a new pseudo-random [0..1) on each call. Deterministic for a
 * given seed — that's the whole point.
 *
 * (TH) LCG อย่างง่าย — คืน function ที่สุ่ม [0..1) ตามลำดับ deterministic
 * ทุกครั้งที่ seed เท่ากัน
 */
function lcg(seed: number): () => number {
  let s = ((seed % 233280) + 233280) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Convert a destination's id (a string slug) into a stable numeric
 * seed by summing char codes.
 *
 * (TH) แปลง id ของจุดหมาย (string) เป็น seed ตัวเลขที่เสถียร โดย sum
 * char code
 */
function destSeed(d: Destination): number {
  return d.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}

// ─── Weather generation ──────────────────────────────────────────────────────

/**
 * Approximate the base daily temperature for a destination in a given
 * calendar month. Uses the destination's hemisphere + season label
 * to shape a cosine curve that peaks in mid-summer.
 *
 * (TH) คำนวณอุณหภูมิฐานของจุดหมายในเดือนใด ๆ — อิงซีกโลก + label ฤดู
 * แล้วใช้ cosine ให้พีคกลางฤดูร้อน
 */
function monthBaseTempC(dest: Destination, month: number): number {
  const ds = destSeed(dest);
  // Southern hemisphere peaks in February instead of July.
  // ซีกโลกใต้พีคกุมภาแทนกรกฎา
  const isSouthern = dest.coords.lat < 0;
  const peakMonth = isSouthern ? 1 : 7;
  // Pick a base "peak" temperature from the destination's season label.
  // เลือกอุณหภูมิพีคจากธีมฤดูของจุดหมาย
  const peakBase =
    dest.season === "winter" ? 9 :
    dest.season === "summer" ? 31 :
    dest.season === "spring" ? 22 :
    dest.season === "autumn" ? 18 : 27;
  // Amplitude (how far temps swing) varies slightly per destination.
  // amplitude (ช่วงสูง-ต่ำของอุณหภูมิ) แปรไปตามจุดหมาย
  const amplitude = 9 + (ds % 6);
  const angle = (((month - 1) - peakMonth + 12) % 12) * ((Math.PI * 2) / 12);
  const seasonal = Math.cos(angle) * amplitude;
  // Small per-destination offset so two "summer" places aren't identical.
  // offset ต่อจุดหมายเล็กน้อยกัน "summer" ทุกที่เท่ากัน
  const destOffset = (ds % 9) - 4;
  return Math.round(peakBase + seasonal * 0.45 + destOffset);
}

/**
 * Pick a `Condition` for a specific destination/date. Tropical
 * destinations get rainy bias in May–Oct; cold "winter" places get
 * snow/cloud bias in deep winter months.
 *
 * (TH) สุ่มสภาพอากาศของจุดหมาย/วันใด ๆ — เขตร้อนมีโอกาสฝนมากใน พ.ค.–ต.ค.
 * และเมืองหนาวมีโอกาสหิมะ/เมฆมากในเดือนกลางฤดูหนาว
 */
function dayCondition(dest: Destination, date: Date): Condition {
  const ds = destSeed(dest);
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const rand = lcg(ds * 1000 + m * 37 + d * 13);
  const r = rand();
  const tropical = Math.abs(dest.coords.lat) < 25;
  const isWinter = dest.season === "winter";

  if (tropical) {
    // May–October bias toward rain/storm in the tropics (wet season).
    // เขตร้อน พ.ค.–ต.ค. = หน้าฝน
    const wet = m >= 5 && m <= 10;
    if (wet) {
      if (r < 0.32) return "rain";
      if (r < 0.52) return "cloudy";
      if (r < 0.60) return "storm";
      return "sunny";
    }
    // Tropical dry season — mostly sunny.
    // หน้าแล้งเขตร้อน — ส่วนใหญ่แดด
    if (r < 0.07) return "rain";
    if (r < 0.16) return "cloudy";
    return "sunny";
  }

  if (isWinter && (m <= 2 || m >= 11)) {
    // Deep winter for "winter" destinations — snow/cloud bias.
    // ฤดูหนาวจริง ๆ ของเมืองหนาว — โน้มไปทาง snow/cloud
    if (r < 0.28) return "snow";
    if (r < 0.50) return "cloudy";
    if (r < 0.62) return "rain";
    return "sunny";
  }

  // Default temperate / shoulder-season weights.
  // ค่า default — เมืองปกติหรือช่วงรอยต่อฤดู
  if (r < 0.18) return "rain";
  if (r < 0.30) return "cloudy";
  if (r < 0.36) return "storm";
  return "sunny";
}

/**
 * Build a full `DayForecast` (condition + high + low + precip) for
 * one destination/date.
 *
 * (TH) สร้าง `DayForecast` ครบของ 1 วันจาก destination + date
 */
function forecastDay(dest: Destination, date: Date): DayForecast {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const ds = destSeed(dest);
  const rand = lcg(ds * 500 + m * 200 + d * 17);
  const base = monthBaseTempC(dest, m);
  const highC = Math.round(base + rand() * 5 - 1);
  const lowC = Math.round(highC - 5 - rand() * 5);
  const condition = dayCondition(dest, date);
  // Precip chance is biased high for rain/storm, low for sunny.
  // โอกาสฝนสูงเมื่อ rain/storm, ต่ำเมื่อแดด
  const precip =
    condition === "rain" || condition === "storm" ? Math.round(55 + rand() * 40) :
    condition === "cloudy" ? Math.round(rand() * 25) :
    Math.round(rand() * 8);
  return { date, condition, highC, lowC, precipChance: precip };
}

/** Generate N consecutive days starting at `start`. */
/** (TH) สร้างพยากรณ์ N วันต่อเนื่องเริ่มที่ `start` */
function forecastRange(dest: Destination, start: Date, days: number): DayForecast[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return forecastDay(dest, d);
  });
}

/** Generate every day of a calendar month. */
/** (TH) สร้างพยากรณ์ทั้งเดือน */
function forecastMonth(dest: Destination, year: number, month: number): DayForecast[] {
  // `new Date(year, month, 0)` → last day of the previous (1-indexed) month.
  // `new Date(year, month, 0)` → วันสุดท้ายของเดือนก่อนหน้า (1-indexed)
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) =>
    forecastDay(dest, new Date(year, month - 1, i + 1))
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Tiny wrapper that renders the right lucide icon for a condition with
 * its theme color applied.
 *
 * (TH) ตัวห่อเล็ก ๆ — render ไอคอน lucide ของ condition พร้อมสีของธีม
 */
function CondIcon({ c, className }: { c: Condition; className?: string }) {
  const I = COND_ICON[c];
  return <I className={cn(COND_COLOR[c], className)} strokeWidth={1.8} />;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Render the weather card for a destination. Tabbed view between
 * Today / 7-Day / Monthly. Calendar nav clamps to ≥ current month
 * (no past months allowed via the back arrow).
 *
 * (TH) แสดงการ์ดอากาศของจุดหมาย แท็บ Today / 7-Day / Monthly ปฏิทินกัน
 * ไม่ให้ย้อนไปก่อนเดือนปัจจุบัน (ปุ่ม back disable)
 */
export function WeatherWidget({ destination }: { destination: Destination }) {
  // `today` is anchored once per render — used by every computed value.
  // `today` คงที่ต่อ 1 render — ค่าทั้งหมดด้านล่างพึ่งค่านี้
  const today = new Date();
  // Active tab.
  // แท็บที่กำลังโชว์
  const [view, setView] = React.useState<View>("today");
  // Month + year currently shown in the calendar view.
  // เดือน/ปีของปฏิทินที่เปิดอยู่
  const [viewMonth, setViewMonth] = React.useState(today.getMonth() + 1);
  const [viewYear, setViewYear] = React.useState(today.getFullYear());

  // Memoize each forecast so we don't regenerate on every render.
  // memo พยากรณ์ทุกชุด — กันการสร้างใหม่ทุก render
  const todayForecast = React.useMemo(() => forecastDay(destination, today), [destination]);
  const weekForecast = React.useMemo(() => forecastRange(destination, today, 7), [destination]);
  const monthData = React.useMemo(
    () => forecastMonth(destination, viewYear, viewMonth),
    [destination, viewYear, viewMonth]
  );

  // Disable the back arrow when going back would land in a past month.
  // disable ปุ่ม back ถ้ากลับไปจะถึงเดือนที่ผ่านมาแล้ว
  const canGoBack = React.useMemo(() => {
    const y = viewMonth === 1 ? viewYear - 1 : viewYear;
    const m = viewMonth === 1 ? 12 : viewMonth - 1;
    return y > today.getFullYear() || (y === today.getFullYear() && m >= today.getMonth() + 1);
  }, [viewMonth, viewYear, today]);

  /**
   * Move the calendar view forward/back by `delta` months, rolling the
   * year over at boundaries.
   *
   * (TH) เลื่อนปฏิทินไปข้างหน้า/หลังตาม `delta` — ข้ามปีเมื่อเลย 1/12
   */
  const shiftMonth = (delta: number) => {
    setViewMonth((m) => {
      const next = m + delta;
      if (next < 1) {
        setViewYear((y) => y - 1);
        return 12;
      }
      if (next > 12) {
        setViewYear((y) => y + 1);
        return 1;
      }
      return next;
    });
  };

  // Monthly aggregates (avg high/low + rainy day count).
  // ค่าเฉลี่ยรายเดือน (สูง/ต่ำเฉลี่ย + จำนวนวันฝน)
  const monthStats = React.useMemo(() => {
    const avgHigh = Math.round(monthData.reduce((s, d) => s + d.highC, 0) / monthData.length);
    const avgLow = Math.round(monthData.reduce((s, d) => s + d.lowC, 0) / monthData.length);
    const rainyDays = monthData.filter((d) => d.condition === "rain" || d.condition === "storm").length;
    return { avgHigh, avgLow, rainyDays };
  }, [monthData]);

  // Min/max temperatures across the week for the bar chart normalization.
  // ช่วง min/max ของอุณหภูมิทั้งสัปดาห์ — ใช้ normalize ตำแหน่งแถบ
  const weekTemps = React.useMemo(
    () => ({
      min: Math.min(...weekForecast.map((d) => d.lowC)),
      max: Math.max(...weekForecast.map((d) => d.highC)),
    }),
    [weekForecast]
  );

  return (
    // Card wrapper — height fits content, overflow hidden so rounded corners clip.
    // ตัวห่อการ์ด — สูงเท่าเนื้อหา, overflow hidden เพื่อ clip มุมโค้ง
    <Card className="h-fit overflow-hidden">
      {/* Tab row — today / week / month. */}
      {/* แถวแท็บ — today / week / month */}
      <div className="flex border-b border-border/60">
        {(["today", "week", "month"] as View[]).map((v) => (
          /* One tab button. */
          /* ปุ่มแท็บหนึ่ง */
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

      {view === "today" && (
        /* Today view — gradient hero + 5-day mini strip. */
        /* โหมด today — hero gradient + แถบ 5 วันด้านล่าง */
        <>
          {/* Hero area whose gradient varies with condition. */}
          {/* ส่วน hero — gradient เปลี่ยนตามสภาพอากาศ */}
          <div className={cn("relative bg-gradient-to-br p-5", HERO_GRADIENT[todayForecast.condition])}>
            {/* Top row — left labels/temperature, right big icon. */}
            {/* แถวบน — ซ้าย: label/อุณหภูมิ, ขวา: icon ใหญ่ */}
            <div className="flex items-start justify-between">
              {/* Left side text cluster. */}
              {/* กลุ่มข้อความซ้าย */}
              <div>
                {/* Subtitle "<destination> · Now". */}
                {/* subtitle "<destination> · Now" */}
                <div className="text-xs uppercase tracking-wider opacity-75">
                  {destination.title} · Now
                </div>
                {/* Temperature row. */}
                {/* แถวอุณหภูมิ */}
                <div className="mt-1 flex items-baseline gap-1">
                  {/* Big number. */}
                  {/* ตัวเลขใหญ่ */}
                  <span className="text-5xl font-semibold tracking-tighter">
                    {todayForecast.highC}°
                  </span>
                  {/* Unit. */}
                  {/* หน่วย C */}
                  <span className="text-sm opacity-75">C</span>
                </div>
                {/* Condition + low temperature line. */}
                {/* บรรทัด condition + อุณหภูมิต่ำสุด */}
                <div className="mt-1 text-xs opacity-75 capitalize">
                  {todayForecast.condition} · low {todayForecast.lowC}°
                </div>
              </div>
              {/* Large condition icon. */}
              {/* ไอคอน condition ขนาดใหญ่ */}
              <CondIcon c={todayForecast.condition} className="h-12 w-12 drop-shadow" />
            </div>
            {/* Three-stat row — rain / wind / feels-like. */}
            {/* แถวสรุป 3 ค่า — ฝน / ลม / เหมือนจริง */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <Stat icon={<Droplet className="h-3.5 w-3.5" />} label={`${todayForecast.precipChance}% rain`} />
              <Stat icon={<Wind className="h-3.5 w-3.5" />} label={`${10 + (destSeed(destination) % 12)} km/h`} />
              <Stat icon={<Thermometer className="h-3.5 w-3.5" />} label={`Feels ${todayForecast.highC - 1}°`} />
            </div>
          </div>
          {/* 5-day mini strip under the hero. */}
          {/* แถบ mini 5 วันใต้ hero */}
          <CardContent className="px-5 py-4">
            {/* 5-up grid. */}
            {/* กริด 5 ช่อง */}
            <div className="grid grid-cols-5 gap-2 text-center">
              {forecastRange(destination, today, 5).map((f, i) => (
                /* One mini-day cell. */
                /* เซลล์วันหนึ่งใน mini strip */
                <div key={i} className="space-y-1">
                  {/* Day label — "Now" for index 0, else short weekday. */}
                  {/* label วัน — index 0 = "Now" ที่เหลือ = ชื่อย่อ */}
                  <div className="text-[10px] uppercase text-muted-foreground">
                    {i === 0 ? "Now" : DAY_NAMES[f.date.getDay()]}
                  </div>
                  {/* Small condition icon. */}
                  {/* ไอคอน condition ขนาดเล็ก */}
                  <CondIcon c={f.condition} className="mx-auto h-4 w-4" />
                  {/* High temperature. */}
                  {/* อุณหภูมิสูงสุด */}
                  <div className="text-sm font-medium">{f.highC}°</div>
                </div>
              ))}
            </div>
          </CardContent>
        </>
      )}

      {view === "week" && (
        /* 7-day list view with horizontal temperature bars. */
        /* โหมด 7 วันแบบลิสต์ พร้อมแถบอุณหภูมิแนวนอน */
        <CardContent className="px-4 py-3">
          {/* Day rows. */}
          {/* แถวรายวัน */}
          <div className="space-y-1">
            {weekForecast.map((f, i) => {
              // Compute bar position/length using the global week min/max.
              // คำนวณตำแหน่ง/ความยาวแถบจากค่า min/max ทั้งสัปดาห์
              const barMin = weekTemps.min;
              const barRange = weekTemps.max - barMin || 1;
              const left = ((f.lowC - barMin) / barRange) * 100;
              const width = ((f.highC - f.lowC) / barRange) * 100;
              const isToday = i === 0;
              return (
                // One row in the 7-day view.
                // แถวหนึ่งในโหมด 7 วัน
                <div
                  key={i}
                  className={cn(
                    "grid items-center gap-2 rounded-xl px-2 py-1.5 text-sm",
                    "grid-cols-[56px_20px_40px_1fr_36px]",
                    isToday && "bg-accent/8 font-medium"
                  )}
                >
                  {/* Day label cell. */}
                  {/* เซลล์ label วัน */}
                  <span className="text-xs text-muted-foreground">
                    {isToday
                      ? "Today"
                      : `${DAY_NAMES[f.date.getDay()]} ${f.date.getDate()}`}
                  </span>
                  {/* Condition icon. */}
                  {/* ไอคอน condition */}
                  <CondIcon c={f.condition} className="h-4 w-4" />
                  {/* Rain chance %. */}
                  {/* % โอกาสฝน */}
                  <span className="text-right text-xs text-muted-foreground">
                    {f.precipChance}%
                  </span>
                  {/* Temperature bar track + fill. */}
                  {/* แทร็ก + แถบเติมอุณหภูมิ */}
                  <div className="relative h-1.5 rounded-full bg-muted">
                    {/* Filled portion = low→high range scaled across the week. */}
                    {/* ส่วนเติม = ช่วงต่ำ→สูง scale ทั้งสัปดาห์ */}
                    <div
                      className="absolute h-full rounded-full bg-gradient-to-r from-sky-400 to-amber-400"
                      style={{ left: `${left}%`, width: `${Math.max(width, 6)}%` }}
                    />
                  </div>
                  {/* Low/high values. */}
                  {/* ค่าต่ำ/สูง */}
                  <span className="text-right text-xs font-medium">
                    {f.lowC}°/{f.highC}°
                  </span>
                </div>
              );
            })}
          </div>
          {/* Legend row. */}
          {/* แถวคำอธิบาย */}
          <div className="mt-3 flex justify-between px-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Droplet className="h-3 w-3" /> Rain chance
            </span>
            <span className="flex items-center gap-1">
              <Thermometer className="h-3 w-3" /> Low / High
            </span>
          </div>
        </CardContent>
      )}

      {view === "month" && (
        /* Monthly calendar view — month nav + summary + grid. */
        /* โหมดเดือน — ปุ่มเปลี่ยนเดือน + สรุป + ตารางปฏิทิน */
        <CardContent className="px-3 py-3">
          {/* Month nav row. */}
          {/* แถวเปลี่ยนเดือน */}
          <div className="mb-3 flex items-center justify-between">
            {/* Previous-month button (disabled when canGoBack=false). */}
            {/* ปุ่มเดือนก่อนหน้า (disable เมื่อย้อนไม่ได้) */}
            <button
              onClick={() => shiftMonth(-1)}
              disabled={!canGoBack}
              className="rounded-lg p-1 text-muted-foreground hover:bg-accent/10 hover:text-foreground disabled:opacity-30"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {/* Center label — month/year + destination. */}
            {/* label กลาง — เดือน/ปี + ชื่อ destination */}
            <div className="text-center">
              <div className="text-sm font-semibold">
                {MONTH_NAMES[viewMonth - 1]} {viewYear}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {destination.title}
              </div>
            </div>
            {/* Next-month button. */}
            {/* ปุ่มเดือนถัดไป */}
            <button
              onClick={() => shiftMonth(1)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-accent/10 hover:text-foreground"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Monthly stats summary (avg high/low + rainy day count). */}
          {/* การ์ดสรุปเดือน — สูง/ต่ำเฉลี่ย + วันฝน */}
          <div className="mb-3 grid grid-cols-3 gap-1.5 rounded-2xl border border-border/60 bg-secondary/30 p-2 text-center text-xs">
            {/* Avg high cell. */}
            {/* avg high */}
            <div>
              <div className="font-semibold text-amber-500">{monthStats.avgHigh}°</div>
              <div className="text-[10px] text-muted-foreground">Avg High</div>
            </div>
            {/* Avg low cell. */}
            {/* avg low */}
            <div>
              <div className="font-semibold text-sky-500">{monthStats.avgLow}°</div>
              <div className="text-[10px] text-muted-foreground">Avg Low</div>
            </div>
            {/* Rainy day count cell. */}
            {/* จำนวนวันฝน */}
            <div>
              <div className="font-semibold text-blue-500">{monthStats.rainyDays}d</div>
              <div className="text-[10px] text-muted-foreground">Rainy Days</div>
            </div>
          </div>

          {/* Day-of-week column headers (single letter). */}
          {/* หัวคอลัมน์ของวันในสัปดาห์ (อักษรเดียว) */}
          <div className="mb-1 grid grid-cols-7 text-center">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-[10px] font-medium text-muted-foreground">
                {d[0]}
              </div>
            ))}
          </div>

          {/* Actual calendar cells. */}
          {/* เซลล์ปฏิทินจริง */}
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

// ─── Sub-components ──────────────────────────────────────────────────────────

/**
 * One pill in the today-view three-up stats row.
 *
 * (TH) pill เดียวในแถวสรุป 3 ค่า ของโหมด today
 */
function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    // Pill container.
    // ตัวห่อ pill
    <div className="flex items-center gap-1.5 rounded-xl bg-white/40 px-2.5 py-1.5 dark:bg-black/20">
      {icon} {label}
    </div>
  );
}

/**
 * Render the day grid of the monthly calendar. Pads leading days
 * (before day-1) with empty cells, highlights today, and dims past
 * days.
 *
 * (TH) วาดตารางวันของปฏิทินรายเดือน — เติมเซลล์ว่างก่อนวันที่ 1, ไฮไลต์
 * วันนี้, และทำให้วันที่ผ่านมาแล้วโปร่งจาง
 */
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
  // Day-of-week of the first calendar cell (Sun = 0).
  // วันในสัปดาห์ของวันแรก (อาทิตย์ = 0)
  const firstDow = new Date(year, month - 1, 1).getDay();
  // Total cells needed = leading pad + days in month.
  // จำนวนเซลล์ที่ต้องการ = ช่องเว้นนำ + วันในเดือน
  const totalCells = firstDow + days.length;
  // Round up to whole rows of 7.
  // ปัดขึ้นเป็นแถวของ 7
  const rows = Math.ceil(totalCells / 7);
  // Build the flat cell list, inserting nulls for the leading pad.
  // สร้าง list เซลล์แบนราบ ใส่ null เว้นช่องนำ
  const cells = Array.from({ length: rows * 7 }, (_, i) => {
    const dayIndex = i - firstDow;
    return dayIndex >= 0 && dayIndex < days.length ? days[dayIndex] : null;
  });

  /** Is this forecast's date == calendar "today"? */
  /** (TH) เป็นวันเดียวกับวันนี้หรือไม่ */
  const isToday = (f: DayForecast) =>
    f.date.getDate() === today.getDate() &&
    f.date.getMonth() === today.getMonth() &&
    f.date.getFullYear() === today.getFullYear();

  /** Is this forecast's date strictly before today? */
  /** (TH) วันที่ผ่านไปแล้วหรือยัง (ก่อนวันนี้) */
  const isPast = (f: DayForecast) =>
    f.date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    // 7-column calendar grid.
    // กริดปฏิทิน 7 คอลัมน์
    <div className="grid grid-cols-7 gap-[3px]">
      {cells.map((f, i) => {
        if (!f) {
          // Empty pad cell before day 1.
          // ช่องว่างก่อนวันที่ 1
          return <div key={`empty-${i}`} />;
        }
        const today_ = isToday(f);
        const past = isPast(f);
        return (
          // One day cell — date number, condition icon, high temperature.
          // เซลล์วันหนึ่ง — เลขวัน, icon condition, อุณหภูมิสูงสุด
          <div
            key={i}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg p-0.5 pt-1 text-center transition-colors",
              today_ && "bg-accent/20 ring-1 ring-accent/60",
              !today_ && !past && "hover:bg-secondary/60",
              past && "opacity-40"
            )}
          >
            {/* Day number. */}
            {/* เลขวัน */}
            <span
              className={cn(
                "text-[10px] leading-none",
                today_ ? "font-bold text-accent" : "text-muted-foreground"
              )}
            >
              {f.date.getDate()}
            </span>
            {/* Tiny condition icon. */}
            {/* ไอคอน condition เล็ก */}
            <CondIcon c={f.condition} className="h-3 w-3" />
            {/* High temperature. */}
            {/* อุณหภูมิสูงสุด */}
            <span className="text-[10px] font-medium leading-none">{f.highC}°</span>
          </div>
        );
      })}
    </div>
  );
}
