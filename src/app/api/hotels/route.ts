/**
 * @file `GET /api/hotels` — paginated hotel catalog endpoint.
 *
 * Reads `src/data/hotels.json` once per process and serves filtered
 * paginated results. Supports `q`, `region`, `type`, `stars`, `tags`,
 * `minPrice`, `maxPrice`, `sort`, `page`, `limit` query params.
 *
 * (TH) endpoint `GET /api/hotels` — แสดงรายการโรงแรมแบบจัดหน้า
 * อ่านไฟล์ `src/data/hotels.json` ครั้งเดียวต่ออายุ process แล้วเสิร์ฟตามเงื่อนไข
 * รองรับ query: q, region, type, stars, tags, minPrice, maxPrice, sort,
 * page, limit
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { Hotel } from "@/lib/types";

// Force Node runtime (we need fs) and disable static caching so each
// request re-reads query params.
// บังคับ Node runtime (ต้องใช้ fs) และปิด static cache ให้ query
// param ใช้งานได้ทุกครั้ง
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Module-level cache so we don't re-parse JSON on every request.
// cache ระดับ module เพื่อไม่ parse JSON ใหม่ทุกคำขอ
let _cache: Hotel[] | null = null;

/**
 * Load the hotels dataset (cached per process). Reads from
 * `src/data/hotels.json` synchronously — fine because it's a one-shot
 * boot cost and the file isn't huge.
 *
 * (TH) โหลด dataset โรงแรม (cache ต่อ process) — อ่านแบบ sync เพราะเป็น
 * cost ตอน boot ครั้งเดียวและไฟล์ไม่ใหญ่
 */
function getHotels(): Hotel[] {
  if (!_cache) {
    const file = path.join(process.cwd(), "src", "data", "hotels.json");
    _cache = JSON.parse(fs.readFileSync(file, "utf-8")) as Hotel[];
  }
  return _cache;
}

/**
 * GET handler. Parses every supported query parameter, applies them in
 * order (region → type → stars → tags → price → text search), sorts,
 * paginates, and returns `{ data, total, page, pages, limit }`.
 *
 * (TH) handler GET — parse query ทุกตัว แล้วกรองตามลำดับ (region → type
 * → stars → tags → price → text) จากนั้น sort, paginate, ส่งกลับ
 * `{ data, total, page, pages, limit }`
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  // Parse and clamp paging params.
  // parse + clamp ค่า page/limit
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  // Filter params (empty string = no filter for that field).
  // param ฟิลเตอร์ (ค่าว่าง = ไม่ฟิลเตอร์)
  const region = searchParams.get("region") ?? "";
  const type = searchParams.get("type") ?? "";
  const starsQ = searchParams.get("stars") ?? "";
  const tags = searchParams.get("tags") ?? "";
  const q = (searchParams.get("q") ?? "").toLowerCase().trim();
  const minP = Number(searchParams.get("minPrice") ?? "0");
  const maxP = Number(searchParams.get("maxPrice") ?? "999999");
  const sortBy = searchParams.get("sort") ?? "rating";

  // Start with the full cached dataset.
  // เริ่มจาก dataset เต็มที่ cache ไว้
  let hotels = getHotels();

  // Apply each filter conditionally.
  // ใส่ฟิลเตอร์ทีละชั้นแบบ conditional
  if (region) hotels = hotels.filter((h) => h.region === region);
  if (type) hotels = hotels.filter((h) => h.type === type);
  if (starsQ) hotels = hotels.filter((h) => h.stars === Number(starsQ));
  // Tags is comma-separated — any-match wins (OR semantics).
  // tags คั่นด้วย comma — ตรงตัวใดตัวหนึ่งก็ผ่าน (OR)
  if (tags) hotels = hotels.filter((h) => tags.split(",").some((t) => h.tags.includes(t)));
  if (minP > 0) hotels = hotels.filter((h) => h.priceMax >= minP);
  if (maxP < 999999) hotels = hotels.filter((h) => h.priceMin <= maxP);
  if (q) {
    // Text search across name/province/district/region/type/amenities.
    // ค้นหาข้อความครอบคลุม name/province/district/region/type/amenities
    hotels = hotels.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.province.toLowerCase().includes(q) ||
        h.district.toLowerCase().includes(q) ||
        h.region.toLowerCase().includes(q) ||
        h.type.toLowerCase().includes(q) ||
        h.amenities.some((a) => a.toLowerCase().includes(q))
    );
  }

  // Sort by chosen field (rating is default).
  // sort ตาม field ที่เลือก (default = rating)
  if (sortBy === "price") hotels = [...hotels].sort((a, b) => a.priceMin - b.priceMin);
  else if (sortBy === "reviews") hotels = [...hotels].sort((a, b) => b.reviewCount - a.reviewCount);
  else hotels = [...hotels].sort((a, b) => b.rating - a.rating);

  // Compute pagination window.
  // คำนวณหน้าต่าง pagination
  const total = hotels.length;
  const pages = Math.ceil(total / limit);
  const data = hotels.slice((page - 1) * limit, page * limit);

  return NextResponse.json({ data, total, page, pages, limit });
}
