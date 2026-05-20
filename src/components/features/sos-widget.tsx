"use client";

import * as React from "react";
import {
  AlertTriangle,
  Fuel,
  Hospital,
  Phone,
  ShieldCheck,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SOS_FACILITIES } from "@/lib/mock-data";
import type { InsuranceDetails, User } from "@/lib/types";

interface SosWidgetProps {
  user: User;
}

const ICONS = {
  Hospital: Hospital,
  Police: Shield,
  Gas: Fuel,
} as const;

export function SosWidget({ user }: SosWidgetProps) {
  const [active, setActive] = React.useState(false);
  return (
    <Card
      className={cn(
        "overflow-hidden transition-colors",
        active && "border-destructive/60"
      )}
    >
      <CardHeader
        className={cn(
          "pb-3 transition-colors",
          active && "bg-destructive/10"
        )}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle
              className={cn(
                "h-4 w-4",
                active ? "text-destructive animate-pulse" : "text-accent"
              )}
            />
            Nearby SOS
          </CardTitle>
          <Button
            variant={active ? "destructive" : "outline"}
            size="sm"
            onClick={() => setActive((a) => !a)}
          >
            {active ? (
              <>
                <ShieldAlert className="h-3.5 w-3.5" /> SOS active
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5" /> Activate
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {active && user.insurance && (
          <InsuranceCard insurance={user.insurance} user={user} />
        )}
        {active && !user.insurance && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
            <div className="font-medium text-amber-700 dark:text-amber-300">
              No travel insurance on file
            </div>
            <p className="mt-0.5 text-muted-foreground">
              Add policy details from your profile so first responders can act
              faster.
            </p>
          </div>
        )}

        <ul className="space-y-2">
          {SOS_FACILITIES.map((f) => {
            const Icon = ICONS[f.type];
            const tone =
              f.type === "Hospital"
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-300"
                : f.type === "Police"
                ? "bg-blue-500/15 text-blue-600 dark:text-blue-300"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300";
            return (
              <li
                key={`${f.type}-${f.name}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-secondary/30 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                      tone
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{f.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {f.type} · {f.distanceKm} km away
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={active && f.type === "Hospital" ? "destructive" : "glass"}
                  asChild
                >
                  <a href={`tel:${f.phone.replace(/\s/g, "")}`}>
                    <Phone className="h-3.5 w-3.5" /> Call
                  </a>
                </Button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

function InsuranceCard({
  insurance,
  user,
}: {
  insurance: InsuranceDetails;
  user: User;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-teal-500/15 p-4">
      <div className="flex items-start justify-between">
        <div>
          <Badge variant="success" className="mb-1.5">
            <ShieldCheck className="h-3 w-3" /> Active travel insurance
          </Badge>
          <div className="text-lg font-semibold tracking-tight">
            {insurance.provider}
          </div>
          <div className="text-xs text-muted-foreground">
            Policy {insurance.policyNumber}
          </div>
          <div className="mt-1 text-xs">
            Emergency:{" "}
            <a
              href={`tel:${insurance.emergencyContact.replace(/\s/g, "")}`}
              className="font-medium text-accent"
            >
              {insurance.emergencyContact}
            </a>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            Insured: {user.firstName} {user.lastName} · DOB on file
          </div>
        </div>
        <BarcodeMock value={insurance.policyNumber} />
      </div>
    </div>
  );
}

function BarcodeMock({ value }: { value: string }) {
  // Deterministic pseudo-barcode for the policy number.
  const bars = React.useMemo(() => {
    const seed = (value || "POLICY").split("");
    return Array.from({ length: 36 }, (_, i) => {
      const c = seed[i % seed.length]?.charCodeAt(0) ?? 0;
      const width = ((c + i) % 3) + 1;
      const filled = (c + i) % 5 !== 0;
      return { width, filled };
    });
  }, [value]);
  return (
    <div className="flex flex-col items-end gap-1 rounded-xl bg-white p-2 dark:bg-white/90">
      <div className="flex h-10 items-end gap-[2px]">
        {bars.map((b, i) => (
          <span
            key={i}
            className={cn(
              "h-full",
              b.filled ? "bg-neutral-900" : "bg-white"
            )}
            style={{ width: b.width }}
          />
        ))}
      </div>
      <span className="font-mono text-[9px] text-neutral-700">{value}</span>
    </div>
  );
}
