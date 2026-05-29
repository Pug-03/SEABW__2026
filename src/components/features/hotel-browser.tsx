/**
 * @file `<HotelBrowser>` — paginated, filterable browse-all-hotels
 * view backed by the `/api/hotels` endpoint. Supports text search,
 * region/type/star/sort dropdowns, tag quick-filters, and a 12-per-
 * page grid. Clicking a card opens an in-page modal `<HotelDetail>`.
 *
 * (TH) browser ที่พักแบบจัดหน้า + ฟิลเตอร์ ดึงข้อมูลจาก `/api/hotels`
 * รองรับค้นหา, dropdown region/type/star/sort, quick-filter ตามแท็ก
 * และโชว์ทีละ 12 ต่อหน้า กดการ์ดเพื่อเปิด modal `<HotelDetail>` ในหน้าเดียวกัน
 */

"use client";

import * as React from "react";
import {
  Bath,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  Star,
  Wifi,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import type { Hotel } from "@/lib/types";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Shape of the `/api/hotels` response. */
/** (TH) โครงสร้าง response ของ `/api/hotels` */
interface ApiResponse {
  data: Hotel[];
  total: number;
  page: number;
  pages: number;
}

/** All filter values held in component state. Strings throughout — the
 *  API normalizes types. */
/** (TH) ค่าฟิลเตอร์ทั้งหมดเป็น string — API จะแปลง type เอง */
interface Filters {
  q: string;
  region: string;
  type: string;
  stars: string;
  tags: string;
  sort: string;
}

// Dropdown options (empty string = no filter).
// ตัวเลือก dropdown (ค่าว่าง = ไม่ฟิลเตอร์)
const REGIONS = [
  "",
  "Central Thailand",
  "Northern Thailand",
  "Northeastern Thailand",
  "Eastern Thailand",
  "Southern Thailand",
];
const TYPES = ["", "hotel", "resort", "villa", "boutique", "guesthouse", "hostel"];
const SORTS = [
  { v: "rating", label: "Top rated" },
  { v: "reviews", label: "Most reviewed" },
  { v: "price", label: "Lowest price" },
];

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * The hotel browser. Holds filters, draft search input, current page,
 * fetched data, and the currently selected hotel.
 *
 * (TH) browser หลัก — เก็บฟิลเตอร์, ค่า search draft, หน้าปัจจุบัน, ข้อมูลที่
 * fetch ได้ และโรงแรมที่ถูกเลือก
 */
export function HotelBrowser() {
  // Active applied filters (controls what gets fetched).
  // ฟิลเตอร์ที่ apply แล้ว (ใช้ fetch จริง)
  const [filters, setFilters] = React.useState<Filters>({
    q: "",
    region: "",
    type: "",
    stars: "",
    tags: "",
    sort: "rating",
  });
  // Draft search string — committed to filters on submit.
  // ค่าค้นหา draft — commit ลง filters ตอน submit
  const [draft, setDraft] = React.useState("");
  // Current page number (1-indexed).
  // หน้าปัจจุบัน (เริ่มที่ 1)
  const [page, setPage] = React.useState(1);
  // Last received API response.
  // ผลลัพธ์ API ล่าสุด
  const [data, setData] = React.useState<ApiResponse | null>(null);
  // Loading flag.
  // ธง loading
  const [loading, setLoading] = React.useState(false);
  // Hotel chosen for the detail modal.
  // โรงแรมที่ถูกเลือกเพื่อเปิด modal
  const [selected, setSelected] = React.useState<Hotel | null>(null);

  /**
   * Build the query string and fetch the page. Wrapped in `useCallback`
   * because the effect below depends on it.
   *
   * (TH) ประกอบ query string แล้ว fetch — ห่อด้วย useCallback เพราะ effect
   * ด้านล่าง depend ค่านี้
   */
  const fetchHotels = React.useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "12", sort: f.sort });
      if (f.q) params.set("q", f.q);
      if (f.region) params.set("region", f.region);
      if (f.type) params.set("type", f.type);
      if (f.stars) params.set("stars", f.stars);
      if (f.tags) params.set("tags", f.tags);
      const res = await fetch(`/api/hotels?${params}`);
      if (res.ok) setData((await res.json()) as ApiResponse);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch whenever filters or page change.
  // re-fetch ทุกครั้งที่ filters หรือ page เปลี่ยน
  React.useEffect(() => {
    fetchHotels(filters, page);
  }, [filters, page, fetchHotels]);

  /** Commit the draft search string into the applied filters. */
  /** (TH) commit ค่า draft ลง filters */
  const applySearch = () => {
    setFilters((f) => ({ ...f, q: draft }));
    setPage(1);
  };
  /** Set one filter key and reset to page 1. */
  /** (TH) ตั้งค่าฟิลเตอร์หนึ่งตัวและรีเซ็ตหน้าเป็น 1 */
  const setFilter = (key: keyof Filters, val: string) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };
  /** Clear the search field + filter together. */
  /** (TH) ล้างทั้งช่อง search และฟิลเตอร์พร้อมกัน */
  const clearSearch = () => {
    setDraft("");
    setFilters((f) => ({ ...f, q: "" }));
    setPage(1);
  };

  return (
    // Outer vertical container.
    // ตัวห่อแนวตั้ง
    <div className="space-y-4">
      {/* Header — title/count on left, search form on right. */}
      {/* header — title/จำนวนซ้าย, ฟอร์มค้นหาขวา */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Title block. */}
        {/* บล็อก title */}
        <div>
          {/* Section title. */}
          {/* ชื่อ section */}
          <h2 className="text-xl font-semibold tracking-tight">Thailand Accommodations</h2>
          {/* Sub-line — page/count info, or placeholder until first response. */}
          {/* คำอธิบาย — จำนวน/หน้าจาก response หรือ placeholder ก่อน fetch */}
          <p className="text-sm text-muted-foreground">
            {data
              ? `${data.total.toLocaleString()} places · page ${data.page} of ${data.pages}`
              : "10,000 places across Thailand"}
          </p>
        </div>
        {/* Search form. */}
        {/* ฟอร์มค้นหา */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applySearch();
          }}
          className="flex w-full items-center gap-2 sm:w-72"
        >
          {/* Input wrapper — relative for the icons inside. */}
          {/* ตัวห่อ input — relative สำหรับ icon ภายใน */}
          <div className="relative flex-1">
            {/* Leading magnifier icon. */}
            {/* ไอคอนแว่นขยาย */}
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            {/* The text input. */}
            {/* input ข้อความ */}
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search by name, city…"
              className="h-9 w-full rounded-xl border border-input bg-background/50 pl-8 pr-8 text-sm"
            />
            {draft && (
              /* Clear button — only when there's text. */
              /* ปุ่มล้าง — มีเฉพาะเมื่อมีข้อความ */
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {/* Submit (Go) button. */}
          {/* ปุ่ม Go */}
          <Button type="submit" size="sm" variant="accent">
            Go
          </Button>
        </form>
      </div>

      {/* Filter row — region / type / stars / sort + tag chips. */}
      {/* แถวฟิลเตอร์ — region / type / stars / sort + chip แท็ก */}
      <div className="flex flex-wrap gap-2">
        {/* Region dropdown. */}
        {/* dropdown region */}
        <select
          value={filters.region}
          onChange={(e) => setFilter("region", e.target.value)}
          className="h-8 rounded-xl border border-input bg-background/50 px-2 text-xs"
        >
          <option value="">All regions</option>
          {REGIONS.filter(Boolean).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {/* Type dropdown. */}
        {/* dropdown type */}
        <select
          value={filters.type}
          onChange={(e) => setFilter("type", e.target.value)}
          className="h-8 rounded-xl border border-input bg-background/50 px-2 text-xs"
        >
          <option value="">All types</option>
          {TYPES.filter(Boolean).map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
        {/* Stars dropdown. */}
        {/* dropdown ดาว */}
        <select
          value={filters.stars}
          onChange={(e) => setFilter("stars", e.target.value)}
          className="h-8 rounded-xl border border-input bg-background/50 px-2 text-xs"
        >
          <option value="">Any stars</option>
          {[5, 4, 3, 2, 1].map((s) => (
            <option key={s} value={String(s)}>
              {"★".repeat(s)}
            </option>
          ))}
        </select>
        {/* Sort dropdown. */}
        {/* dropdown sort */}
        <select
          value={filters.sort}
          onChange={(e) => setFilter("sort", e.target.value)}
          className="h-8 rounded-xl border border-input bg-background/50 px-2 text-xs"
        >
          {SORTS.map((s) => (
            <option key={s.v} value={s.v}>
              {s.label}
            </option>
          ))}
        </select>
        {/* Tag quick-filter chips — click toggles. */}
        {/* chip ฟิลเตอร์ตามแท็ก — คลิกสลับเปิด/ปิด */}
        {["beach", "mountain", "city", "island", "culture"].map((tag) => (
          <button
            key={tag}
            onClick={() => setFilter("tags", filters.tags === tag ? "" : tag)}
            className={cn(
              "h-8 rounded-xl border px-3 text-xs font-medium transition-colors",
              filters.tags === tag
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-card/50 text-muted-foreground hover:border-accent/50 hover:text-foreground"
            )}
          >
            {tag}
          </button>
        ))}
      </div>

      {loading ? (
        /* Loading spinner. */
        /* spinner */
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : data && data.data.length === 0 ? (
        /* Empty state — filters returned nothing. */
        /* state ว่าง — ฟิลเตอร์ไม่เจอ */
        <div className="rounded-3xl border border-dashed border-border/60 bg-card/50 py-12 text-center text-sm text-muted-foreground">
          No hotels match your filters.
        </div>
      ) : (
        /* Result grid (1 → 4 cols by breakpoint). */
        /* กริดผลลัพธ์ (1 → 4 คอลัมน์) */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data?.data.map((h) => (
            /* One hotel card; opens the detail modal on click. */
            /* การ์ดโรงแรมหนึ่งใบ; กดเพื่อเปิด detail modal */
            <HotelCard key={h.id} hotel={h} onClick={() => setSelected(h)} />
          ))}
        </div>
      )}

      {data && data.pages > 1 && (
        /* Pagination row — only when there are multiple pages. */
        /* แถว pagination — มีเฉพาะเมื่อมีมากกว่า 1 หน้า */
        <div className="flex items-center justify-center gap-3 pt-2">
          {/* Previous-page button. */}
          {/* ปุ่มหน้าก่อนหน้า */}
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {/* Current-page caption. */}
          {/* บอกหน้าปัจจุบัน */}
          <span className="text-sm text-muted-foreground">
            {page} / {data.pages}
          </span>
          {/* Next-page button. */}
          {/* ปุ่มหน้าถัดไป */}
          <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Detail modal overlay (only when a hotel is selected). */}
      {/* overlay modal รายละเอียด — เมื่อมีโรงแรมที่เลือก */}
      {selected && <HotelDetail hotel={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Hotel card ──────────────────────────────────────────────────────────────

/**
 * One hotel summary card in the grid. The whole card is one
 * `<button>` that fires `onClick` to open the detail modal.
 *
 * (TH) การ์ดสรุปโรงแรมหนึ่งใบใน grid — ทั้งการ์ดเป็นปุ่มที่กดเปิด modal
 */
function HotelCard({ hotel: h, onClick }: { hotel: Hotel; onClick: () => void }) {
  return (
    // Card button wrapper.
    // ตัวห่อปุ่ม
    <button
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/70 text-left transition-shadow hover:shadow-lg"
    >
      {/* Image area with type and rating chips. */}
      {/* ส่วนรูปพร้อม chip ประเภทและคะแนน */}
      <div className="relative h-36 w-full overflow-hidden">
        {/* Hotel photo. */}
        {/* รูปโรงแรม */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={h.imageUrl}
          alt={h.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Top-left: type label chip. */}
        {/* มุมซ้ายบน: chip ประเภท */}
        <div className="absolute left-2 top-2">
          <span className="rounded-lg bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white capitalize">
            {h.type}
          </span>
        </div>
        {/* Top-right: star rating chip. */}
        {/* มุมขวาบน: chip คะแนน */}
        <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded-lg bg-black/55 px-1.5 py-0.5 text-xs text-white">
          {/* Star icon. */}
          {/* ไอคอนดาว */}
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {h.rating}
        </div>
      </div>
      {/* Body. */}
      {/* body */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {/* Name (line-clamp 1). */}
        {/* ชื่อ (clamp 1 บรรทัด) */}
        <div className="line-clamp-1 text-sm font-semibold">{h.name}</div>
        {/* Location line. */}
        {/* บรรทัดที่ตั้ง */}
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {h.district}, {h.province}
          </span>
        </div>
        {/* Star row. */}
        {/* แถวดาว */}
        <StarRow stars={h.stars} />
        {/* Price range. */}
        {/* ช่วงราคา */}
        <div className="text-xs font-medium text-accent">
          {formatCurrency(h.priceMin)} – {formatCurrency(h.priceMax)}
          <span className="font-normal text-muted-foreground"> / night</span>
        </div>
        {/* Amenity chips (first 3). */}
        {/* chip amenities (3 อันแรก) */}
        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          {h.amenities.slice(0, 3).map((a) => (
            <span
              key={a}
              className="rounded-lg bg-secondary/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {a}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

/**
 * Render a 5-star row, filling stars up to the given count.
 *
 * (TH) แสดงดาว 5 ดวง ไล่เติมตามจำนวนที่กำหนด
 */
function StarRow({ stars }: { stars: number }) {
  return (
    // Star row container.
    // แถวดาว
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        /* One star — filled if i < stars. */
        /* ดาวหนึ่งดวง — เติมถ้า i < stars */
        <Star
          key={i}
          className={cn("h-3 w-3", i < stars ? "fill-amber-400 text-amber-400" : "text-border")}
        />
      ))}
    </div>
  );
}

// ─── Hotel detail panel ──────────────────────────────────────────────────────

/**
 * Modal-style detail panel that overlays the page when a hotel is
 * clicked. Click outside (on the dim backdrop) or the X button to close.
 *
 * (TH) panel รายละเอียดที่ทำตัวเป็น modal — คลิกพื้นมืดข้างนอกหรือกด X
 * เพื่อปิด
 */
function HotelDetail({ hotel: h, onClose }: { hotel: Hotel; onClose: () => void }) {
  return (
    // Fullscreen backdrop — click closes; inner panel stops propagation.
    // backdrop เต็มจอ — คลิกปิด, panel ภายในกัน propagation
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onClose}>
      {/* Modal panel — taps inside don't bubble to the backdrop. */}
      {/* panel modal — กด event ภายในไม่ทะลุไป backdrop */}
      <div
        className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border/60 bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero image with close button + bottom overlay text. */}
        {/* รูปหลักพร้อมปุ่มปิด + ข้อความ overlay ล่าง */}
        <div className="relative h-52 w-full overflow-hidden rounded-t-3xl">
          {/* Hero image. */}
          {/* รูปหลัก */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={h.imageUrl} alt={h.name} className="h-full w-full object-cover" />
          {/* Close (X) button. */}
          {/* ปุ่มปิด */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <X className="h-4 w-4" />
          </button>
          {/* Overlay text container. */}
          {/* container ข้อความ overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            {/* Overlay row — left text cluster + right stars/rating. */}
            {/* แถว overlay — ฝั่งซ้ายข้อความ, ฝั่งขวาดาว/คะแนน */}
            <div className="flex items-end justify-between">
              {/* Left cluster — type chip + name + address. */}
              {/* กลุ่มซ้าย — chip ประเภท + ชื่อ + ที่อยู่ */}
              <div>
                {/* Type chip. */}
                {/* chip ประเภท */}
                <Badge variant="secondary" className="mb-1 capitalize">
                  {h.type}
                </Badge>
                {/* Hotel name. */}
                {/* ชื่อโรงแรม */}
                <h3 className="text-lg font-semibold text-white">{h.name}</h3>
                {/* Address line. */}
                {/* บรรทัดที่อยู่ */}
                <div className="flex items-center gap-1 text-xs text-white/80">
                  <MapPin className="h-3 w-3" /> {h.address}
                </div>
              </div>
              {/* Right cluster — stars + rating. */}
              {/* กลุ่มขวา — ดาว + คะแนน */}
              <div className="text-right text-white">
                <StarRow stars={h.stars} />
                {/* Rating with review count. */}
                {/* คะแนน + จำนวนรีวิว */}
                <div className="mt-0.5 flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {h.rating} ({h.reviewCount.toLocaleString()} reviews)
                </div>
              </div>
            </div>
          </div>
        </div>

        {h.gallery.length > 0 && (
          /* Horizontal gallery strip. */
          /* แถบ gallery แนวนอน */
          <div className="flex gap-2 overflow-x-auto p-3 pb-0">
            {h.gallery.map((url, i) => (
              /* One thumbnail in the gallery. */
              /* thumbnail หนึ่งใบใน gallery */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt=""
                loading="lazy"
                className="h-16 w-24 shrink-0 rounded-xl object-cover"
              />
            ))}
          </div>
        )}

        {/* Detail body. */}
        {/* body รายละเอียด */}
        <div className="space-y-4 p-4">
          {/* Four-up info grid — price / check-in / check-out / service hours. */}
          {/* กริดสรุป 4 ค่า — ราคา / check-in / check-out / service hours */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoBox label="Price / night" value={`฿${h.priceMin.toLocaleString()} – ฿${h.priceMax.toLocaleString()}`} />
            <InfoBox label="Check-in" value={h.checkIn} icon={<BedDouble className="h-3.5 w-3.5" />} />
            <InfoBox label="Check-out" value={h.checkOut} icon={<Bath className="h-3.5 w-3.5" />} />
            <InfoBox label="Service hours" value={h.serviceHours} />
          </div>

          {/* Amenities section. */}
          {/* section amenities */}
          <div>
            {/* Section caption. */}
            {/* คำว่า Amenities */}
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Amenities</div>
            {/* Amenities chip wrap. */}
            {/* แถว chip amenities */}
            <div className="flex flex-wrap gap-1.5">
              {h.amenities.map((a) => (
                /* One amenity chip. */
                /* chip amenity หนึ่งอัน */
                <span
                  key={a}
                  className="flex items-center gap-1 rounded-xl border border-border/60 bg-secondary/40 px-2.5 py-1 text-xs"
                >
                  <Wifi className="h-3 w-3 text-accent" /> {a}
                </span>
              ))}
            </div>
          </div>

          {/* Contact info card. */}
          {/* การ์ดข้อมูลติดต่อ */}
          <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3">
            {/* Section caption. */}
            {/* คำว่า Contact */}
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Contact</div>
            {/* Contact lines. */}
            {/* รายการติดต่อ */}
            <div className="space-y-1.5 text-sm">
              {/* Phone tap-to-call. */}
              {/* tap-to-call เบอร์ */}
              <a href={`tel:${h.phone}`} className="flex items-center gap-2 hover:text-accent">
                <Phone className="h-4 w-4 text-muted-foreground" /> {h.phone}
              </a>
              {/* Mailto. */}
              {/* mailto */}
              <a href={`mailto:${h.email}`} className="flex items-center gap-2 hover:text-accent">
                <Mail className="h-4 w-4 text-muted-foreground" /> {h.email}
              </a>
              {/* Address line. */}
              {/* บรรทัดที่อยู่ */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" /> {h.address}
              </div>
            </div>
          </div>

          {/* Action buttons — Map + Book. */}
          {/* ปุ่ม action — Map + Book */}
          <div className="flex gap-3">
            {/* Map button — Google Maps search. */}
            {/* ปุ่ม Map — ค้นหา Google Maps */}
            <Button variant="glass" className="flex-1" asChild>
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(h.name + " " + h.province)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin className="h-4 w-4" /> View on Map
              </a>
            </Button>
            {/* Book button — Booking.com search. */}
            {/* ปุ่ม Book — ค้นหา Booking.com */}
            <Button variant="accent" className="flex-1" asChild>
              <a
                href={`https://www.booking.com/search.html?ss=${encodeURIComponent(h.name)}`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="h-4 w-4" /> Book Now
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Small info box for the four-up summary row above amenities.
 *
 * (TH) กล่องสรุปขนาดเล็กใน 4-up summary เหนือ amenities
 */
function InfoBox({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    // Card wrapper.
    // ตัวห่อการ์ด
    <div className="rounded-2xl border border-border/60 bg-secondary/30 p-2.5 text-center">
      {/* Label. */}
      {/* label */}
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      {/* Value line with optional icon. */}
      {/* บรรทัดค่า พร้อม icon (ถ้ามี) */}
      <div className="mt-0.5 flex items-center justify-center gap-1 text-sm font-semibold">
        {icon}
        {value}
      </div>
    </div>
  );
}
