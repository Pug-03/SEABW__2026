"use client";

import * as React from "react";
import {
  ArrowUp,
  BarChart3,
  Banknote,
  MapPin,
  QrCode,
  Smile,
  Star,
  UserPlus,
  Users,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { QRCode } from "@/components/common/qr-code";
import { cn, formatCurrency, formatTime } from "@/lib/utils";
import { useVibeStore } from "@/lib/store";
import { PollCard, PollComposer } from "@/components/features/group-poll";
import type { PlaceCard, TripGroup, User } from "@/lib/types";

interface ChatInterfaceProps {
  group: TripGroup;
  user: User;
  onToggleExpense: () => void;
  expenseOpen: boolean;
}

export function ChatInterface({
  group,
  user,
  onToggleExpense,
  expenseOpen,
}: ChatInterfaceProps) {
  const addMessage = useVibeStore((s) => s.addMessage);
  const addPoll = useVibeStore((s) => s.addPoll);
  const [draft, setDraft] = React.useState("");
  const [showPoll, setShowPoll] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [group.messages.length]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    addMessage(group.id, {
      authorId: user.id,
      authorName: `${user.firstName} ${user.lastName}`,
      authorAvatar: user.avatarDataUrl,
      content: text,
      kind: "text",
    });
    setDraft("");
  };

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/trip?invite=${group.inviteCode}`
      : `https://vibetrip.app/trip?invite=${group.inviteCode}`;

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col">
      {/* ── Chat header ── */}
      <header className="flex items-center justify-between gap-2 border-b border-border/60 bg-card/60 px-4 py-3 backdrop-blur-xl">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-semibold tracking-tight">
              {group.name}
            </h2>
            <Badge variant="secondary" className="shrink-0">
              <Users className="h-3 w-3" /> {group.members.length}
            </Badge>
          </div>

          {/* Member avatar strip */}
          {group.members.length > 0 && (
            <div className="mt-1 flex items-center gap-1">
              <div className="flex -space-x-2">
                {group.members.slice(0, 5).map((m) => (
                  <Avatar key={m.id} className="h-5 w-5 ring-1 ring-background">
                    {m.avatar && <AvatarImage src={m.avatar} alt={m.name} />}
                    <AvatarFallback className="text-[8px]">
                      {m.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {group.members.length > 5 && (
                <span className="text-[11px] text-muted-foreground">
                  +{group.members.length - 5}
                </span>
              )}
              <span className="ml-1 text-[11px] text-muted-foreground">
                · code <span className="font-mono">{group.inviteCode}</span>
              </span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {/* Invite button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="glass" size="sm" aria-label="Invite members">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Invite</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Invite to {group.name}</DialogTitle>
                <DialogDescription>
                  Share the QR code or link with friends.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-3">
                <QRCode value={inviteUrl} size={180} label={`Code: ${group.inviteCode}`} />
                <div className="w-full rounded-xl bg-secondary/40 px-3 py-2 text-xs">
                  <div className="mb-1 flex items-center gap-1 text-muted-foreground">
                    <Users className="h-3 w-3" /> {group.members.length} member
                    {group.members.length === 1 ? "" : "s"}
                  </div>
                  <div className="truncate font-mono text-foreground">
                    {inviteUrl}
                  </div>
                </div>
                <Button
                  variant="accent"
                  className="w-full"
                  onClick={() => navigator.clipboard.writeText(inviteUrl)}
                >
                  <QrCode className="h-4 w-4" /> Copy invite link
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant={expenseOpen ? "accent" : "glass"}
            size="sm"
            onClick={onToggleExpense}
          >
            <Banknote className="h-4 w-4" />
            <span className="hidden sm:inline">Expenses</span>
          </Button>
        </div>
      </header>

      {/* ── Message list ── */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6 scrollbar-hide"
      >
        {group.messages.length === 0 && (
          <div className="mx-auto max-w-md rounded-3xl border border-dashed border-border/60 bg-card/60 p-6 text-center backdrop-blur-xl">
            <Sparkles className="mx-auto h-6 w-6 text-accent" />
            <h3 className="mt-2 text-sm font-semibold">
              Welcome to {group.name}!
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Say hi, drop a poll, share a destination, or set a budget to get
              the trip rolling.
            </p>
          </div>
        )}

        {group.messages.map((m) => {
          const isMine = m.authorId === user.id;

          /* ── Poll bubble ── */
          if (m.kind === "poll" && m.pollId) {
            const poll = group.polls.find((p) => p.id === m.pollId);
            if (!poll) return null;
            return (
              <div key={m.id} className="mx-auto max-w-lg">
                <PollCard poll={poll} userId={user.id} />
              </div>
            );
          }

          /* ── System message ── */
          if (m.authorId === "system") {
            return (
              <div key={m.id} className="text-center">
                <span className="rounded-full bg-secondary/60 px-3 py-1 text-[11px] text-muted-foreground">
                  {m.content}
                </span>
              </div>
            );
          }

          /* ── Place card bubble ── */
          if (m.kind === "place" && m.placeCard) {
            return (
              <div
                key={m.id}
                className={cn("flex items-end gap-2", isMine && "flex-row-reverse")}
              >
                <Avatar className="h-7 w-7 shrink-0">
                  {m.authorAvatar && (
                    <AvatarImage src={m.authorAvatar} alt={m.authorName} />
                  )}
                  <AvatarFallback className="text-[10px]">
                    {m.authorName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-[78%]">
                  {!isMine && (
                    <div className="mb-0.5 text-[11px] font-medium text-muted-foreground">
                      {m.authorName}
                    </div>
                  )}
                  <PlaceCardBubble placeCard={m.placeCard} />
                  <div
                    className={cn(
                      "mt-0.5 text-[10px] opacity-70",
                      isMine ? "text-right" : "text-left"
                    )}
                  >
                    {formatTime(new Date(m.createdAt))}
                  </div>
                </div>
              </div>
            );
          }

          /* ── Text bubble ── */
          return (
            <div
              key={m.id}
              className={cn("flex items-end gap-2", isMine && "flex-row-reverse")}
            >
              <Avatar className="h-7 w-7 shrink-0">
                {m.authorAvatar && (
                  <AvatarImage src={m.authorAvatar} alt={m.authorName} />
                )}
                <AvatarFallback className="text-[10px]">
                  {m.authorName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                  isMine
                    ? "rounded-br-md bg-accent text-accent-foreground"
                    : "rounded-bl-md border border-border/60 bg-card"
                )}
              >
                {!isMine && (
                  <div className="mb-0.5 text-[11px] font-medium text-muted-foreground">
                    {m.authorName}
                  </div>
                )}
                <div className="whitespace-pre-wrap leading-snug">{m.content}</div>
                <div
                  className={cn(
                    "mt-0.5 text-[10px] opacity-70",
                    isMine ? "text-right" : "text-left"
                  )}
                >
                  {formatTime(new Date(m.createdAt))}
                </div>
              </div>
            </div>
          );
        })}

        {showPoll && (
          <div className="mx-auto max-w-lg">
            <PollComposer
              groupId={group.id}
              onCreate={(q, opts) => {
                addPoll(group.id, q, opts);
                setShowPoll(false);
              }}
              onCancel={() => setShowPoll(false)}
            />
          </div>
        )}
      </div>

      {/* ── Input bar ── */}
      <footer className="border-t border-border/60 bg-card/60 p-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPoll((v) => !v)}
            aria-label="Create poll"
            className={cn(showPoll && "bg-accent/15 text-accent")}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <div className="flex flex-1 items-center gap-2 rounded-full border border-border/60 bg-background/50 px-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={`Message ${group.name}…`}
              className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground/70"
            />
            <Smile className="h-4 w-4 text-muted-foreground" />
          </div>
          <Button
            variant="accent"
            size="icon"
            onClick={send}
            aria-label="Send"
            disabled={!draft.trim()}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </section>
  );
}

/* ── Place card rendered inside a chat bubble ── */
function PlaceCardBubble({ placeCard }: { placeCard: PlaceCard }) {
  return (
    <div className="w-64 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={placeCard.imageUrl}
        alt={placeCard.name}
        className="h-32 w-full object-cover"
      />
      <div className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-snug">
              {placeCard.name}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="line-clamp-1">{placeCard.subtitle}</span>
            </div>
          </div>
          {placeCard.rating != null && (
            <span className="flex shrink-0 items-center gap-0.5 text-xs font-medium">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {placeCard.rating}
            </span>
          )}
        </div>
        {placeCard.price != null && (
          <div className="text-xs font-medium text-accent">
            {formatCurrency(placeCard.price)} / night
          </div>
        )}
        <Badge variant="secondary" className="text-[10px]">
          {placeCard.type === "accommodation" ? "🏨 Stay" : "🗺️ Destination"}
        </Badge>
      </div>
    </div>
  );
}
