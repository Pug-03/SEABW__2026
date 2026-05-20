import { NextResponse } from "next/server";
import type { Itinerary } from "@/lib/types";

export const runtime = "edge";

interface RequestBody {
  destination: string;
  days?: number;
  nights?: number;
  budget?: number;
  members?: string[];
  preferences?: string[];
}

function mockItinerary(body: RequestBody): Itinerary {
  const destination = body.destination || "Destination";
  const members = body.members?.length ? body.members : ["You"];
  const budget = body.budget ?? 12000;
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

async function realItinerary(body: RequestBody): Promise<Itinerary | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const prompt = `Create a 3 days 2 nights detailed itinerary for ${body.destination} including times, activities, and budget. Trip context: members=${(body.members ?? []).join(", ") || "small group"}, preferences=${(body.preferences ?? []).join(", ") || "general"}, totalBudget=THB ${body.budget ?? 12000}. Respond ONLY with valid JSON matching this TypeScript type: { destination: string, totalBudget: number, days: { day: number, title: string, activities: { time: string, title: string, description: string, cost: number, responsible?: string }[] }[] }. No prose.`;

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
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd < 0) return null;
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    return parsed as Itinerary;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.destination) {
    return NextResponse.json(
      { error: "destination is required" },
      { status: 400 }
    );
  }
  const real = await realItinerary(body);
  const itinerary = real ?? mockItinerary(body);
  return NextResponse.json({ itinerary, source: real ? "anthropic" : "mock" });
}
