/**
 * @file `POST /api/ai/recommendations` — hotel recommender endpoint.
 *
 * Two-stage selection:
 *   1. Algorithmic pre-rank — scores every hotel by rating + preference
 *      match + budget fit + distance from origin + popularity. Returns
 *      the top 30 candidates.
 *   2. Claude AI re-rank — sends the 30 candidates to Claude with the
 *      traveler profile, asks for the best 5 with a 1-sentence reason
 *      per pick. If Claude isn't available (no env key or any
 *      network/parse failure), the response source switches to
 *      "algorithmic" and the top 5 of stage 1 are returned.
 *
 * (TH) endpoint แนะนำโรงแรม ทำงานสองชั้น:
 *   1. ให้คะแนนเอง (ตาม rating + ตรง preference + งบ + ระยะ + รีวิว)
 *      คืน top 30
 *   2. ส่ง 30 ตัวให้ Claude เลือก 5 พร้อมเหตุผล 1 ประโยค ถ้าใช้ AI ไม่ได้
 *      จะ fallback ใช้ algorithmic top 5
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { Hotel } from "@/lib/types";

// Node runtime + dynamic so the endpoint always runs fresh.
// Node runtime + dynamic เพื่อให้รัน fresh เสมอ
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Earth radius used by the haversine distance helper.
// รัศมีโลกใช้ใน haversine
const EARTH_RADIUS_KM = 6371;

// Cached hotels (same pattern as the catalog endpoint).
// cache hotels (pattern เดียวกับ endpoint ของ catalog)
let _cache: Hotel[] | null = null;
function getHotels(): Hotel[] {
  if (!_cache) {
    const file = path.join(process.cwd(), "src", "data", "hotels.json");
    _cache = JSON.parse(fs.readFileSync(file, "utf-8")) as Hotel[];
  }
  return _cache;
}

/**
 * Shape of the incoming JSON body.
 *
 * (TH) โครงสร้าง JSON body ที่รับเข้า
 */
interface ReqBody {
  preferences: string[];
  location?: { lat: number; lng: number };
  budget?: number;
  nickname?: string;
  homeAddress?: string;
  region?: string;
}

/**
 * Result shape for one recommendation. Exported so the frontend can
 * import the type directly.
 *
 * (TH) โครงสร้างผลลัพธ์ 1 รายการ — export เพื่อให้ frontend ใช้ type ตรง ๆ
 */
export interface HotelRec {
  hotel: Hotel;
  reason: string;
  score: number;
}

/**
 * Great-circle distance in km. Inlined here (instead of imported
 * from `lib/utils`) because this file is a Node-runtime route and
 * we want it standalone.
 *
 * (TH) คำนวณระยะ great-circle เป็น km — เขียนตรงนี้แทน import ดูจาก
 * lib/utils เพื่อให้ route เป็นอิสระ
 */
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/**
 * Stage 1: deterministic scoring + rank. Combines rating, preference
 * tag matches, budget fit, distance from origin, and review-count
 * popularity into a single score, then builds a short reason string
 * from the same signals.
 *
 * (TH) ขั้น 1: ให้คะแนนตามสูตรคงที่ — รวม rating, ตรง preference, งบ,
 * ระยะ, ความนิยม (รีวิว) แล้วสร้างเหตุผลสั้น ๆ จาก signal เดียวกัน
 */
function algorithmicRec(hotels: Hotel[], body: ReqBody, n = 10): HotelRec[] {
  const scored = hotels.map((h) => {
    // Base score from rating (0..50).
    // คะแนนฐานจาก rating (0..50)
    let score = h.rating * 10;
    // +20 per matched preference tag.
    // +20 ต่อ tag preference ที่ตรง
    const prefMatch = h.tags.filter((t) => body.preferences.includes(t)).length;
    score += prefMatch * 20;
    // Budget bonus/penalty.
    // bonus/penalty ตามงบ
    if (body.budget) {
      if (h.priceMin <= body.budget) score += 10;
      else score -= 5;
    }
    // Distance bonus when an origin is provided.
    // bonus เมื่อมี origin — ระยะใกล้ได้คะแนนมากกว่า
    if (body.location) {
      const km = haversineKm(body.location, { lat: h.lat, lng: h.lng });
      if (km < 50) score += 8;
      else if (km < 200) score += 4;
    }
    // Popularity (log-scaled review count) so popular hotels rise without dominating.
    // ความนิยมโดยใช้ log ของจำนวนรีวิว — กันโรงแรมดังครองอันดับเกินไป
    score += Math.log10(h.reviewCount + 1) * 2;

    // Build a short explanation by joining matched-signal phrases.
    // ประกอบเหตุผลสั้น ๆ จาก signal ที่ตรง
    const reasons: string[] = [];
    if (prefMatch) reasons.push(`Matches your ${h.tags.slice(0, 2).join(" & ")} preference`);
    if (body.budget && h.priceMin <= body.budget)
      reasons.push(`Within ฿${body.budget.toLocaleString()} budget`);
    if (h.rating >= 4.5) reasons.push(`Highly rated ${h.rating}★`);
    reasons.push(`${h.type.charAt(0).toUpperCase() + h.type.slice(1)} in ${h.province}`);
    return { hotel: h, score, reason: reasons.join(" · ") };
  });
  // Sort high → low and slice the top N.
  // sort สูง → ต่ำ แล้วตัด N ตัวบน
  return scored.sort((a, b) => b.score - a.score).slice(0, n);
}

/**
 * Stage 2: ask Claude to re-rank the 30 best algorithmic candidates
 * and pick the best 5 with custom reasons. Returns `null` on any
 * failure (env key missing, network error, JSON parse error), letting
 * the caller fall back.
 *
 * (TH) ขั้น 2: ส่ง 30 candidates ให้ Claude เลือก 5 พร้อมเหตุผล คืน null
 * เมื่อ fail (ไม่มี env key, network error, parse error) เพื่อให้ caller
 * fallback ได้
 */
async function aiRec(hotels: Hotel[], body: ReqBody): Promise<HotelRec[] | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  // Compute 30 candidates so the model has variety to choose from.
  // เตรียม 30 candidate ให้โมเดลมีตัวเลือกหลากหลาย
  const candidates = algorithmicRec(hotels, body, 30);
  // Build a compact summary line per candidate for the prompt.
  // สร้างบรรทัดสรุปต่อ candidate เพื่อใช้ใน prompt
  const summary = candidates
    .map(
      (c, i) =>
        `${i + 1}. [${c.hotel.id}] ${c.hotel.name} | ${c.hotel.type} | ${c.hotel.stars}★ | ฿${c.hotel.priceMin}-${c.hotel.priceMax}/night | ${c.hotel.province} (${c.hotel.region}) | tags:${c.hotel.tags.join(",")} | rating:${c.hotel.rating} | amenities:${c.hotel.amenities.slice(0, 4).join(",")}`
    )
    .join("\n");

  // Prompt asks for STRICT JSON only — the parser below looks for the
  // first `[` / last `]` to be resilient to small prose around it.
  // prompt บังคับ JSON เท่านั้น — parser ด้านล่างหา `[` แรก / `]` ท้าย
  // เพื่อกันโมเดลใส่ข้อความเพิ่มมาเล็กน้อย
  const prompt = `You are a Thai travel concierge AI. A traveler named ${body.nickname ?? "Guest"} is looking for accommodation in Thailand.

Traveler profile:
- Preferences: ${body.preferences.join(", ") || "general"}
- Budget per night: ฿${body.budget ?? "flexible"}
- Home: ${body.homeAddress ?? "unknown"}

Top candidate hotels (ranked algorithmically):
${summary}

Pick the best 5 hotels from this list for this traveler. For each, give a personalized 1-sentence reason why it suits them specifically. Respond ONLY with valid JSON:
[{"id":"h-XXXXX","reason":"..."},...]
No other text.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    // Locate the JSON array boundaries — defensive against extra prose.
    // หาเขต `[...]` ของ JSON เพื่อกันข้อความเสริม
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start < 0 || end < 0) return null;
    const picks = JSON.parse(text.slice(start, end + 1)) as { id: string; reason: string }[];
    // Map picks back into the full HotelRec, replacing the algorithmic
    // reason with Claude's personalized one. Drop unknown ids.
    // map ผลลัพธ์กลับเป็น HotelRec เต็ม โดยใช้เหตุผลจาก Claude แทน
    // และทิ้ง id ที่ไม่ตรง
    const byId = Object.fromEntries(candidates.map((c) => [c.hotel.id, c]));
    return picks
      .map((p) => (byId[p.id] ? { ...byId[p.id], reason: p.reason } : null))
      .filter(Boolean) as HotelRec[];
  } catch {
    return null;
  }
}

/**
 * POST handler — read body, narrow the pool by preference/region,
 * then call the AI; fall back to algorithmic on any failure.
 *
 * (TH) handler POST — อ่าน body, กรอง pool ตาม preference/region แล้ว
 * เรียก AI; fallback ใช้ algorithmic ถ้า fail
 */
export async function POST(req: Request) {
  // Parse JSON body or return 400.
  // parse body หรือคืน 400
  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const allHotels = getHotels();

  // Pre-filter by preference tags when at least 100 matches exist,
  // otherwise keep the full pool so the AI has enough to choose from.
  // กรองตาม preference เฉพาะเมื่อยังเหลือ ≥100 ตัว ไม่งั้นใช้ pool ทั้งหมด
  // เพื่อให้ AI มีตัวเลือกพอ
  let pool = allHotels;
  if (body.preferences.length) {
    const prefFiltered = allHotels.filter((h) => h.tags.some((t) => body.preferences.includes(t)));
    pool = prefFiltered.length >= 100 ? prefFiltered : allHotels;
  }
  if (body.region) pool = pool.filter((h) => h.region === body.region);

  // Try AI first; require ≥3 picks for it to be considered a success.
  // ลอง AI ก่อน — ต้องได้ ≥3 ตัวถึงจะถือว่าใช้ได้
  const aiResult = await aiRec(pool, body);
  if (aiResult && aiResult.length >= 3) {
    return NextResponse.json({ recommendations: aiResult, source: "anthropic" });
  }

  // Fallback — algorithmic top 5.
  // fallback — top 5 ของ algorithmic
  const recs = algorithmicRec(pool, body, 5);
  return NextResponse.json({ recommendations: recs, source: "algorithmic" });
}
