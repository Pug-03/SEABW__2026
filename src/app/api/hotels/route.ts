import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { Hotel } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Module-level cache — file is read once per server lifetime
let _cache: Hotel[] | null = null;
function getHotels(): Hotel[] {
  if (!_cache) {
    const file = path.join(process.cwd(), "src", "data", "hotels.json");
    _cache = JSON.parse(fs.readFileSync(file, "utf-8")) as Hotel[];
  }
  return _cache;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page    = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit   = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  const region  = searchParams.get("region") ?? "";
  const type    = searchParams.get("type") ?? "";
  const starsQ  = searchParams.get("stars") ?? "";
  const tags    = searchParams.get("tags") ?? "";
  const q       = (searchParams.get("q") ?? "").toLowerCase().trim();
  const minP    = Number(searchParams.get("minPrice") ?? "0");
  const maxP    = Number(searchParams.get("maxPrice") ?? "999999");
  const sortBy  = searchParams.get("sort") ?? "rating"; // rating | price | reviews

  let hotels = getHotels();

  if (region)   hotels = hotels.filter((h) => h.region === region);
  if (type)     hotels = hotels.filter((h) => h.type === type);
  if (starsQ)   hotels = hotels.filter((h) => h.stars === Number(starsQ));
  if (tags)     hotels = hotels.filter((h) => tags.split(",").some((t) => h.tags.includes(t)));
  if (minP > 0) hotels = hotels.filter((h) => h.priceMax >= minP);
  if (maxP < 999999) hotels = hotels.filter((h) => h.priceMin <= maxP);
  if (q) {
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

  if (sortBy === "price")   hotels = [...hotels].sort((a, b) => a.priceMin - b.priceMin);
  else if (sortBy === "reviews") hotels = [...hotels].sort((a, b) => b.reviewCount - a.reviewCount);
  else hotels = [...hotels].sort((a, b) => b.rating - a.rating);

  const total = hotels.length;
  const pages = Math.ceil(total / limit);
  const data  = hotels.slice((page - 1) * limit, page * limit);

  return NextResponse.json({ data, total, page, pages, limit });
}
