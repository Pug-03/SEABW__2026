/**
 * @file `POST /api/ai/itinerary` — generates a multi-day trip plan.
 *
 * Tries Claude (Anthropic) first when `ANTHROPIC_API_KEY` is set;
 * falls back to a deterministic 3-day mock when the call fails or
 * the key is missing. The response shape and `source` field let the
 * client (`<AIItinerary>`) badge the result as "Claude" vs "Demo plan".
 *
 * (TH) endpoint สร้างแผนเที่ยวหลายวัน ลอง Claude ก่อน (เมื่อมี env
 * ANTHROPIC_API_KEY) — ถ้า fail หรือไม่มี key จะ fallback ใช้ mock 3 วัน
 * field `source` ใน response บอก client ว่าใช้ Claude หรือ Demo
 */

import { NextResponse } from "next/server";
import type { Itinerary } from "@/lib/types";

// Node runtime (no edge) + dynamic so each request is fresh.
// Node runtime (ไม่ใช่ edge) + dynamic เพื่อให้รัน fresh ทุก request
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Incoming JSON body. Only `destination` is required — the rest are
 * optional context that gets folded into the prompt.
 *
 * (TH) JSON body ที่รับ — บังคับเฉพาะ `destination` ที่เหลือเป็น context
 * เสริมที่ใส่ใน prompt
 */
interface RequestBody {
  destination: string;
  days?: number;
  nights?: number;
  budget?: number;
  members?: string[];
  preferences?: string[];
}

// Default trip budget assumption when the caller doesn't specify one.
// งบประมาณ default เมื่อ caller ไม่ส่งมา
const DEFAULT_BUDGET = 12000;

// ─── Mock generator ──────────────────────────────────────────────────────────

/**
 * Build a deterministic 3-day mock itinerary. Activity costs are
 * derived as percentages of the budget so the totals always sum to
 * something believable. Members rotate as the "responsible" person.
 *
 * NOTE: this currently always returns 3 days regardless of
 * `body.days`. The shape mirrors the Claude prompt's expected output
 * so the UI can render either source the same way.
 *
 * (TH) สร้าง itinerary 3 วันแบบ mock ค่าใช้จ่ายของกิจกรรมคิดเป็น % ของงบ
 * เพื่อให้รวมแล้วดูสมเหตุสมผล ผู้รับผิดชอบวนตามรายชื่อสมาชิก
 * NOTE: ปัจจุบันยังคืน 3 วันเสมอแม้ส่ง `body.days` มา — โครงสร้างเหมือนกับ
 * ที่ Claude ส่งกลับ ทำให้ UI render ได้เหมือนกัน
 */
function mockItinerary(body: RequestBody): Itinerary {
  const destination = body.destination || "Destination";
  const members = body.members?.length ? body.members : ["You"];
  const budget = body.budget ?? DEFAULT_BUDGET;
  // Cycle through members to assign a "responsible" per activity.
  // วนรายชื่อสมาชิกเพื่อใส่ผู้รับผิดชอบของแต่ละกิจกรรม
  const pick = (i: number) => members[i % members.length];

  return {
    destination,
    totalBudget: budget,
    days: [
      {
        day: 1,
        title: "Arrival & Sunset Vibes",
        activities: [
          {
            time: "10:00",
            title: `Arrive in ${destination}`,
            description: "Check in, grab a welcome drink, settle into the vibe.",
            cost: 0,
            responsible: pick(0),
          },
          {
            time: "12:30",
            title: "Local lunch",
            description: "Try a street-food classic recommended by locals.",
            cost: Math.round(budget * 0.04),
            responsible: pick(1),
          },
          {
            time: "15:00",
            title: "Walking tour",
            description: "Explore the old town and key landmarks at golden hour.",
            cost: Math.round(budget * 0.03),
            responsible: pick(2),
          },
          {
            time: "19:00",
            title: "Sunset viewpoint",
            description: "Catch sunset at the best vantage point, then dinner.",
            cost: Math.round(budget * 0.08),
            responsible: pick(0),
          },
        ],
      },
      {
        day: 2,
        title: "Adventure Day",
        activities: [
          {
            time: "08:00",
            title: "Sunrise activity",
            description: "Early hike, swim, or scenic drive depending on vibe.",
            cost: Math.round(budget * 0.05),
            responsible: pick(1),
          },
          {
            time: "12:00",
            title: "Group lunch",
            description: "Recharge with shared plates and cold drinks.",
            cost: Math.round(budget * 0.06),
            responsible: pick(2),
          },
          {
            time: "14:00",
            title: "Marquee experience",
            description: `The must-do activity in ${destination}.`,
            cost: Math.round(budget * 0.12),
            responsible: pick(0),
          },
          {
            time: "20:00",
            title: "Night out",
            description: "Live music, rooftop, or local night market.",
            cost: Math.round(budget * 0.07),
            responsible: pick(1),
          },
        ],
      },
      {
        day: 3,
        title: "Slow Morning & Departure",
        activities: [
          {
            time: "09:00",
            title: "Brunch & souvenirs",
            description: "Take it easy. Pick up gifts and pack.",
            cost: Math.round(budget * 0.05),
            responsible: pick(2),
          },
          {
            time: "13:00",
            title: "Departure",
            description: "Group ride to the airport / station.",
            cost: Math.round(budget * 0.03),
            responsible: pick(0),
          },
        ],
      },
    ],
  };
}

// ─── Claude AI generator ─────────────────────────────────────────────────────

/**
 * Ask Claude to generate an itinerary as strict JSON. Returns `null`
 * on any failure (no key, network error, JSON parse error) so the
 * caller can fall back.
 *
 * NOTE: the prompt currently hard-codes "3 days 2 nights" — it
 * ignores `body.days` / `body.nights`. Fix when wiring up the
 * frontend's days selector (2/3/5/7).
 *
 * (TH) ส่ง prompt ให้ Claude สร้าง itinerary แบบ JSON เคร่งครัด คืน null
 * เมื่อ fail เพื่อให้ caller fallback ได้
 * NOTE: prompt ตอนนี้ hardcode "3 days 2 nights" — ยังไม่ใช้ `body.days`/
 * `body.nights` ควรแก้ตอนเชื่อมตัวเลือกวันของ frontend (2/3/5/7)
 */
async function realItinerary(body: RequestBody): Promise<Itinerary | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const prompt = `Create a 3 days 2 nights detailed itinerary for ${body.destination} including times, activities, and budget. Trip context: members=${(body.members ?? []).join(", ") || "small group"}, preferences=${(body.preferences ?? []).join(", ") || "general"}, totalBudget=THB ${body.budget ?? DEFAULT_BUDGET}. Respond ONLY with valid JSON matching this TypeScript type: { destination: string, totalBudget: number, days: { day: number, title: string, activities: { time: string, title: string, description: string, cost: number, responsible?: string }[] }[] }. No prose.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
    };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    // Find the JSON object boundaries — defensive against extra prose.
    // หาเขต `{...}` ของ JSON เพื่อกันข้อความเสริม
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd < 0) return null;
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    return parsed as Itinerary;
  } catch {
    return null;
  }
}

// ─── POST handler ────────────────────────────────────────────────────────────

/**
 * POST handler — validate body, try Claude, fall back to mock. The
 * `source` field in the response lets the client badge it as
 * "Claude" or "Demo plan".
 *
 * (TH) handler POST — validate body, ลอง Claude, fallback ใช้ mock
 * field `source` ใน response บอก client ให้แสดง "Claude" หรือ "Demo plan"
 */
export async function POST(req: Request) {
  // Parse JSON body, return 400 if it's malformed.
  // parse JSON body, คืน 400 ถ้าผิดรูป
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  // `destination` is the only required field.
  // `destination` เป็น field เดียวที่บังคับ
  if (!body.destination) {
    return NextResponse.json(
      { error: "destination is required" },
      { status: 400 }
    );
  }
  // Real result wins; mock is the safety net.
  // ผลจาก AI ชนะ; mock เป็น safety net
  const real = await realItinerary(body);
  const itinerary = real ?? mockItinerary(body);
  return NextResponse.json({ itinerary, source: real ? "anthropic" : "mock" });
}
