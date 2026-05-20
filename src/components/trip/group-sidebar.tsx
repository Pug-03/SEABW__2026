"use client";

import * as React from "react";
import { AlertTriangle, ChevronLeft, Plus, QrCode, Trash2, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { QRCode } from "@/components/common/qr-code";
import { cn } from "@/lib/utils";
import { useVibeStore } from "@/lib/store";
import type { TripGroup } from "@/lib/types";

interface GroupSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function GroupSidebar({ collapsed, onToggleCollapse }: GroupSidebarProps) {
  const groups = useVibeStore((s) => s.groups);
  const activeGroupId = useVibeStore((s) => s.activeGroupId);
  const setActiveGroup = useVibeStore((s) => s.setActiveGroup);
  const createGroup = useVibeStore((s) => s.createGroup);
  const deleteGroup = useVibeStore((s) => s.deleteGroup);
  const [newName, setNewName] = React.useState("");

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-border/60 bg-card/70 backdrop-blur-xl transition-all",
        collapsed ? "w-16" : "w-72"
      )}
    >
      <div className="flex items-center justify-between p-3">
        {!collapsed && (
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Trips
            </div>
            <div className="text-sm font-semibold">{groups.length} active</div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          aria-label="Toggle sidebar"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      <div className="px-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="accent" size="sm" className="w-full">
              <Plus className="h-4 w-4" />
              {!collapsed && <span>New trip</span>}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Start a new trip</DialogTitle>
              <DialogDescription>
                You can create as many trip groups as you like.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Trip name — e.g. Krabi Crew '26"
              autoFocus
            />
            <Button
              variant="accent"
              onClick={() => {
                if (newName.trim()) {
                  createGroup(newName.trim());
                  setNewName("");
                }
              }}
              disabled={!newName.trim()}
            >
              Create trip
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <nav className="mt-3 flex-1 space-y-1 overflow-y-auto px-2 pb-4 scrollbar-hide">
        {groups.map((g) => (
          <GroupRow
            key={g.id}
            group={g}
            active={g.id === activeGroupId}
            collapsed={collapsed}
            onClick={() => setActiveGroup(g.id)}
            onDelete={() => deleteGroup(g.id)}
          />
        ))}
        {groups.length === 0 && !collapsed && (
          <div className="rounded-2xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
            Create your first trip to start planning with friends.
          </div>
        )}
      </nav>

      {!collapsed && <SidebarInviteFooter />}
    </aside>
  );
}

// ─── Trip row ────────────────────────────────────────────────────────────────

interface GroupRowProps {
  group: TripGroup;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  onDelete: () => void;
}

function GroupRow({ group, active, collapsed, onClick, onDelete }: GroupRowProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  return (
    <div className="group/row relative">
      {/* Main row button */}
      <button
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition-colors",
          active
            ? "bg-accent/15 text-foreground"
            : "text-muted-foreground hover:bg-secondary",
          !collapsed && "pr-9"   /* leave room for the delete icon */
        )}
      >
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white">
          {group.name.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 2).toUpperCase() || "T"}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-foreground">
              {group.name}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="h-3 w-3" />
              {group.members.length}
              {group.messages.length > 0 && (
                <span className="ml-1">· {group.messages.length} msgs</span>
              )}
            </div>
          </div>
        )}
      </button>

      {/* Delete button — shown on hover (desktop) or always visible (touch) */}
      {!collapsed && (
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label={`Delete ${group.name}`}
              onClick={(e) => {
                e.stopPropagation();
                setConfirmOpen(true);
              }}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-lg",
                "text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
                "opacity-0 focus:opacity-100 group-hover/row:opacity-100",
                /* Always visible on touch devices */
                "[@media(hover:none)]:opacity-60"
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete trip
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-semibold text-foreground">
                  {group.name}
                </span>
                ? This will permanently remove all chat messages, expenses, and
                shared places. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  setConfirmOpen(false);
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4" /> Delete trip
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Invite footer ────────────────────────────────────────────────────────────

function SidebarInviteFooter() {
  const groups = useVibeStore((s) => s.groups);
  const activeGroupId = useVibeStore((s) => s.activeGroupId);
  const active = groups.find((g) => g.id === activeGroupId);
  if (!active) return null;
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/trip?invite=${active.inviteCode}`
      : `https://vibetrip.app/trip?invite=${active.inviteCode}`;

  return (
    <div className="border-t border-border/60 p-3">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="glass" size="sm" className="w-full">
            <QrCode className="h-4 w-4" /> {`Invite to "${active.name}"`}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite to {active.name}</DialogTitle>
            <DialogDescription>
              Scan the QR or share the code.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3">
            <QRCode value={url} size={180} label={`Code: ${active.inviteCode}`} />
            <div className="w-full rounded-xl bg-secondary/40 px-3 py-2 text-xs">
              <Badge variant="accent" className="mb-1">
                <Users className="h-3 w-3" /> {active.members.length} member
                {active.members.length === 1 ? "" : "s"}
              </Badge>
              <div className="truncate font-mono">{url}</div>
            </div>
            <Button
              variant="accent"
              className="w-full"
              onClick={() => navigator.clipboard.writeText(url)}
            >
              Copy invite link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
