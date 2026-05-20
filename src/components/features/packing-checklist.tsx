"use client";

import * as React from "react";
import { Backpack, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PACKING_LISTS, PREFERENCE_META } from "@/lib/mock-data";
import type { Preference } from "@/lib/types";

interface PackingChecklistProps {
  preferences: Preference[];
}

export function PackingChecklist({ preferences }: PackingChecklistProps) {
  const active = React.useMemo<Preference[]>(
    () => (preferences.length ? preferences : ["beach"]),
    [preferences]
  );
  const [tab, setTab] = React.useState<Preference>(active[0]);
  const [checked, setChecked] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (!active.includes(tab)) setTab(active[0]);
  }, [active, tab]);

  const items = PACKING_LISTS[tab] ?? [];
  const doneCount = items.filter((i) => checked[`${tab}:${i}`]).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Backpack className="h-4 w-4 text-accent" /> Packing checklist
          </CardTitle>
          <Badge variant="secondary">
            {doneCount}/{items.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1">
          {active.map((p) => (
            <button
              key={p}
              onClick={() => setTab(p)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                tab === p
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border bg-secondary text-muted-foreground hover:bg-secondary/70"
              )}
            >
              {PREFERENCE_META[p].label}
            </button>
          ))}
        </div>
        <ul className="space-y-1.5">
          {items.map((item) => {
            const key = `${tab}:${item}`;
            const isChecked = !!checked[key];
            return (
              <li key={key}>
                <button
                  onClick={() =>
                    setChecked((c) => ({ ...c, [key]: !c[key] }))
                  }
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors",
                    "hover:bg-secondary/60",
                    isChecked && "text-muted-foreground line-through"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded-md border transition-colors",
                      isChecked
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-background"
                    )}
                  >
                    {isChecked && <Check className="h-3 w-3" />}
                  </span>
                  {item}
                </button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
