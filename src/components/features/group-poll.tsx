"use client";

import * as React from "react";
import { BarChart3, Check, Plus, Trash2, Vote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useVibeStore } from "@/lib/store";
import type { Poll } from "@/lib/types";

interface PollCardProps {
  poll: Poll;
  userId: string;
}

export function PollCard({ poll, userId }: PollCardProps) {
  const vote = useVibeStore((s) => s.votePoll);
  const totalVotes = poll.options.reduce((s, o) => s + o.votes.length, 0);

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Badge variant="accent">
            <Vote className="h-3 w-3" /> Poll
          </Badge>
          <span className="text-xs text-muted-foreground">
            {totalVotes} vote{totalVotes === 1 ? "" : "s"}
          </span>
        </div>
        <h4 className="text-sm font-semibold tracking-tight">
          {poll.question}
        </h4>
        <ul className="space-y-2">
          {poll.options.map((o) => {
            const pct = totalVotes ? (o.votes.length / totalVotes) * 100 : 0;
            const userVoted = o.votes.includes(userId);
            return (
              <li key={o.id}>
                <button
                  onClick={() => vote(poll.groupId, poll.id, o.id, userId)}
                  className={cn(
                    "group relative w-full overflow-hidden rounded-2xl border bg-background px-3 py-2.5 text-left text-sm transition-colors",
                    userVoted
                      ? "border-accent ring-1 ring-accent/40"
                      : "border-border hover:border-accent/40"
                  )}
                >
                  <span
                    className="absolute inset-y-0 left-0 -z-0 bg-accent/15 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                  <span className="relative z-10 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      {userVoted && <Check className="h-3.5 w-3.5 text-accent" />}
                      {o.label}
                    </span>
                    <span className="text-xs font-medium tabular-nums">
                      {Math.round(pct)}%
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

interface PollComposerProps {
  groupId: string;
  onCreate: (question: string, options: string[]) => void;
  onCancel: () => void;
}

export function PollComposer({ groupId: _groupId, onCreate, onCancel }: PollComposerProps) {
  const [question, setQuestion] = React.useState("");
  const [options, setOptions] = React.useState(["", ""]);

  const submit = () => {
    const trimmedQ = question.trim();
    const cleaned = options.map((o) => o.trim()).filter(Boolean);
    if (!trimmedQ || cleaned.length < 2) return;
    onCreate(trimmedQ, cleaned);
  };

  return (
    <Card className="border-accent/30">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium">New poll</span>
        </div>
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Where should we go tonight?"
        />
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={opt}
                onChange={(e) =>
                  setOptions((arr) => arr.map((v, idx) => (idx === i ? e.target.value : v)))
                }
                placeholder={`Option ${i + 1}`}
              />
              {options.length > 2 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setOptions((arr) => arr.filter((_, idx) => idx !== i))
                  }
                  aria-label="Remove option"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOptions((arr) => [...arr, ""])}
          >
            <Plus className="h-3.5 w-3.5" /> Add option
          </Button>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="accent" size="sm" onClick={submit}>
            Launch poll
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
