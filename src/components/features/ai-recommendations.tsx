/**
 * @file `<AIRecommendationsCard>` — fetches a ranked list of hotels
 * from `/api/ai/recommendations` and renders the top 3 as cards. Each
 * card opens a `<QuickDetail>` panel below the grid when clicked.
 * Source can be Claude AI or an algorithmic fallback.
 *
 * (TH) คอมโพเนนต์ดึงรายการโรงแรมที่แนะนำจาก `/api/ai/recommendations`
 * แสดงเป็นการ์ด 3 อันด้านบนสุด แต่ละการ์ดกดเพื่อโชว์ panel รายละเอียด
 * ด้านล่าง แหล่งที่มาอาจเป็น Claude หรือ algorithm fallback
 */

"use client";

import * as React from "react";
import {
  BedDouble,
  ExternalLink,
  Info,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Sparkles,
  Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Destination, GeoCoords, Hotel, Preference } from "@/lib/types";
import type { HotelRec } from "@/app/api/ai/recommendations/route";

/**
 * Props for `<AIRecommendationsCard>`. The card includes user
 * context (nickname, home address, location) so the recommender can
 * personalize the picks.
 *
 * (TH) Props — รวมข้อมูล context ของผู้ใช้ (nickname, ที่อยู่, ตำแหน่ง)
 * เพื่อให้ระบบแนะนำปรับให้เหมาะกับผู้ใช้
 */
interface AIRecProps {
  destination: Destination;
  preferences: Preference[];
  remainingBudget: number;
  origin?: GeoCoords | null;
  nickname?: string;
  homeAddress?: string;
}

/**
 * Main recommendation card. Fetches on mount and whenever any input
 * changes; the refresh icon button retriggers the same fetch.
 *
 * (TH) การ์ดหลัก — fetch ตอน mount และเมื่อ input เปลี่ยน ปุ่ม refresh
 * เรียก fetch อีกครั้งด้วย input เดิม
 */
export function AIRecommendationsCard({
  destination,
  preferences,
  remainingBudget,
  origin,
  nickname,
  homeAddress,
}: AIRecProps) {
  // Fetched recommendations + their source.
  // คำแนะนำที่ดึงมา + แหล่งที่มา
  const [recs, setRecs] = React.useState<HotelRec[] | null>(null);
  const [source, setSource] = React.useState<"anthropic" | "algorithmic" | null>(null);
  // Loading flag and currently selected hotel (for QuickDetail).
  // ธง loading และโรงแรมที่เลือก (สำหรับโชว์ QuickDetail)
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<Hotel | null>(null);

  /**
   * Re-fetch recommendations based on the latest props. Wrapped in
   * `useCallback` so the effect below has a stable dep.
   *
   * (TH) ดึงคำแนะนำใหม่ตามค่า props ล่าสุด — ห่อด้วย useCallback เพื่อให้
   * effect ด้านล่าง dep เสถียร
   */
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/recommendations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          preferences,
          location: origin ?? undefined,
          budget: remainingBudget > 0 ? remainingBudget : undefined,
          nickname,
          homeAddress,
          // Coarse region hint helps the recommender bias coastal vs inland.
          // ใบ้ region แบบกว้าง ๆ ช่วยให้แนะนำชายฝั่ง vs ในแผ่นดินถูกต้อง
          region: preferences.some((p) => ["beach", "island"].includes(p))
            ? "Southern Thailand"
            : undefined,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          recommendations: HotelRec[];
          source: "anthropic" | "algorithmic";
        };
        setRecs(data.recommendations);
        setSource(data.source);
      }
    } finally {
      setLoading(false);
    }
  }, [preferences, origin, remainingBudget, nickname, homeAddress]);

  // Fire on mount and whenever any input changes.
  // เรียกตอน mount และทุกครั้งที่ input เปลี่ยน
  React.useEffect(() => {
    load();
  }, [load]);

  return (
    // Outer vertical wrapper.
    // wrapper แนวตั้งภายนอก
    <div className="space-y-3">
      {/* Header — heading on the left, source badge + refresh on the right. */}
      {/* หัว — heading ซ้าย, source badge + refresh ขวา */}
      <div className="flex items-center justify-between">
        {/* Section heading. */}
        {/* หัวเรื่อง */}
        <h4 className="text-sm font-semibold tracking-tight">
          Stays picked for you
        </h4>
        {/* Right cluster — source badge + refresh icon button. */}
        {/* กลุ่มขวา — badge แหล่ง + ปุ่ม refresh */}
        <div className="flex items-center gap-2">
          {/* Source badge — "Claude AI" vs "Smart Pick". */}
          {/* badge แหล่งที่มา — Claude AI หรือ Smart Pick */}
          <Badge variant={source === "anthropic" ? "ai" : "secondary"}>
            {source === "anthropic" ? (
              <>
                <Sparkles className="h-3 w-3" /> Claude AI
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" /> Smart Pick
              </>
            )}
          </Badge>
          {/* Refresh icon — spins while loading. */}
          {/* ไอคอน refresh — หมุนระหว่าง loading */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={load}
            disabled={loading}
            aria-label="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {loading && !recs ? (
        /* Loading state — only shown until the first batch arrives. */
        /* state loading — แสดงเฉพาะก่อนได้ผลลัพธ์ครั้งแรก */
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          {/* Spinner. */}
          {/* spinner */}
          <Loader2 className="h-4 w-4 animate-spin" /> Finding best stays for you…
        </div>
      ) : (
        /* Result grid — top 3 cards. */
        /* กริดผลลัพธ์ — 3 การ์ดบนสุด */
        <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(recs ?? []).slice(0, 3).map(({ hotel, reason }, idx) => (
            /* One recommendation card. */
            /* การ์ดคำแนะนำหนึ่งใบ */
            <RecCard
              key={hotel.id}
              hotel={hotel}
              reason={reason}
              featured={idx === 0}
              budget={remainingBudget}
              onOpen={() => setSelected(hotel)}
            />
          ))}
        </div>
      )}

      {selected && (
        /* Quick detail panel — only when a card is clicked. */
        /* panel รายละเอียด — แสดงเฉพาะเมื่อกดการ์ด */
        <QuickDetail hotel={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

// ─── Rec card ────────────────────────────────────────────────────────────────

/**
 * One hotel recommendation card. The "featured" prop highlights the
 * top result with a "Best match" badge.
 *
 * (TH) การ์ดคำแนะนำหนึ่งใบ — `featured` ทำให้การ์ดอันดับ 1 มี badge "Best match"
 */
function RecCard({
  hotel: h,
  reason,
  featured,
  budget,
  onOpen,
}: {
  hotel: Hotel;
  reason: string;
  featured: boolean;
  budget: number;
  onOpen: () => void;
}) {
  // Whether this hotel exceeds the remaining budget.
  // โรงแรมนี้เกินงบที่เหลือหรือไม่
  const overBudget = budget > 0 && h.priceMin > budget;
  return (
    // Card acting as a button (role + tabIndex + keyDown).
    // card ที่ทำตัวเป็นปุ่ม (role/tabIndex/keyDown)
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group flex h-full cursor-pointer flex-col overflow-hidden outline-none transition-shadow hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Header image area with overlay badges. */}
      {/* ส่วนรูปด้านบนพร้อม badge overlay */}
      <div className="relative h-32 w-full overflow-hidden">
        {/* Hotel photo. */}
        {/* รูปโรงแรม */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={h.imageUrl}
          alt={h.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Top-left badge cluster. */}
        {/* กลุ่ม badge มุมซ้ายบน */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {featured && (
            /* "Best match" badge for the top result. */
            /* badge "Best match" สำหรับผลอันดับ 1 */
            <Badge variant="ai">
              <Sparkles className="h-3 w-3" /> Best match
            </Badge>
          )}
          {overBudget && (
            /* "Over budget" warning. */
            /* badge เตือนเกินงบ */
            <Badge variant="warning">Over budget</Badge>
          )}
        </div>
        {/* Top-right star rating chip. */}
        {/* ดาวคะแนนมุมขวาบน */}
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-xs text-white">
          {/* Filled star icon. */}
          {/* ไอคอนดาวที่เติม */}
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {h.rating}
        </div>
      </div>
      {/* Card body content. */}
      {/* body ของการ์ด */}
      <CardContent className="flex flex-1 flex-col p-3">
        {/* Top of body — name/location/price on the left, icon on the right. */}
        {/* ส่วนบนของ body — ชื่อ/ที่ตั้ง/ราคาซ้าย, ไอคอนขวา */}
        <div className="flex items-start justify-between gap-2">
          {/* Text cluster. */}
          {/* กลุ่มข้อความ */}
          <div className="min-w-0">
            {/* Hotel name (truncated if long). */}
            {/* ชื่อโรงแรม (ตัดท้ายถ้ายาว) */}
            <div className="truncate text-sm font-semibold">{h.name}</div>
            {/* Location line — pin + district/province. */}
            {/* บรรทัดที่ตั้ง — pin + อำเภอ/จังหวัด */}
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              {/* Pin icon. */}
              {/* ไอคอนหมุด */}
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {h.district}, {h.province}
              </span>
            </div>
            {/* Price range. */}
            {/* ช่วงราคา */}
            <div className="text-xs text-accent font-medium">
              {formatCurrency(h.priceMin)} – {formatCurrency(h.priceMax)}/night
            </div>
          </div>
          {/* Bed icon (decorative). */}
          {/* ไอคอนเตียง (ตกแต่ง) */}
          <BedDouble className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
        {/* "Why we picked this" reason. */}
        {/* เหตุผลที่เลือกแนะนำ */}
        <p className="mt-2 line-clamp-2 min-h-8 text-[11px] leading-4 text-muted-foreground">
          {reason}
        </p>
        {/* Action buttons row — Details + Book (stops click bubbling). */}
        {/* แถวปุ่ม — Details + Book (กัน event bubbling ไปการ์ด) */}
        <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
          {/* Details button — same effect as clicking the card. */}
          {/* ปุ่ม Details — เทียบเท่าการคลิกการ์ด */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-full"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            <Info className="h-3.5 w-3.5" /> Details
          </Button>
          {/* Book button — opens Booking.com search in a new tab. */}
          {/* ปุ่ม Book — เปิด Booking.com ใน tab ใหม่ */}
          <Button
            variant="accent"
            size="sm"
            className="h-9 w-full"
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <a
              href={`https://www.booking.com/search.html?ss=${encodeURIComponent(h.name)}`}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Book
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Quick detail panel ──────────────────────────────────────────────────────

/**
 * Expanded detail panel shown below the grid when a card is clicked.
 * Shows full address, key facts, amenities, contact info, and map/book
 * deep links.
 *
 * (TH) panel รายละเอียดด้านล่างกริด เมื่อกดการ์ด — โชว์ที่อยู่เต็ม, ข้อมูล
 * สำคัญ, amenities, การติดต่อ, และลิงก์ map/booking
 */
function QuickDetail({ hotel: h, onClose }: { hotel: Hotel; onClose: () => void }) {
  return (
    // Card panel.
    // panel
    <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4 space-y-3">
      {/* Header row — name + address + close button. */}
      {/* แถวหัว — ชื่อ + ที่อยู่ + ปุ่มปิด */}
      <div className="flex items-start justify-between gap-3">
        {/* Identity cluster. */}
        {/* กลุ่มชื่อ + ที่อยู่ */}
        <div>
          {/* Hotel name. */}
          {/* ชื่อโรงแรม */}
          <div className="font-semibold">{h.name}</div>
          {/* Full address. */}
          {/* ที่อยู่เต็ม */}
          <div className="text-xs text-muted-foreground">{h.address}</div>
        </div>
        {/* Close button. */}
        {/* ปุ่ม Close */}
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
      {/* Key facts mini-grid: stars / price / check-in / check-out. */}
      {/* mini-grid ข้อมูลสำคัญ */}
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        {/* Stars fact. */}
        {/* ข้อมูลดาว */}
        <div className="rounded-xl bg-secondary/50 p-2 text-center">
          <div className="text-muted-foreground">Stars</div>
          <div className="font-medium">{"★".repeat(h.stars)}</div>
        </div>
        {/* Price range fact. */}
        {/* ช่วงราคา */}
        <div className="rounded-xl bg-secondary/50 p-2 text-center">
          <div className="text-muted-foreground">Price / night</div>
          <div className="font-medium">
            ฿{h.priceMin.toLocaleString()} – ฿{h.priceMax.toLocaleString()}
          </div>
        </div>
        {/* Check-in fact. */}
        {/* check-in */}
        <div className="rounded-xl bg-secondary/50 p-2 text-center">
          <div className="text-muted-foreground">Check-in</div>
          <div className="font-medium">{h.checkIn}</div>
        </div>
        {/* Check-out fact. */}
        {/* check-out */}
        <div className="rounded-xl bg-secondary/50 p-2 text-center">
          <div className="text-muted-foreground">Check-out</div>
          <div className="font-medium">{h.checkOut}</div>
        </div>
      </div>
      {/* Amenity chips (first 6). */}
      {/* chip amenities (6 อันแรก) */}
      <div className="flex flex-wrap gap-1.5">
        {h.amenities.slice(0, 6).map((a) => (
          <span
            key={a}
            className="rounded-lg border border-border/60 bg-background/50 px-2 py-0.5 text-[11px]"
          >
            {a}
          </span>
        ))}
      </div>
      {/* Phone + email links. */}
      {/* ลิงก์โทรศัพท์ + อีเมล */}
      <div className="space-y-1 text-sm">
        {/* Tel link. */}
        {/* ลิงก์โทรศัพท์ */}
        <a
          href={`tel:${h.phone}`}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Phone className="h-3.5 w-3.5" /> {h.phone}
        </a>
        {/* Mailto link. */}
        {/* ลิงก์อีเมล */}
        <a
          href={`mailto:${h.email}`}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Mail className="h-3.5 w-3.5" /> {h.email}
        </a>
      </div>
      {/* Action buttons row — Map and Booking. */}
      {/* แถวปุ่ม — Map และ Booking */}
      <div className="flex gap-2">
        {/* Map button — Google Maps search. */}
        {/* ปุ่ม Map — ค้นหาใน Google Maps */}
        <Button variant="glass" size="sm" className="flex-1" asChild>
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(h.name + " " + h.province)}`}
            target="_blank"
            rel="noreferrer"
          >
            <MapPin className="h-4 w-4" /> Map
          </a>
        </Button>
        {/* Booking.com button. */}
        {/* ปุ่ม Booking.com */}
        <Button variant="accent" size="sm" className="flex-1" asChild>
          <a
            href={`https://www.booking.com/search.html?ss=${encodeURIComponent(h.name)}`}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="h-4 w-4" /> Book on Booking.com
          </a>
        </Button>
      </div>
    </div>
  );
}
