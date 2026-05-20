"use client";

import * as React from "react";
import {
  Calendar,
  Clock,
  Loader2,
  Sparkles,
  User as UserIcon,
  Wand2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DESTINATIONS } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import type { Itinerary } from "@/lib/types";

interface AIItineraryProps {
  initialDestinationId?: string;
  members?: { id: string; name: string }[];
  budget?: number;
  preferences?: string[];
}

export function AIItinerary({
  initialDestinationId,
  members = [],
  budget,
  preferences = [],
}: AIItineraryProps) {
  const [destId, setDestId] = React.useState(
    initialDestinationId ?? DESTINATIONS[0].id
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [itinerary, setItinerary] = React.useState<Itinerary | null>(null);
  const [source, setSource] = React.useState<"anthropic" | "mock" | null>(null);

  const dest = DESTINATIONS.find((d) => d.id === destId) ?? DESTINATIONS[0];

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/itinerary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          destination: `${dest.title}, ${dest.region}`,
          members: members.map((m) => m.name),
          budget,
          preferences,
          days: 3,
          nights: 2,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as {
        itinerary: Itinerary;
        source: "anthropic" | "mock";
      };
      setItinerary(data.itinerary);
      setSource(data.source);
    } catch (e) {
      setError("Could not generate itinerary. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wand2 className="h-4 w-4 text-accent" />
            AI Trip Plan
          </CardTitle>
          <Badge variant="ai">
            <Sparkles className="h-3 w-3" /> 3D / 2N
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={destId}
            onChange={(e) => setDestId(e.target.value)}
            className="h-10 flex-1 rounded-2xl border border-input bg-background/50 px-3 text-sm"
          >
            {DESTINATIONS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}, {d.region}
              </option>
            ))}
          </select>
          <Button
            variant="accent"
            onClick={generate}
            disabled={loading}
            className="sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate AI Trip Plan
              </>
            )}
          </Button>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {itinerary && (
          <TripTimeline itinerary={itinerary} source={source} members={members} />
        )}
      </CardContent>
    </Card>
  );
}

interface TripTimelineProps {
  itinerary: Itinerary;
  source: "anthropic" | "mock" | null;
  members: { id: string; name: string }[];
}

function TripTimeline({ itinerary, source, members }: TripTimelineProps) {
  const totalCost = itinerary.days.reduce(
    (s, d) => s + d.activities.reduce((a, x) => a + x.cost, 0),
    0
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/60 bg-secondary/30 p-3">
        <div className="text-sm">
          <span className="font-semibold tracking-tight">
            {itinerary.destination}
          </span>{" "}
          <span className="text-muted-foreground">
            · {itinerary.days.length} days
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Badge variant={source === "anthropic" ? "ai" : "secondary"}>
            {source === "anthropic" ? "Claude" : "Demo plan"}
          </Badge>
          <span className="text-muted-foreground">
            Est. {formatCurrency(totalCost)} / budget{" "}
            {formatCurrency(itinerary.totalBudget)}
          </span>
        </div>
      </div>

      <ol className="relative space-y-6 border-l border-border/60 pl-5">
        {itinerary.days.map((day) => (
          <li key={day.day} className="relative">
            <div className="absolute -left-[27px] top-0 grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white shadow-lg">
              D{day.day}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <h4 className="text-sm font-semibold tracking-tight">
                {day.title}
              </h4>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {day.activities.map((a, i) => {
                const responsible =
                  a.responsible ?? members[i % Math.max(1, members.length)]?.name;
                return (
                  <div
                    key={i}
                    className="rounded-2xl border border-border/60 bg-card/70 p-3 text-sm shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {a.time}
                      </span>
                      <span className="font-medium text-accent">
                        {formatCurrency(a.cost)}
                      </span>
                    </div>
                    <div className="mt-1 font-medium leading-snug">
                      {a.title}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.description}
                    </p>
                    {responsible && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[9px]">
                            {responsible.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <UserIcon className="h-3 w-3" /> {responsible}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
