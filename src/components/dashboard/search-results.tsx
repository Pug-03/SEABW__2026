/**
 * @file `<SearchResults>` — destination grid shown beneath the search
 * bar after the user submits a query. Filters `DESTINATIONS` client-side
 * against title, region, tags, and trip type, and renders either a
 * grid of result cards or an empty-state panel.
 *
 * (TH) กริดแสดง destination ที่ตรงกับคำค้น — โผล่ใต้ search bar หลังกด
 * submit กรองจาก title, region, tags, tripType ฝั่ง client ถ้าเจอจะแสดง
 * เป็นกริดการ์ด ถ้าไม่เจอจะแสดง panel แจ้งว่าไม่พบ
 */

"use client";

import * as React from "react";
import { ArrowRight, MapPin, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DESTINATIONS } from "@/lib/mock-data";
import type { Destination } from "@/lib/types";

/**
 * Props for `<SearchResults>`. The component is fully controlled — the
 * parent owns the query string and the click handlers.
 *
 * (TH) Props: ทุกค่าเป็น controlled — parent ถือ query และ handler ทั้งหมด
 */
interface SearchResultsProps {
  query: string;
  onPick?: (destinationId: string) => void;
  onClear?: () => void;
}

/**
 * Case-insensitive matcher over a destination's searchable text. Pulled
 * out as a function so it can be reused/tested independently.
 *
 * (TH) ฟังก์ชันเช็คว่า destination ตรงกับคำค้นหรือไม่ (ไม่สนตัวพิมพ์)
 * แยกออกมาเพื่อให้ทดสอบและนำกลับมาใช้ใหม่ได้ง่าย
 */
function matches(d: Destination, q: string): boolean {
  const needle = q.toLowerCase();
  return (
    d.title.toLowerCase().includes(needle) ||
    d.region.toLowerCase().includes(needle) ||
    d.tags.some((t) => t.toLowerCase().includes(needle)) ||
    d.tripType.toLowerCase().includes(needle)
  );
}

/**
 * Render the search results panel. Returns `null` when the query is
 * empty, so the parent doesn't need to guard the render.
 *
 * (TH) แสดง panel ผลค้นหา ถ้า query ว่างจะคืน null — parent ไม่ต้องเช็คเอง
 */
export function SearchResults({ query, onPick, onClear }: SearchResultsProps) {
  // Memoize the filtered list so we don't re-scan on every parent render.
  // memo รายการที่กรองแล้ว — กันการกรองใหม่ทุกครั้งที่ parent re-render
  const results = React.useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return DESTINATIONS.filter((d) => matches(d, q));
  }, [query]);

  // Empty query → render nothing.
  // ถ้า query ว่าง ไม่ต้อง render อะไรเลย
  if (!query.trim()) return null;

  return (
    // Outer section — `aria-live` so screen readers announce result changes.
    // section ภายนอก — ใส่ aria-live เพื่อให้ screen reader ประกาศผลใหม่
    <section className="space-y-4" aria-live="polite">
      {/* Header row — pill + result count, clear button on the right. */}
      {/* แถวหัว — ป้าย + จำนวนผลลัพธ์ ปุ่มล้างทางขวา */}
      <div className="flex items-end justify-between gap-2 px-1">
        {/* Left column — pill + heading. */}
        {/* คอลัมน์ซ้าย — ป้าย + หัวเรื่อง */}
        <div>
          {/* "Search results" pill. */}
          {/* ป้ายว่า "Search results" */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            Search results
          </div>
          {/* Heading — count or "No results" copy. */}
          {/* หัวเรื่อง — แสดงจำนวนผลลัพธ์ หรือ "No results" */}
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {results.length > 0
              ? `${results.length} match${results.length === 1 ? "" : "es"} for "${query}"`
              : `No results found for "${query}"`}
          </h2>
        </div>
        {onClear && (
          /* Clear button — only when `onClear` was provided. */
          /* ปุ่มล้าง — แสดงเฉพาะเมื่อ caller ส่ง onClear มา */
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear search
          </Button>
        )}
      </div>

      {results.length === 0 ? (
        /* Empty state when nothing matched. */
        /* state ว่าง เมื่อไม่มีรายการตรงคำค้น */
        <NoResults query={query} onClear={onClear} />
      ) : (
        /* Result grid — responsive columns (1 → 4 cols by breakpoint). */
        /* กริดผลลัพธ์ — คอลัมน์ปรับตามจอ (1 → 4) */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((d) => (
            /* One result card. */
            /* การ์ดผลลัพธ์ 1 อัน */
            <ResultCard
              key={d.id}
              destination={d}
              onClick={() => onPick?.(d.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * One destination card inside the result grid. Implemented as a
 * keyboard-accessible button-like Card so it can be operated without
 * a mouse.
 *
 * (TH) การ์ด destination ใน grid ผลลัพธ์ — ใช้ Card ที่ทำหน้าที่เหมือนปุ่ม
 * เพื่อให้ใช้คีย์บอร์ดได้ด้วย
 */
function ResultCard({
  destination,
  onClick,
}: {
  destination: Destination;
  onClick?: () => void;
}) {
  return (
    // The card itself — role/tabIndex/keyDown make it a real button.
    // ตัวการ์ด — ใส่ role/tabIndex/keyDown ให้กลายเป็นปุ่มที่ใช้คีย์บอร์ดได้
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        // Treat Enter / Space as clicks (standard for activatable elements).
        // Enter/Space = คลิก (มาตรฐานของ element ที่กดได้)
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="group cursor-pointer overflow-hidden outline-none transition-shadow hover:-translate-y-0.5 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Image area with gradient overlay + floating tag badges. */}
      {/* ส่วนรูป + overlay ไล่สี + badge แท็กลอย */}
      <div className="relative h-40 w-full overflow-hidden">
        {/* Destination photo. */}
        {/* รูป destination */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={destination.imageUrl}
          alt={destination.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Dark gradient from the bottom — makes white badges legible. */}
        {/* ไล่สีดำจากด้านล่าง — เพื่อให้ badge สีขาวอ่านได้ */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        {/* Up to two tag badges in the top-left. */}
        {/* badge แท็กสูงสุด 2 อัน มุมซ้ายบน */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
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
      </div>
      {/* Card body — region line + title + arrow icon. */}
      {/* body การ์ด — บรรทัด region + title + ลูกศร */}
      <CardContent className="space-y-1 p-3">
        {/* Region line with pin icon. */}
        {/* บรรทัด region พร้อมไอคอนหมุด */}
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          {/* Pin icon. */}
          {/* ไอคอนหมุด */}
          <MapPin className="h-3 w-3" /> {destination.region}
        </div>
        {/* Title row — destination name on the left, arrow on the right. */}
        {/* แถวหัว — ชื่อ destination ซ้าย, ลูกศรขวา */}
        <div className="flex items-center justify-between gap-2">
          {/* Title text. */}
          {/* ชื่อ destination */}
          <div className="text-base font-semibold tracking-tight">
            {destination.title}
          </div>
          {/* Arrow nudges slightly to the right on hover. */}
          {/* ลูกศรขยับเล็กน้อยตอน hover */}
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Empty-state panel shown when the search matched nothing. Contains
 * the missing-results icon, a clear message, hint copy, and an
 * optional "Clear search" button.
 *
 * (TH) panel state ว่าง เมื่อไม่พบผลลัพธ์ — มี icon, ข้อความบอก, hint
 * แนะนำคำค้นทางเลือก และปุ่ม "Clear search" (ถ้า caller ส่ง handler มา)
 */
function NoResults({
  query,
  onClear,
}: {
  query: string;
  onClear?: () => void;
}) {
  return (
    // Empty-state card.
    // การ์ด empty state
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border/60 bg-card/50 px-6 py-12 text-center backdrop-blur-xl">
      {/* Icon tile centered above the copy. */}
      {/* tile ไอคอนจัดกึ่งกลาง */}
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
        {/* SearchX icon (lucide). */}
        {/* ไอคอน SearchX จาก lucide */}
        <SearchX className="h-6 w-6" />
      </div>
      {/* Headline + hint block. */}
      {/* บล็อกหัวเรื่อง + คำแนะนำ */}
      <div>
        {/* Headline — "No results found for ...". */}
        {/* หัวเรื่อง — "No results found for ..." */}
        <div className="text-base font-medium">
          No results found for &quot;{query}&quot;
        </div>
        {/* Suggestion line for alternate search terms. */}
        {/* คำแนะนำคำค้นทางเลือก */}
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Try a city, region, or vibe like &quot;beach&quot;, &quot;mountain&quot;, or &quot;foodie&quot;.
        </p>
      </div>
      {onClear && (
        /* Clear button — only when caller provides a handler. */
        /* ปุ่มล้าง — แสดงเฉพาะเมื่อ caller ส่ง handler มา */
        <Button variant="glass" size="sm" onClick={onClear}>
          Clear search
        </Button>
      )}
    </div>
  );
}
