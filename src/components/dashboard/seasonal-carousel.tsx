/**
 * @file `<SeasonalCarousel>` — auto-scrolling "Trending this season"
 * marquee on the dashboard. The list is duplicated end-to-end so the
 * `animate-marquee-x` CSS class can loop seamlessly via a -50%
 * translate. Hovering pauses the animation.
 *
 * (TH) แถบ marquee "Trending this season" บนหน้า dashboard เลื่อนอัตโนมัติ
 * รายการถูกทำซ้ำสองรอบเพื่อให้ animate-marquee-x เลื่อน -50% แล้วต่อเนียน
 * ๆ ได้ ลอย mouse ทับเพื่อหยุดชั่วคราว
 */

"use client";

import * as React from "react";
import { MapPin, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Destination } from "@/lib/types";
import { DESTINATIONS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

/**
 * Props for `<SeasonalCarousel>`.
 *  - `destinations`  — override the default `DESTINATIONS` list.
 *  - `onSelect`      — fires when a card is clicked (legacy callback).
 *  - `onViewDetail`  — fires when a card is clicked (opens detail modal).
 *
 * Both callbacks fire on the same click — `onViewDetail` is the modern
 * path; keep `onSelect` around for any old call sites.
 *
 * (TH) Props: destinations override รายการ default, onSelect/onViewDetail
 * จะถูกเรียกพร้อมกันตอนคลิกการ์ด — `onViewDetail` คือ path ใหม่ ส่วน
 * `onSelect` ใช้กับ caller เก่า
 */
interface SeasonalCarouselProps {
  destinations?: Destination[];
  onSelect?: (id: string) => void;
  onViewDetail?: (id: string) => void;
}

/**
 * The carousel. Manages a single `paused` boolean and renders a
 * looped, animated row of `<DestinationCard>`s inside an edge-faded
 * mask container.
 *
 * (TH) ตัว carousel คุมเฉพาะ flag `paused` แล้ว render แถวการ์ดที่ทำซ้ำ
 * ภายในกล่องที่มี mask ไล่สีที่ขอบซ้าย/ขวา
 */
export function SeasonalCarousel({
  destinations = DESTINATIONS,
  onSelect,
  onViewDetail,
}: SeasonalCarouselProps) {
  // True while the cursor is hovering the marquee.
  // true ระหว่าง cursor อยู่บน marquee
  const [paused, setPaused] = React.useState(false);
  // Duplicate the list end-to-end so the -50% translate loops seamlessly.
  // ทำซ้ำรายการสองรอบเพื่อให้ animation เลื่อน -50% แล้วต่อเนียน
  const looped = React.useMemo(
    () => [...destinations, ...destinations],
    [destinations]
  );

  return (
    // Outer section with header + animated row beneath.
    // section ภายนอก: หัวเรื่องและแถว animation ด้านล่าง
    <section className="space-y-4">
      {/* Header — pill, heading on the left, count hint on the right (desktop). */}
      {/* หัว — ป้าย, หัวเรื่องซ้าย, จำนวน destination ขวา (เฉพาะจอใหญ่) */}
      <div className="flex items-end justify-between px-1">
        {/* Left side: pill + heading. */}
        {/* ฝั่งซ้าย: ป้าย + หัวเรื่อง */}
        <div>
          {/* "Seasonal picks" pill with sparkle. */}
          {/* ป้าย "Seasonal picks" พร้อมไอคอนประกาย */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            {/* Sparkle icon. */}
            {/* ไอคอนประกาย */}
            <Sparkles className="h-3 w-3" /> Seasonal picks
          </div>
          {/* Section heading. */}
          {/* หัวเรื่องของ section */}
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Trending this season
          </h2>
        </div>
        {/* Right side hint (hidden on mobile). */}
        {/* hint ทางขวา (ซ่อนบนมือถือ) */}
        <p className="hidden text-sm text-muted-foreground sm:block">
          Hover to pause · {destinations.length} destinations
        </p>
      </div>

      {/* Marquee wrapper — captures hover to pause and clips the row. */}
      {/* กล่อง marquee — จับ hover เพื่อหยุด และ clip แถวการ์ด */}
      <div
        className="group relative overflow-hidden rounded-3xl"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Left edge fade mask — keeps cards from "popping" off the screen. */}
        {/* mask ไล่สีขอบซ้าย — กันการ์ด "โผล่" หลุดขอบ */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-background to-transparent" />
        {/* Right edge fade mask. */}
        {/* mask ไล่สีขอบขวา */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background to-transparent" />

        {/* Animated row — pauses via `[animation-play-state:paused]`. */}
        {/* แถวที่ animate — หยุดเมื่อ class `[animation-play-state:paused]` ใส่ */}
        <div
          className={cn(
            "flex gap-4 will-change-transform animate-marquee-x",
            paused && "[animation-play-state:paused]"
          )}
          style={{ width: "max-content" }}
        >
          {looped.map((d, idx) => (
            /* One destination card; `idx` in the key disambiguates duplicates. */
            /* การ์ด destination หนึ่งใบ; ใช้ idx ใน key กันคีย์ซ้ำจากการทำซ้ำ list */
            <DestinationCard
              key={`${d.id}-${idx}`}
              destination={d}
              onClick={() => {
                onSelect?.(d.id);
                onViewDetail?.(d.id);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Props for an individual card inside the carousel. */
/** (TH) Props ของการ์ดหนึ่งใบใน carousel */
interface DestinationCardProps {
  destination: Destination;
  onClick?: () => void;
}

/**
 * One destination card. Sized in viewport units (with a fixed `xl`
 * width) to deliberately keep ~5 cards visible at desktop widths.
 *
 * (TH) การ์ด destination หนึ่งใบ — ขนาดเป็น vw (พร้อม width คงที่ที่ xl)
 * เพื่อให้บนเดสก์ท็อปเห็นการ์ดประมาณ 5 ใบในแถบเดียว
 */
function DestinationCard({ destination, onClick }: DestinationCardProps) {
  return (
    // The card is a button so it's keyboard-clickable.
    // ตัวการ์ดใช้ button เพื่อให้กดด้วยคีย์บอร์ดได้
    <button
      onClick={onClick}
      className={cn(
        "group/card relative shrink-0 overflow-hidden rounded-3xl border border-border/60 bg-card text-left shadow-sm transition-all",
        "hover:-translate-y-1 hover:shadow-xl",
        // ~5 cards visible on desktop; fixed at 220px on xl for stability.
        // ~5 ใบบน desktop; กำหนดคงที่ที่ 220px บน xl เพื่อความเสถียร
        "w-[78vw] sm:w-[44vw] md:w-[30vw] lg:w-[18vw] xl:w-[220px]"
      )}
      style={{ aspectRatio: "3/4" }}
    >
      {/* Background photo (scales on hover). */}
      {/* รูปพื้นหลัง (ขยายตอน hover) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={destination.imageUrl}
        alt={destination.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
        loading="lazy"
      />
      {/* Dark gradient from the bottom — makes the white text legible. */}
      {/* ไล่สีดำจากด้านล่าง — เพื่อให้ข้อความสีขาวอ่านได้ */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      {/* Foreground content — tags on top, region/title on bottom. */}
      {/* เนื้อหาด้านหน้า — แท็กบน, region/title ล่าง */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
        {/* Tag badges (up to 2). */}
        {/* badge แท็ก (สูงสุด 2 อัน) */}
        <div className="flex flex-wrap gap-1">
          {destination.tags.slice(0, 2).map((t) => (
            <Badge
              key={t}
              variant="secondary"
              className="border-white/20 bg-white/15 text-white backdrop-blur"
            >
              {t}
            </Badge>
          ))}
        </div>
        {/* Bottom block — region line + title. */}
        {/* บล็อกล่าง — บรรทัด region + ชื่อ */}
        <div>
          {/* Region line with pin icon. */}
          {/* บรรทัด region พร้อมไอคอนหมุด */}
          <div className="flex items-center gap-1 text-[11px] text-white/80">
            {/* Pin icon. */}
            {/* ไอคอนหมุด */}
            <MapPin className="h-3 w-3" /> {destination.region}
          </div>
          {/* Destination title. */}
          {/* ชื่อ destination */}
          <div className="text-lg font-semibold tracking-tight">
            {destination.title}
          </div>
        </div>
      </div>
    </button>
  );
}
