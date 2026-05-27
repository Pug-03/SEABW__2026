import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { Hotel } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let _cache: Hotel[] | null = null;
function getHotels(): Hotel[] {
  if (!_cache) {
    const file = path.join(process.cwd(), "src", "data", "hotels.json");
    _cache = JSON.parse(fs.readFileSync(file, "utf-8")) as Hotel[];
  }
  return _cache;
}

interface ReqBody {
  preferences: string[];
  location?: { lat: number; lng: number };
  budget?: number;
  nickname?: string;
  homeAddress?: string;
  region?: string;
}

export interface HotelRec {
  hotel: Hotel;
  reason: string;
  score: number;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function algorithmicRec(hotels: Hotel[], body: ReqBody, n = 10): HotelRec[] {
  const scored = hotels.map((h) => {
    let score = h.rating * 10;
    const prefMatch = h.tags.filter((t) => body.preferences.includes(t)).length;
    score += prefMatch * 20;
    if (body.budget) {
      if (h.priceMin <= body.budget) score += 10;
      else score -= 5;
    }
    if (body.location) {
      const km = haversineKm(body.location, { lat: h.lat, lng: h.lng });
      if (km < 50) score += 8;
      else if (km < 200) score += 4;
    }
    score += Math.log10(h.reviewCount + 1) * 2;
    const reasons: string[] = [];
    if (prefMatch) reasons.push(`Matches your ${h.tags.slice(0, 2).join(" & ")} preference`);
    if (body.budget && h.priceMin <= body.budget) reasons.push(`Within ฿${body.budget.toLocaleString()} budget`);
    if (h.rating >= 4.5) reasons.push(`Highly rated ${h.rating}★`);
    reasons.push(`${h.type.charAt(0).toUpperCase() + h.type.slice(1)} in ${h.province}`);
    return { hotel: h, score, reason: reasons.join(" · ") };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, n);
}

async function aiRec(hotels: Hotel[], body: ReqBody): Promise<HotelRec[] | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const candidates = algorithmicRec(hotels, body, 30);
  const summary = candidates.map((c, i) =>
    `${i + 1}. [${c.hotel.id}] ${c.hotel.name} | ${c.hotel.type} | ${c.hotel.stars}★ | ฿${c.hotel.priceMin}-${c.hotel.priceMax}/night | ${c.hotel.province} (${c.hotel.region}) | tags:${c.hotel.tags.join(",")} | rating:${c.hotel.rating} | amenities:${c.hotel.amenities.slice(0, 4).join(",")}`
  ).join("\n");

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
    const data = await res.json() as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    const start = text.indexOf("["), end = text.lastIndexOf("]");
    if (start < 0 || end < 0) return null;
    const picks = JSON.parse(text.slice(start, end + 1)) as { id: string; reason: string }[];
    const byId = Object.fromEntries(candidates.map((c) => [c.hotel.id, c]));
    return picks
      .map((p) => byId[p.id] ? { ...byId[p.id], reason: p.reason } : null)
      .filter(Boolean) as HotelRec[];
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let body: ReqBody;
  try { body = await req.json() as ReqBody; } catch { return NextResponse.json({ error: "invalid body" }, { status: 400 }); }

  const allHotels = getHotels();

  // Pre-filter to relevant subset for speed
  let pool = allHotels;
  if (body.preferences.length) {
    const prefFiltered = allHotels.filter((h) => h.tags.some((t) => body.preferences.includes(t)));
    pool = prefFiltered.length >= 100 ? prefFiltered : allHotels;
  }
  if (body.region) pool = pool.filter((h) => h.region === body.region);

  const aiResult = await aiRec(pool, body);
  if (aiResult && aiResult.length >= 3) {
    return NextResponse.json({ recommendations: aiResult, source: "anthropic" });
  }

  const recs = algorithmicRec(pool, body, 5);
  return NextResponse.json({ recommendations: recs, source: "algorithmic" });
}
