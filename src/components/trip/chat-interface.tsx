"use client";

import * as React from "react";
import {
  ArrowUp,
  BarChart3,
  Banknote,
  Smile,
  Users,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatTime } from "@/lib/utils";
import { useVibeStore } from "@/lib/store";
import { PollCard, PollComposer } from "@/components/features/group-poll";
import type { TripGroup, User } from "@/lib/types";

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

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-border/60 bg-card/60 px-4 py-3 backdrop-blur-xl">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-semibold tracking-tight">
              {group.name}
            </h2>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" /> {group.members.length} member
            {group.members.length === 1 ? "" : "s"} · code{" "}
            <span className="font-mono">{group.inviteCode}</span>
          </div>
        </div>
        <Button
          variant={expenseOpen ? "accent" : "glass"}
          size="sm"
          onClick={onToggleExpense}
        >
          <Banknote className="h-4 w-4" />
          <span className="hidden sm:inline">Expenses</span>
        </Button>
      </header>

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
              Say hi, drop a poll, or set a budget to get the trip rolling.
            </p>
          </div>
        )}
        {group.messages.map((m) => {
          const isMine = m.authorId === user.id;
          if (m.kind === "poll" && m.pollId) {
            const poll = group.polls.find((p) => p.id === m.pollId);
            if (!poll) return null;
            return (
              <div key={m.id} className="mx-auto max-w-lg">
                <PollCard poll={poll} userId={user.id} />
              </div>
            );
          }
          if (m.authorId === "system") {
            return (
              <div key={m.id} className="text-center">
                <span className="rounded-full bg-secondary/60 px-3 py-1 text-[11px] text-muted-foreground">
                  {m.content}
                </span>
              </div>
            );
          }
          return (
            <div
              key={m.id}
              className={cn(
                "flex items-end gap-2",
                isMine && "flex-row-reverse"
              )}
            >
              <Avatar className="h-7 w-7">
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
                    : "rounded-bl-md bg-card border border-border/60"
                )}
              >
                {!isMine && (
                  <div className="mb-0.5 text-[11px] font-medium text-muted-foreground">
                    {m.authorName}
                  </div>
                )}
                <div className="whitespace-pre-wrap leading-snug">
                  {m.content}
                </div>
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
