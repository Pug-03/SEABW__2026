/**
 * @file `<GroupSidebar>` — left rail of the `/trip` page. Lists every
 * trip group with an icon avatar + name + counts, a "New trip" CTA, a
 * per-row delete confirm, and a footer button that opens a shareable
 * invite QR for the active group. Collapses to a 16px-wide icon-only
 * strip when the user wants more room for the chat.
 *
 * (TH) sidebar ซ้ายของหน้า `/trip` แสดงรายการกลุ่มทริปทุกกลุ่ม (icon +
 * ชื่อ + จำนวน) ปุ่ม "New trip", confirm ลบรายตัว, และ footer สำหรับเปิด QR
 * เชิญ ของกลุ่ม active บีบเป็นไอคอนเดียวได้เมื่อต้องการพื้นที่ให้แชทมากขึ้น
 */

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
import { Badge } from "@/components/ui/badge";
import { QRCode } from "@/components/common/qr-code";
import { cn } from "@/lib/utils";
import { useVibeStore } from "@/lib/store";
import type { TripGroup } from "@/lib/types";

/** Props — collapsed state is hoisted so the parent can layout properly. */
/** (TH) Props — state ว่าบีบหรือยังถูก hoist ออกไปให้ parent จัด layout */
interface GroupSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * The sidebar component. Holds local draft state for the "New trip"
 * dialog, but otherwise reads/writes through the Zustand store.
 *
 * (TH) คอมโพเนนต์ sidebar — ถือเฉพาะ state draft ของ dialog "New trip"
 * ที่เหลืออ่าน/เขียนผ่าน Zustand store
 */
export function GroupSidebar({ collapsed, onToggleCollapse }: GroupSidebarProps) {
  // Subscribe to the needed slices of the store.
  // subscribe เฉพาะ slice ที่ใช้
  const groups = useVibeStore((s) => s.groups);
  const activeGroupId = useVibeStore((s) => s.activeGroupId);
  const setActiveGroup = useVibeStore((s) => s.setActiveGroup);
  const createGroup = useVibeStore((s) => s.createGroup);
  const deleteGroup = useVibeStore((s) => s.deleteGroup);
  // Draft string for the "New trip" name input.
  // ค่า draft ของช่องชื่อทริปใหม่
  const [newName, setNewName] = React.useState("");

  return (
    // <aside> — width animates between collapsed and expanded.
    // <aside> — ความกว้างเปลี่ยนตามสถานะบีบ/ขยาย
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-border/60 bg-card/70 backdrop-blur-xl transition-all",
        collapsed ? "w-16" : "w-72"
      )}
    >
      {/* Sidebar header — heading + collapse toggle. */}
      {/* header sidebar — หัว + ปุ่มบีบ */}
      <div className="flex items-center justify-between p-3">
        {!collapsed && (
          /* Header text (hidden when collapsed). */
          /* หัวข้อ (ซ่อนตอนบีบ) */
          <div>
            {/* "Trips" caption. */}
            {/* คำว่า "Trips" */}
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Trips
            </div>
            {/* Active count. */}
            {/* จำนวนกลุ่ม */}
            <div className="text-sm font-semibold">{groups.length} active</div>
          </div>
        )}
        {/* Collapse toggle (chevron rotates 180° when collapsed). */}
        {/* ปุ่มบีบ — chevron หมุน 180° เมื่อบีบ */}
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

      {/* "New trip" CTA + dialog. */}
      {/* ปุ่ม "New trip" + dialog */}
      <div className="px-3">
        <Dialog>
          {/* Trigger — Button rendered via asChild. */}
          {/* trigger — Button render ผ่าน asChild */}
          <DialogTrigger asChild>
            <Button variant="accent" size="sm" className="w-full">
              <Plus className="h-4 w-4" />
              {!collapsed && <span>New trip</span>}
            </Button>
          </DialogTrigger>
          {/* Dialog body. */}
          {/* body ของ dialog */}
          <DialogContent className="max-w-sm">
            {/* Dialog header. */}
            {/* header dialog */}
            <DialogHeader>
              <DialogTitle>Start a new trip</DialogTitle>
              <DialogDescription>
                You can create as many trip groups as you like.
              </DialogDescription>
            </DialogHeader>
            {/* Name input — autoFocus for quick entry. */}
            {/* input ชื่อ — autoFocus เพื่อกรอกได้ทันที */}
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Trip name — e.g. Krabi Crew '26"
              autoFocus
            />
            {/* Submit button — disabled when name is empty. */}
            {/* ปุ่ม submit — disable เมื่อยังไม่กรอก */}
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

      {/* Group list — scrolls independently from the rest of the sidebar. */}
      {/* รายการกลุ่ม — scroll อิสระจากส่วนอื่นของ sidebar */}
      <nav className="mt-3 flex-1 space-y-1 overflow-y-auto px-2 pb-4 scrollbar-hide">
        {groups.map((g) => (
          /* One group row. */
          /* แถวกลุ่มหนึ่ง */
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
          /* Empty-state hint when there are no groups yet. */
          /* hint ตอนยังไม่มีกลุ่ม */
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

/** Props for one group row in the sidebar list. */
/** (TH) Props ของแถวกลุ่ม 1 อันใน sidebar */
interface GroupRowProps {
  group: TripGroup;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  onDelete: () => void;
}

/**
 * Render one trip row. The main button selects the group; a small
 * trash icon (shown on hover/focus) opens a confirm dialog for delete.
 *
 * (TH) แถวกลุ่ม 1 อัน — ปุ่มหลักเลือกกลุ่ม, ไอคอนถังขยะเล็ก ๆ ที่โผล่ตอน
 * hover/focus เปิด dialog confirm ลบ
 */
function GroupRow({ group, active, collapsed, onClick, onDelete }: GroupRowProps) {
  // Local controlled state for the confirm dialog.
  // state ของ confirm dialog (controlled)
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  return (
    // Outer wrapper that hosts the row + the absolutely-positioned delete button.
    // ตัวห่อภายนอก ใส่ทั้งแถวและปุ่มลบที่ position absolute
    <div className="group/row relative">
      {/* Main row button — selects this group. */}
      {/* ปุ่มแถวหลัก — เลือกกลุ่ม */}
      <button
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition-colors",
          active
            ? "bg-accent/15 text-foreground"
            : "text-muted-foreground hover:bg-secondary",
          // Right padding leaves room for the delete icon overlay.
          // padding ขวาเหลือพื้นที่ให้ไอคอนลบ
          !collapsed && "pr-9"
        )}
      >
        {/* Icon avatar — first two letters of name on a gradient tile. */}
        {/* avatar icon — 2 อักษรแรกของชื่อบนกระเบื้องไล่สี */}
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white">
          {group.name.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 2).toUpperCase() || "T"}
        </div>
        {!collapsed && (
          /* Text cluster (only when expanded). */
          /* กลุ่มข้อความ (เฉพาะตอนขยาย) */
          <div className="min-w-0 flex-1">
            {/* Group name (truncated). */}
            {/* ชื่อกลุ่ม (ตัดท้าย) */}
            <div className="truncate text-sm font-medium text-foreground">
              {group.name}
            </div>
            {/* Members + messages count line. */}
            {/* บรรทัด members + ข้อความ */}
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

      {!collapsed && (
        /* Delete confirm flow — wrapped in a Dialog. */
        /* flow confirm ลบ — ห่อด้วย Dialog */
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          {/* Trigger — visually-hidden until hover/focus. */}
          {/* trigger — ซ่อนจนกว่าจะ hover/focus */}
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label={`Delete ${group.name}`}
              onClick={(e) => {
                // Stop the click from bubbling to the row button.
                // กัน event ทะลุไปยังปุ่มแถวหลัก
                e.stopPropagation();
                setConfirmOpen(true);
              }}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-lg",
                "text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
                "opacity-0 focus:opacity-100 group-hover/row:opacity-100",
                // Touch devices have no hover, so show it dimmed by default.
                // อุปกรณ์สัมผัสไม่มี hover — โชว์แบบจาง ๆ ตลอด
                "[@media(hover:none)]:opacity-60"
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </DialogTrigger>
          {/* Confirm dialog content. */}
          {/* เนื้อหา dialog confirm */}
          <DialogContent className="max-w-sm">
            {/* Header with warning icon. */}
            {/* header พร้อมไอคอนเตือน */}
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete trip
              </DialogTitle>
              {/* Warning copy. */}
              {/* คำเตือน */}
              <DialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-semibold text-foreground">
                  {group.name}
                </span>
                ? This will permanently remove all chat messages, expenses, and
                shared places. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {/* Cancel + Delete buttons. */}
            {/* ปุ่ม Cancel + Delete */}
            <div className="flex gap-2">
              {/* Cancel — closes the dialog. */}
              {/* Cancel — ปิด dialog */}
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </Button>
              {/* Confirm — calls `onDelete` and closes. */}
              {/* ยืนยัน — เรียก onDelete แล้วปิด */}
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

// ─── Invite footer ───────────────────────────────────────────────────────────

/**
 * Bottom-of-sidebar invite block. Pulls the active group from the
 * store and renders a "Invite to ..." dialog with QR code + clipboard
 * copy. Returns null when there's no active group.
 *
 * (TH) บล็อก invite ด้านล่างสุดของ sidebar — ดึงกลุ่ม active จาก store
 * และเปิด dialog "Invite to ..." พร้อม QR + คัดลอกลิงก์ ถ้าไม่มีกลุ่ม
 * active จะ return null
 */
function SidebarInviteFooter() {
  const groups = useVibeStore((s) => s.groups);
  const activeGroupId = useVibeStore((s) => s.activeGroupId);
  const active = groups.find((g) => g.id === activeGroupId);
  if (!active) return null;
  // Build the invite URL — relative to current origin in the browser,
  // absolute fallback during SSR.
  // ประกอบ URL เชิญ — relative ต่อ origin ปัจจุบันในเบราว์เซอร์, absolute
  // เมื่อรันบน SSR
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/trip?invite=${active.inviteCode}`
      : `https://vibetrip.app/trip?invite=${active.inviteCode}`;

  return (
    // Footer wrapper with top border.
    // wrapper footer ที่มีเส้นบน
    <div className="border-t border-border/60 p-3">
      {/* Invite dialog. */}
      {/* dialog เชิญ */}
      <Dialog>
        {/* Trigger button. */}
        {/* ปุ่ม trigger */}
        <DialogTrigger asChild>
          <Button variant="glass" size="sm" className="w-full">
            <QrCode className="h-4 w-4" /> {`Invite to "${active.name}"`}
          </Button>
        </DialogTrigger>
        {/* Dialog content. */}
        {/* content dialog */}
        <DialogContent className="max-w-sm">
          {/* Header. */}
          {/* header */}
          <DialogHeader>
            <DialogTitle>Invite to {active.name}</DialogTitle>
            <DialogDescription>
              Scan the QR or share the code.
            </DialogDescription>
          </DialogHeader>
          {/* QR + URL info + copy button. */}
          {/* QR + ข้อมูล URL + ปุ่ม copy */}
          <div className="flex flex-col items-center gap-3">
            {/* QR with the invite code as label. */}
            {/* QR พร้อม label invite code */}
            <QRCode value={url} size={180} label={`Code: ${active.inviteCode}`} />
            {/* URL info card. */}
            {/* การ์ดข้อมูล URL */}
            <div className="w-full rounded-xl bg-secondary/40 px-3 py-2 text-xs">
              {/* Members badge. */}
              {/* badge สมาชิก */}
              <Badge variant="accent" className="mb-1">
                <Users className="h-3 w-3" /> {active.members.length} member
                {active.members.length === 1 ? "" : "s"}
              </Badge>
              {/* URL line (truncated). */}
              {/* บรรทัด URL (ตัดท้าย) */}
              <div className="truncate font-mono">{url}</div>
            </div>
            {/* Copy button. */}
            {/* ปุ่ม copy */}
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
