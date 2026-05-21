"use client";

import * as React from "react";
import { Backpack, Check, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [customItems, setCustomItems] = React.useState<
    Partial<Record<Preference, string[]>>
  >({});
  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!active.includes(tab)) setTab(active[0]);
  }, [active, tab]);

  const defaultItems = React.useMemo(() => PACKING_LISTS[tab] ?? [], [tab]);
  const userItems = React.useMemo(
    () => customItems[tab] ?? [],
    [customItems, tab]
  );
  const items = React.useMemo(
    () => [...defaultItems, ...userItems],
    [defaultItems, userItems]
  );
  const doneCount = items.filter((i) => checked[`${tab}:${i}`]).length;

  const addItem = (event: React.FormEvent) => {
    event.preventDefault();
    const item = draft.trim();
    if (!item) {
      setError("Enter an item to add.");
      return;
    }
    const duplicate = items.some((i) => i.toLowerCase() === item.toLowerCase());
    if (duplicate) {
      setError("That item is already on the list.");
      return;
    }
    setCustomItems((current) => ({
      ...current,
      [tab]: [...(current[tab] ?? []), item],
    }));
    setDraft("");
    setError(null);
  };

  const removeCustomItem = (item: string) => {
    setCustomItems((current) => ({
      ...current,
      [tab]: (current[tab] ?? []).filter((i) => i !== item),
    }));
    setChecked((current) => {
      const next = { ...current };
      delete next[`${tab}:${item}`];
      return next;
    });
  };

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

        <form onSubmit={addItem} className="space-y-1.5">
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Add packing item"
              aria-label="Add packing item"
            />
            <Button type="submit" variant="accent" size="icon" aria-label="Add item">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </form>

        <ul className="space-y-1.5">
          {items.map((item) => {
            const key = `${tab}:${item}`;
            const isChecked = !!checked[key];
            const isCustom = userItems.includes(item);
            return (
              <li key={key}>
                <div
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors",
                    "hover:bg-secondary/60",
                    isChecked && "text-muted-foreground line-through"
                  )}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setChecked((c) => ({ ...c, [key]: !c[key] }))
                    }
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
                        isChecked
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border bg-background"
                      )}
                    >
                      {isChecked && <Check className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0 truncate">{item}</span>
                  </button>
                  {isCustom && (
                    <button
                      type="button"
                      onClick={() => removeCustomItem(item)}
                      aria-label={`Remove ${item}`}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
