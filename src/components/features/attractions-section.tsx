/**
 * @file `<AttractionsSection>` — paginated, filterable grid of Thai
 * tourist attractions from the bundled `ATTRACTIONS` dataset.
 * Supports region filter, category chips, free-text search across
 * English/Thai names/province/description/type, and "Load more"
 * pagination at 12 per page.
 *
 * (TH) ตารางสถานที่ท่องเที่ยวไทยจาก dataset `ATTRACTIONS` — มีฟิลเตอร์
 * ภูมิภาค, chip หมวด, ค้นหาแบบ free-text ครอบคลุมชื่ออังกฤษ/ไทย/จังหวัด
 * /คำอธิบาย/ประเภท และปุ่ม "Load more" ทีละ 12 รายการ
 */

"use client";

import * as React from "react";
import { ExternalLink, Landmark, Leaf, MapPin, Phone, Star, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ATTRACTIONS } from "@/lib/attractions-data";
import type { AttractionCategory } from "@/lib/types";

// How many attractions to reveal per "Load more" click.
// จำนวนรายการที่โผล่ต่อหนึ่งครั้งที่กด "Load more"
const PAGE_SIZE = 12;

/** Available region filters. The leading "All regions" disables the filter. */
/** (TH) ตัวเลือก region — ตัวแรก "All regions" คือไม่ฟิลเตอร์ */
const REGIONS = [
  "All regions",
  "Northern Thailand",
  "Northeastern Thailand",
  "Central Thailand",
  "Eastern Thailand",
  "Southern Thailand",
];

/** Category chip definitions ("all" = no filter). */
/** (TH) นิยาม chip หมวด ("all" = ไม่ฟิลเตอร์) */
const CATS: { value: AttractionCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "nature", label: "Nature" },
  { value: "culture", label: "Culture" },
  { value: "activity", label: "Activity" },
  { value: "agro", label: "Agro" },
];

/** Tailwind class per category for the badge in the card. */
/** (TH) class Tailwind ของ badge หมวดในการ์ด */
const CAT_COLORS: Record<string, string> = {
  nature: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  culture: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  activity: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  agro: "bg-lime-500/15 text-lime-600 dark:text-lime-400",
  other: "bg-secondary text-muted-foreground",
};

/** Lucide icon per category (no entry → no icon). */
/** (TH) ไอคอน lucide ของแต่ละหมวด */
const CAT_ICON: Record<string, React.ReactNode> = {
  nature: <Leaf className="h-3 w-3" />,
  culture: <Landmark className="h-3 w-3" />,
  activity: <Zap className="h-3 w-3" />,
};

/**
 * Render the attractions browser. Filters happen client-side; the
 * full dataset (~178 attractions) is small enough to keep in memory.
 *
 * (TH) แสดง browser สถานที่ — ฟิลเตอร์ฝั่ง client เพราะ dataset ทั้งหมด
 * ~178 รายการ พอใส่ในหน่วยความจำได้
 */
export function AttractionsSection() {
  // Filter + search state.
  // state ของฟิลเตอร์ + ค้นหา
  const [region, setRegion] = React.useState("All regions");
  const [cat, setCat] = React.useState<AttractionCategory | "all">("all");
  const [query, setQuery] = React.useState("");
  // Current page (multiplied by PAGE_SIZE to slice the visible window).
  // หน้าปัจจุบัน (คูณ PAGE_SIZE เพื่อ slice หน้าต่างที่โชว์)
  const [page, setPage] = React.useState(1);

  // Compute filtered list — memoized so we don't rescan on unrelated rerenders.
  // คำนวณรายการที่ฟิลเตอร์แล้ว — memo เพื่อไม่ rescan โดยไม่จำเป็น
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return ATTRACTIONS.filter((a) => {
      if (region !== "All regions" && a.region !== region) return false;
      if (cat !== "all" && a.category !== cat) return false;
      if (q) {
        // Match across EN name, TH name, province, description, type label.
        // จับคู่กับชื่อ EN, TH, จังหวัด, คำอธิบาย, ประเภท
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

  // Visible slice + whether there are more pages to load.
  // slice ที่โชว์ + flag ว่ามีเพิ่มไหม
  const shown = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = shown.length < filtered.length;

  // Reset paging whenever filters change so the user sees page 1 fresh.
  // รีเซ็ต paging ทุกครั้งที่ฟิลเตอร์เปลี่ยน เพื่อให้กลับไปหน้า 1
  React.useEffect(() => {
    setPage(1);
  }, [region, cat, query]);

  return (
    // Outer vertical container.
    // ตัวห่อแนวตั้ง
    <div className="space-y-4">
      {/* Heading row — title/subtitle on the left, search on the right. */}
      {/* แถวหัว — title/subtitle ซ้าย, ช่อง search ขวา */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Title block. */}
        {/* บล็อก title */}
        <div>
          {/* Section title. */}
          {/* ชื่อ section */}
          <h2 className="text-xl font-semibold tracking-tight">
            Thailand Attractions
          </h2>
          {/* Count caption. */}
          {/* คำว่า "{n} of {total}" */}
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {ATTRACTIONS.length} attractions
          </p>
        </div>
        {/* Search input. */}
        {/* input ค้นหา */}
        <input
          type="search"
          placeholder="Search attractions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 w-full rounded-2xl border border-input bg-background/50 px-3 text-sm sm:w-56"
        />
      </div>

      {/* Filter row — region select + category chips. */}
      {/* แถวฟิลเตอร์ — select region + chip หมวด */}
      <div className="flex flex-wrap gap-2">
        {/* Region dropdown. */}
        {/* dropdown region */}
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="h-8 rounded-xl border border-input bg-background/50 px-2 text-xs"
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {/* Category chip cluster. */}
        {/* กลุ่ม chip หมวด */}
        <div className="flex flex-wrap gap-1.5">
          {CATS.map((c) => (
            /* One category chip. */
            /* chip หมวดหนึ่งอัน */
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
        /* Empty state when filters return nothing. */
        /* state ว่างเมื่อฟิลเตอร์ไม่เจอ */
        <div className="rounded-3xl border border-dashed border-border/60 bg-card/50 py-12 text-center text-sm text-muted-foreground">
          No attractions match your filters.
        </div>
      ) : (
        /* Results grid (1 → 3 cols by breakpoint). */
        /* กริดผลลัพธ์ (1 → 3 คอลัมน์ตามจอ) */
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((a) => (
            /* One attraction card. */
            /* การ์ด attraction หนึ่งใบ */
            <div
              key={a.id}
              className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-xl transition-shadow hover:shadow-md"
            >
              {/* Top row — name (EN/TH) + category chip. */}
              {/* แถวบน — ชื่อ (EN/TH) + chip หมวด */}
              <div className="flex items-start justify-between gap-2">
                {/* Name cluster. */}
                {/* กลุ่มชื่อ */}
                <div className="min-w-0">
                  {/* English name (truncated). */}
                  {/* ชื่ออังกฤษ (ตัดท้าย) */}
                  <div className="truncate font-semibold leading-snug">{a.nameEn}</div>
                  {a.nameTh && a.nameTh !== a.nameEn && (
                    /* Thai name (only when different from EN). */
                    /* ชื่อไทย — แสดงเฉพาะเมื่อต่างจาก EN */
                    <div className="truncate text-xs text-muted-foreground">{a.nameTh}</div>
                  )}
                </div>
                {/* Category chip. */}
                {/* chip หมวด */}
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${CAT_COLORS[a.category] ?? CAT_COLORS.other}`}
                >
                  {CAT_ICON[a.category]} {a.category}
                </span>
              </div>

              {/* Location line — province · district · region. */}
              {/* บรรทัดที่ตั้ง */}
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                {/* Pin icon. */}
                {/* ไอคอนหมุด */}
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {a.province}
                  {a.district ? ` · ${a.district}` : ""}
                </span>
                {/* Region label, pushed to the right. */}
                {/* ป้าย region ชิดขวา */}
                <span className="ml-auto shrink-0">{a.region}</span>
              </div>

              {a.typeLabel && (
                /* Type label badge. */
                /* badge ประเภท */
                <Badge variant="secondary" className="w-fit text-[10px]">
                  {a.typeLabel}
                </Badge>
              )}

              {a.descriptionEn && (
                /* Description preview — 3-line clamp. */
                /* preview คำอธิบาย — clamp 3 บรรทัด */
                <p className="line-clamp-3 text-xs text-muted-foreground">
                  {a.descriptionEn}
                </p>
              )}

              {(a.phone || a.openHours || a.website) && (
                /* Footer — open hours / phone / website (any of three). */
                /* footer — เวลาเปิด / เบอร์ / เว็บไซต์ */
                <div className="mt-auto space-y-1 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                  {a.openHours && (
                    /* Open hours line. */
                    /* บรรทัดเวลาเปิด */
                    <div className="flex items-start gap-1">
                      <Star className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                      <span className="line-clamp-1">{a.openHours}</span>
                    </div>
                  )}
                  {a.phone && (
                    /* Phone line. */
                    /* บรรทัดเบอร์โทร */
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span className="truncate">{a.phone}</span>
                    </div>
                  )}
                  {a.website && (
                    /* Website link — opens in a new tab. */
                    /* ลิงก์เว็บไซต์ — เปิด tab ใหม่ */
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
        /* "Load more" button — only when there are remaining items. */
        /* ปุ่ม "Load more" — แสดงเฉพาะเมื่อยังมีรายการเหลือ */
        <div className="pt-2 text-center">
          <Button variant="glass" onClick={() => setPage((p) => p + 1)}>
            Load more ({filtered.length - shown.length} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
