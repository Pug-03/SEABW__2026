/**
 * @file `<AIItinerary>` — generates a day-by-day trip plan by calling
 * `/api/ai/itinerary` and renders the result as a vertical timeline.
 * The API tries Claude first and falls back to a deterministic mock if
 * the Anthropic key is not configured (see `route.ts`).
 *
 * (TH) วิดเจ็ตสร้างแผนเที่ยววันต่อวัน เรียก `/api/ai/itinerary` แล้วแสดง
 * เป็น timeline แนวตั้ง — API จะลองเรียก Claude ก่อน ถ้าไม่มี key จะใช้
 * mock แทน (ดูใน route.ts)
 */

"use client";

import * as React from "react";
import {
  Calendar,
  Clock,
  Loader2,
  Sparkles,
  User as UserIcon,
  Wand2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DESTINATIONS } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import type { Itinerary } from "@/lib/types";

// Allowed trip-length options shown in the dropdown.
// ตัวเลือกระยะเวลาทริปที่อนุญาตให้เลือก
const DAY_OPTIONS = [2, 3, 5, 7] as const;

/**
 * Props for `<AIItinerary>`. All are optional — the widget works
 * stand-alone with default destination, no members, and no budget.
 *
 * (TH) Props ทั้งหมดเป็น optional — widget ใช้งานได้แม้ไม่มีค่าจาก parent
 */
interface AIItineraryProps {
  initialDestinationId?: string;
  members?: { id: string; name: string }[];
  budget?: number;
  preferences?: string[];
}

/**
 * The itinerary card. Holds destination/days form state, the fetched
 * itinerary, and a loading/error flag.
 *
 * (TH) การ์ด itinerary — เก็บ destination, จำนวนวัน, itinerary ที่ดึงได้
 * และ flag loading/error
 */
export function AIItinerary({
  initialDestinationId,
  members = [],
  budget,
  preferences = [],
}: AIItineraryProps) {
  // Destination ID controlled locally so the user can preview different cities.
  // เลือก destination ได้ใน widget — ให้ผู้ใช้เปลี่ยนได้
  const [destId, setDestId] = React.useState(
    initialDestinationId ?? DESTINATIONS[0].id
  );
  // Number of days (controls API request + result badge).
  // จำนวนวัน — ส่งไป API + แสดงบน badge
  const [days, setDays] = React.useState(3);
  // True while the API request is in-flight.
  // true ระหว่าง fetch API
  const [loading, setLoading] = React.useState(false);
  // Inline error string.
  // ข้อความ error inline
  const [error, setError] = React.useState<string | null>(null);
  // Fetched itinerary (null until generated).
  // itinerary ที่ดึงมา (null ถ้ายังไม่ได้กดสร้าง)
  const [itinerary, setItinerary] = React.useState<Itinerary | null>(null);
  // Which source produced the itinerary — for the "Claude" vs "Demo plan" badge.
  // ที่มาของผลลัพธ์ — ใช้แสดง badge "Claude" vs "Demo plan"
  const [source, setSource] = React.useState<"anthropic" | "mock" | null>(null);

  // Resolve the chosen destination object (fallback to first).
  // หา destination ที่เลือก (fallback เป็นตัวแรก)
  const dest = DESTINATIONS.find((d) => d.id === destId) ?? DESTINATIONS[0];

  /**
   * Hit `/api/ai/itinerary` with the current options. Logs structured
   * input so the backend can hand off to Claude or the mock generator.
   *
   * (TH) เรียก `/api/ai/itinerary` ด้วยค่าปัจจุบัน — ส่ง input แบบมีโครงสร้าง
   * เพื่อให้ backend ส่งต่อให้ Claude หรือ mock generator
   */
  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/itinerary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          destination: `${dest.title}, ${dest.region}`,
          members: members.map((m) => m.name),
          budget,
          preferences,
          days,
          nights: days - 1,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as {
        itinerary: Itinerary;
        source: "anthropic" | "mock";
      };
      setItinerary(data.itinerary);
      setSource(data.source);
    } catch (e) {
      setError("Could not generate itinerary. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Card with overflow-hidden so the timeline doesn't poke out.
    // การ์ด overflow-hidden เพื่อให้ timeline ไม่เกินขอบ
    <Card className="overflow-hidden">
      {/* Card header — title + days badge. */}
      {/* header — title + badge จำนวนวัน */}
      <CardHeader className="pb-3">
        {/* Header row. */}
        {/* แถวหัว */}
        <div className="flex items-center justify-between">
          {/* Title with wand icon. */}
          {/* title พร้อมไอคอนไม้เท้าวิเศษ */}
          <CardTitle className="flex items-center gap-2 text-base">
            {/* Wand icon. */}
            {/* ไอคอนไม้เท้า */}
            <Wand2 className="h-4 w-4 text-accent" />
            AI Trip Plan
          </CardTitle>
          {/* AI badge with days summary. */}
          {/* badge AI พร้อมจำนวนวัน */}
          <Badge variant="ai">
            <Sparkles className="h-3 w-3" /> {days}D / {days - 1}N
          </Badge>
        </div>
      </CardHeader>
      {/* Card body — controls + result. */}
      {/* body — ปุ่ม/dropdown + ผลลัพธ์ */}
      <CardContent className="space-y-3">
        {/* Control row — destination select + days select + generate button. */}
        {/* แถว control — select destination + select days + ปุ่ม generate */}
        <div className="grid gap-2 grid-cols-1 sm:flex sm:flex-row">
          {/* Destination dropdown. */}
          {/* dropdown destination */}
          <select
            value={destId}
            onChange={(e) => setDestId(e.target.value)}
            className="h-10 w-full min-w-0 rounded-2xl border border-input bg-background/50 px-3 text-sm sm:flex-1"
          >
            {DESTINATIONS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}, {d.region}
              </option>
            ))}
          </select>
          {/* Days dropdown. */}
          {/* dropdown จำนวนวัน */}
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-10 w-full rounded-2xl border border-input bg-background/50 px-3 text-sm sm:w-28"
          >
            {DAY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d} days
              </option>
            ))}
          </select>
          {/* Generate button — shows spinner while loading. */}
          {/* ปุ่ม generate — โชว์ spinner ระหว่าง loading */}
          <Button
            variant="accent"
            onClick={generate}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate AI Trip Plan
              </>
            )}
          </Button>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {itinerary && (
          /* Timeline result. */
          /* ส่วนผลลัพธ์เป็น timeline */
          <TripTimeline itinerary={itinerary} source={source} members={members} />
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Props for the timeline sub-component. Separated so the parent owns
 * the fetch lifecycle and the timeline is pure render.
 *
 * (TH) Props ของ sub-component timeline — แยกออกมาเพื่อให้ parent ดูแล
 * lifecycle ของการเรียก API ส่วนนี้เป็น pure render
 */
interface TripTimelineProps {
  itinerary: Itinerary;
  source: "anthropic" | "mock" | null;
  members: { id: string; name: string }[];
}

/**
 * Render the day-by-day timeline. Sums activity costs to show the
 * total against the planned budget.
 *
 * (TH) แสดง timeline ทีละวัน — รวมค่าใช้จ่ายของกิจกรรมเพื่อเทียบกับงบที่ตั้งไว้
 */
function TripTimeline({ itinerary, source, members }: TripTimelineProps) {
  // Sum every activity cost across every day.
  // รวมค่าใช้จ่ายของทุกกิจกรรมทุกวัน
  const totalCost = itinerary.days.reduce(
    (s, d) => s + d.activities.reduce((a, x) => a + x.cost, 0),
    0
  );
  return (
    // Outer wrapper.
    // ตัวห่อ
    <div className="space-y-4">
      {/* Summary bar — destination, days, source badge, budget vs cost. */}
      {/* แถบสรุป — destination, จำนวนวัน, แหล่ง, งบ vs ใช้จริง */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/60 bg-secondary/30 p-3">
        {/* Destination + day count. */}
        {/* destination + จำนวนวัน */}
        <div className="text-sm">
          {/* Destination text. */}
          {/* ข้อความ destination */}
          <span className="font-semibold tracking-tight">
            {itinerary.destination}
          </span>{" "}
          {/* Days count caption. */}
          {/* คำว่า "· N days" */}
          <span className="text-muted-foreground">
            · {itinerary.days.length} days
          </span>
        </div>
        {/* Source badge + budget info. */}
        {/* badge แหล่ง + งบประมาณ */}
        <div className="flex items-center gap-2 text-xs">
          {/* AI vs demo badge. */}
          {/* badge แสดงว่าใช้ Claude หรือ Demo */}
          <Badge variant={source === "anthropic" ? "ai" : "secondary"}>
            {source === "anthropic" ? "Claude" : "Demo plan"}
          </Badge>
          {/* Budget vs estimated cost. */}
          {/* งบ vs ค่าใช้จ่ายประมาณ */}
          <span className="text-muted-foreground">
            Est. {formatCurrency(totalCost)} / budget{" "}
            {formatCurrency(itinerary.totalBudget)}
          </span>
        </div>
      </div>

      {/* Vertical timeline — left border line + numbered dots per day. */}
      {/* timeline แนวตั้ง — เส้นทางซ้าย + วงกลมเลขวัน */}
      <ol className="relative space-y-6 border-l border-border/60 pl-7">
        {itinerary.days.map((day) => (
          /* One day on the timeline. */
          /* หนึ่งวันใน timeline */
          <li key={day.day} className="relative">
            {/* Day number badge — sits on the border line. */}
            {/* badge เลขวัน — วางบนเส้น border */}
            <div className="absolute -left-[27px] top-0 grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white shadow-lg">
              D{day.day}
            </div>
            {/* Day title row — calendar icon + heading. */}
            {/* แถวหัวของวัน — ไอคอนปฏิทิน + heading */}
            <div className="flex min-w-0 items-start gap-2 pl-4">
              {/* Calendar icon. */}
              {/* ไอคอนปฏิทิน */}
              <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {/* Day title. */}
              {/* ชื่อวัน */}
              <h4 className="text-sm font-semibold tracking-tight">
                {day.title}
              </h4>
            </div>
            {/* Activities grid — 2 cols on sm+. */}
            {/* กริดกิจกรรม — 2 คอลัมน์บน sm */}
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {day.activities.map((a, i) => {
                // Rotate through members so each card shows a "responsible" pill.
                // วนรายชื่อสมาชิกเพื่อแสดงผู้รับผิดชอบของแต่ละกิจกรรม
                const responsible =
                  a.responsible ?? members[i % Math.max(1, members.length)]?.name;
                return (
                  // One activity card.
                  // การ์ดกิจกรรมหนึ่งรายการ
                  <div
                    key={i}
                    className="rounded-2xl border border-border/60 bg-card/70 p-3 text-sm shadow-sm transition-shadow hover:shadow-md"
                  >
                    {/* Top row — time + cost. */}
                    {/* แถวบน — เวลา + ราคา */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {/* Time cluster. */}
                      {/* กลุ่มเวลา */}
                      <span className="inline-flex items-center gap-1">
                        {/* Clock icon. */}
                        {/* ไอคอนนาฬิกา */}
                        <Clock className="h-3 w-3" /> {a.time}
                      </span>
                      {/* Cost in accent color. */}
                      {/* ราคาในสี accent */}
                      <span className="font-medium text-accent">
                        {formatCurrency(a.cost)}
                      </span>
                    </div>
                    {/* Activity title. */}
                    {/* ชื่อกิจกรรม */}
                    <div className="mt-1 font-medium leading-snug">
                      {a.title}
                    </div>
                    {/* Activity description. */}
                    {/* คำอธิบาย */}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.description}
                    </p>
                    {responsible && (
                      /* Responsible person line — initials avatar + name. */
                      /* บรรทัดผู้รับผิดชอบ — avatar + ชื่อ */
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        {/* Small avatar with initials. */}
                        {/* avatar เล็กพร้อมอักษรย่อ */}
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[9px]">
                            {responsible.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {/* User icon + name. */}
                        {/* ไอคอน user + ชื่อ */}
                        <UserIcon className="h-3 w-3" /> {responsible}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
