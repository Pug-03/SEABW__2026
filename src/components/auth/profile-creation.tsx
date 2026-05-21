"use client";

import * as React from "react";
import { Check, Copy, Link2, Share2, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { QRCode } from "@/components/common/qr-code";
import type { User } from "@/lib/types";
import { PREFERENCE_META } from "@/lib/mock-data";

interface ProfileCreationProps {
  user: User;
  inviteUrl: string;
  inviteCode: string;
  onContinue: () => void;
}

export function ProfileCreation({
  user,
  inviteUrl,
  inviteCode,
  onContinue,
}: ProfileCreationProps) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const share = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
          title: "Join my VibeTrip",
          text: `Hop on my trip — invite code ${inviteCode}`,
          url: inviteUrl,
        });
      } catch {
        copy();
      }
    } else copy();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-1 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          <Sparkles className="h-3 w-3" /> {"You're"} all set
        </div>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome, {user.nickname}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share your invite so your crew can hop into trips.
        </p>
      </div>

      <div className="grid gap-3 sm:gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-border/60 bg-card/70 p-4 sm:p-6 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-accent/30">
              {user.avatarDataUrl && (
                <AvatarImage src={user.avatarDataUrl} alt={user.firstName} />
              )}
              <AvatarFallback>
                {user.firstName[0]}
                {user.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-semibold">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-xs text-muted-foreground">
                @{user.nickname} • {user.email}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Preferences
            </div>
            <div className="flex flex-wrap gap-1.5">
              {user.preferences.length === 0 && (
                <span className="text-sm text-muted-foreground">
                  Pick at least one to personalize recommendations
                </span>
              )}
              {user.preferences.map((p) => (
                <Badge key={p} variant="accent">
                  {PREFERENCE_META[p].label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-secondary/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Invite link
                </div>
                <div className="truncate font-mono text-xs">{inviteUrl}</div>
              </div>
              <Button size="sm" variant="outline" onClick={copy}>
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </>
                )}
              </Button>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <Link2 className="h-3 w-3 text-accent" />
              <span className="text-muted-foreground">Code:</span>
              <span className="font-mono font-semibold">{inviteCode}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              variant="glass"
              onClick={share}
              className="w-full sm:flex-1"
            >
              <Share2 className="h-4 w-4" /> Share invite
            </Button>
            <Button
              variant="accent"
              onClick={onContinue}
              className="w-full sm:flex-1"
            >
              <Users className="h-4 w-4" /> Go to dashboard
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center rounded-3xl border border-border/60 bg-card/70 p-4 sm:p-6 backdrop-blur-xl">
          <QRCode value={inviteUrl} size={160} className="sm:hidden" label={`Code: ${inviteCode}`} />
          <QRCode value={inviteUrl} size={200} className="hidden sm:flex" label={`Code: ${inviteCode}`} />
        </div>
      </div>
    </div>
  );
}
