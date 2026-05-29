/**
 * @file `<ChatInterface>` — the centerpiece of the `/trip` page. Owns
 * the header (group name, member strip, invite button), the message
 * list (text, system, poll, place-card bubbles), and the input bar
 * (text + poll composer toggle).
 *
 * Routes messages either to Supabase realtime (when configured) or to
 * the local Zustand store — see `useChatRealtime`.
 *
 * (TH) คอมโพเนนต์หลักของหน้า `/trip` ดูแล header (ชื่อกลุ่ม + แถว
 * avatar + ปุ่ม invite), list ข้อความ (text/system/poll/place), และ
 * แถบ input ส่งข้อความผ่าน Supabase realtime ถ้าเปิด ไม่งั้นใช้ Zustand
 */

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
import { useChatRealtime } from "@/hooks/use-chat-realtime";
import type { PlaceCard, TripGroup, User } from "@/lib/types";

/** Props — parent controls the expense rail visibility. */
/** (TH) Props — parent คุมการแสดง/ซ่อนแผงรายจ่าย */
interface ChatInterfaceProps {
  group: TripGroup;
  user: User;
  onToggleExpense: () => void;
  expenseOpen: boolean;
}

/**
 * The chat panel. Combines local-store messages with the realtime
 * stream (when enabled) into one chronological list and auto-scrolls
 * to the bottom on new messages.
 *
 * (TH) แผงแชท — รวมข้อความจาก store + realtime (ถ้าเปิด) ให้เป็น list
 * ตามเวลา และเลื่อนลงล่างอัตโนมัติเมื่อมีข้อความใหม่
 */
export function ChatInterface({
  group,
  user,
  onToggleExpense,
  expenseOpen,
}: ChatInterfaceProps) {
  // Store actions.
  // action ของ store
  const addMessage = useVibeStore((s) => s.addMessage);
  const addPoll = useVibeStore((s) => s.addPoll);
  // Local UI state.
  // state ของ UI
  const [draft, setDraft] = React.useState("");
  const [showPoll, setShowPoll] = React.useState(false);
  // Ref to the scroll container for auto-scroll on new messages.
  // ref ของ scroll container เพื่อ auto-scroll เมื่อมีข้อความใหม่
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Pre-compute user name so the realtime hook doesn't rebuild it.
  // ประกอบชื่อผู้ใช้ไว้ก่อนเพื่อไม่ให้ฮุก realtime ต้องสร้างใหม่
  const userName = `${user.firstName} ${user.lastName}`;
  // Realtime chat subscription (no-op when Supabase env isn't configured).
  // ฮุก realtime — no-op เมื่อยังไม่ตั้งค่า env Supabase
  const { messages: rtMessages, status: rtStatus, sendMessage: rtSend, enabled: rtEnabled } =
    useChatRealtime(group.id, user.id, userName, user.avatarDataUrl);

  // Merge local + realtime, de-dup by ID, sort by createdAt.
  // รวม local + realtime, dedupe ด้วย id, แล้วเรียงตาม createdAt
  const allMessages = React.useMemo(() => {
    if (!rtEnabled) return group.messages;
    const map = new Map<string, (typeof group.messages)[0]>();
    for (const m of group.messages) map.set(m.id, m);
    for (const m of rtMessages) map.set(m.id, m);
    return [...map.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [rtEnabled, group, rtMessages]);

  // Auto-scroll to bottom whenever a new message arrives.
  // เลื่อนลงล่างทุกครั้งที่มีข้อความใหม่
  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [allMessages.length]);

  /**
   * Send the typed message. Prefers realtime over local when both
   * are available and connected.
   *
   * (TH) ส่งข้อความที่พิมพ์ — ใช้ realtime ก่อนถ้าเปิดและ connected,
   * ไม่งั้นใช้ store
   */
  const send = () => {
    const text = draft.trim();
    if (!text) return;
    if (rtEnabled && rtStatus === "connected") {
      void rtSend(text, "text");
    } else {
      addMessage(group.id, {
        authorId: user.id,
        authorName: userName,
        authorAvatar: user.avatarDataUrl,
        content: text,
        kind: "text",
      });
    }
    setDraft("");
  };

  // Build the invite URL (SSR-safe fallback).
  // ประกอบ URL เชิญ (มี fallback สำหรับ SSR)
  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/trip?invite=${group.inviteCode}`
      : `https://vibetrip.app/trip?invite=${group.inviteCode}`;

  return (
    // Section column — header, scrollable message list, footer.
    // คอลัมน์ section — header, list ข้อความ, footer
    <section className="flex h-full min-h-0 flex-1 flex-col">
      {/* Chat header — group name/members + invite + expense buttons. */}
      {/* header — ชื่อกลุ่ม/สมาชิก + ปุ่ม invite + ปุ่ม expense */}
      <header className="flex items-center justify-between gap-2 border-b border-border/60 bg-card/60 px-4 py-3 backdrop-blur-xl">
        {/* Left cluster — title row + member strip. */}
        {/* กลุ่มซ้าย — แถว title + แถว avatar */}
        <div className="min-w-0 flex-1">
          {/* Title row — name + members badge + (optional) realtime dot. */}
          {/* แถว title — ชื่อ + badge สมาชิก + (ถ้ามี) จุด realtime */}
          <div className="flex items-center gap-2">
            {/* Group title. */}
            {/* ชื่อกลุ่ม */}
            <h2 className="truncate text-lg font-semibold tracking-tight">
              {group.name}
            </h2>
            {/* Members badge. */}
            {/* badge สมาชิก */}
            <Badge variant="secondary" className="shrink-0">
              <Users className="h-3 w-3" /> {group.members.length}
            </Badge>
            {rtEnabled && (
              /* Realtime status dot — green/yellow/red. */
              /* จุดสถานะ realtime — เขียว/เหลือง/แดง */
              <span
                title={
                  rtStatus === "connected"
                    ? "Live"
                    : rtStatus === "connecting"
                    ? "Connecting…"
                    : "Offline"
                }
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  rtStatus === "connected" && "bg-green-500",
                  rtStatus === "connecting" && "animate-pulse bg-yellow-400",
                  rtStatus === "error" && "bg-red-500"
                )}
              />
            )}
          </div>

          {group.members.length > 0 && (
            /* Member avatar strip + invite code. */
            /* แถว avatar สมาชิก + invite code */
            <div className="mt-1 flex items-center gap-1">
              {/* Overlapping avatars (first 5). */}
              {/* avatar ซ้อนกัน (5 อันแรก) */}
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
                /* "+N" overflow indicator. */
                /* "+N" บอกว่ามีอีก */
                <span className="text-[11px] text-muted-foreground">
                  +{group.members.length - 5}
                </span>
              )}
              {/* "· code XXXX" caption. */}
              {/* คำว่า "· code XXXX" */}
              <span className="ml-1 text-[11px] text-muted-foreground">
                · code <span className="font-mono">{group.inviteCode}</span>
              </span>
            </div>
          )}
        </div>

        {/* Right cluster — Invite + Expenses buttons. */}
        {/* กลุ่มขวา — ปุ่ม Invite + Expenses */}
        <div className="flex shrink-0 items-center gap-1.5">
          {/* Invite dialog. */}
          {/* dialog เชิญ */}
          <Dialog>
            {/* Invite button trigger. */}
            {/* ปุ่มเชิญ */}
            <DialogTrigger asChild>
              <Button variant="glass" size="sm" aria-label="Invite members">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Invite</span>
              </Button>
            </DialogTrigger>
            {/* Dialog content. */}
            {/* เนื้อ dialog */}
            <DialogContent className="max-w-sm">
              {/* Header. */}
              {/* header */}
              <DialogHeader>
                <DialogTitle>Invite to {group.name}</DialogTitle>
                <DialogDescription>
                  Share the QR code or link with friends.
                </DialogDescription>
              </DialogHeader>
              {/* Body — QR + info + copy button. */}
              {/* body — QR + ข้อมูล + ปุ่ม copy */}
              <div className="flex flex-col items-center gap-3">
                {/* QR with code label. */}
                {/* QR + label */}
                <QRCode value={inviteUrl} size={180} label={`Code: ${group.inviteCode}`} />
                {/* URL info card. */}
                {/* การ์ดข้อมูล URL */}
                <div className="w-full rounded-xl bg-secondary/40 px-3 py-2 text-xs">
                  {/* Members header. */}
                  {/* แถวสมาชิก */}
                  <div className="mb-1 flex items-center gap-1 text-muted-foreground">
                    <Users className="h-3 w-3" /> {group.members.length} member
                    {group.members.length === 1 ? "" : "s"}
                  </div>
                  {/* URL (truncated, mono). */}
                  {/* URL (ตัดท้าย, mono) */}
                  <div className="truncate font-mono text-foreground">
                    {inviteUrl}
                  </div>
                </div>
                {/* Copy button. */}
                {/* ปุ่ม copy */}
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

          {/* Toggle button for the expense rail (active state changes variant). */}
          {/* ปุ่ม toggle แผงรายจ่าย — variant เปลี่ยนตาม state */}
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

      {/* Scrollable message list. */}
      {/* list ข้อความที่ scroll ได้ */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6 scrollbar-hide"
      >
        {allMessages.length === 0 && (
          /* Empty-chat welcome panel. */
          /* panel ต้อนรับเมื่อยังไม่มีข้อความ */
          <div className="mx-auto max-w-md rounded-3xl border border-dashed border-border/60 bg-card/60 p-6 text-center backdrop-blur-xl">
            {/* Sparkle icon. */}
            {/* ไอคอนประกาย */}
            <Sparkles className="mx-auto h-6 w-6 text-accent" />
            {/* Welcome heading. */}
            {/* หัวข้อต้อนรับ */}
            <h3 className="mt-2 text-sm font-semibold">
              Welcome to {group.name}!
            </h3>
            {/* Helper copy. */}
            {/* คำแนะนำ */}
            <p className="mt-1 text-xs text-muted-foreground">
              Say hi, drop a poll, share a destination, or set a budget to get
              the trip rolling.
            </p>
          </div>
        )}

        {allMessages.map((m) => {
          // True when the message author is the current user — controls bubble side.
          // จริงเมื่อผู้เขียนคือผู้ใช้ปัจจุบัน — คุมว่าฟองอยู่ฝั่งไหน
          const isMine = m.authorId === user.id;

          if (m.kind === "poll" && m.pollId) {
            /* Poll message — render the embedded poll card. */
            /* ข้อความ poll — render PollCard */
            const poll = group.polls.find((p) => p.id === m.pollId);
            if (!poll) return null;
            return (
              <div key={m.id} className="mx-auto max-w-lg">
                <PollCard poll={poll} userId={user.id} />
              </div>
            );
          }

          if (m.authorId === "system") {
            /* System message — centered pill. */
            /* ข้อความ system — pill กลาง */
            return (
              <div key={m.id} className="text-center">
                <span className="rounded-full bg-secondary/60 px-3 py-1 text-[11px] text-muted-foreground">
                  {m.content}
                </span>
              </div>
            );
          }

          if (m.kind === "place" && m.placeCard) {
            /* Place-card message bubble. */
            /* ฟองแสดง PlaceCard */
            return (
              <div
                key={m.id}
                className={cn("flex items-end gap-2", isMine && "flex-row-reverse")}
              >
                {/* Author avatar. */}
                {/* avatar ผู้เขียน */}
                <Avatar className="h-7 w-7 shrink-0">
                  {m.authorAvatar && (
                    <AvatarImage src={m.authorAvatar} alt={m.authorName} />
                  )}
                  <AvatarFallback className="text-[10px]">
                    {m.authorName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Bubble body — limited width. */}
                {/* body ฟอง — ความกว้างจำกัด */}
                <div className="max-w-[78%]">
                  {!isMine && (
                    /* Author name (only for others' messages). */
                    /* ชื่อผู้เขียน (เฉพาะข้อความของคนอื่น) */
                    <div className="mb-0.5 text-[11px] font-medium text-muted-foreground">
                      {m.authorName}
                    </div>
                  )}
                  {/* Embedded place card. */}
                  {/* PlaceCard ฝังใน bubble */}
                  <PlaceCardBubble placeCard={m.placeCard} content={m.content} isMine={isMine} />
                  {/* Timestamp under the bubble. */}
                  {/* timestamp ใต้ bubble */}
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

          /* Default — text bubble. */
          /* default — ฟองข้อความ */
          return (
            <div
              key={m.id}
              className={cn("flex items-end gap-2", isMine && "flex-row-reverse")}
            >
              {/* Author avatar. */}
              {/* avatar ผู้เขียน */}
              <Avatar className="h-7 w-7 shrink-0">
                {m.authorAvatar && (
                  <AvatarImage src={m.authorAvatar} alt={m.authorName} />
                )}
                <AvatarFallback className="text-[10px]">
                  {m.authorName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Bubble content. */}
              {/* เนื้อใน bubble */}
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                  isMine
                    ? "rounded-br-md bg-accent text-accent-foreground"
                    : "rounded-bl-md border border-border/60 bg-card"
                )}
              >
                {!isMine && (
                  /* Author name (only for others). */
                  /* ชื่อผู้เขียน (เฉพาะคนอื่น) */
                  <div className="mb-0.5 text-[11px] font-medium text-muted-foreground">
                    {m.authorName}
                  </div>
                )}
                {/* Body text. */}
                {/* ข้อความ */}
                <div className="whitespace-pre-wrap leading-snug">{m.content}</div>
                {/* Timestamp inside the bubble. */}
                {/* timestamp ใน bubble */}
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
          /* Poll composer — opens above the input bar. */
          /* PollComposer — โผล่เหนือ input bar */
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

      {/* Bottom input bar. */}
      {/* แถบ input ล่าง */}
      <footer className="border-t border-border/60 bg-card/60 p-3 backdrop-blur-xl">
        {/* Input row — poll toggle + text + send. */}
        {/* แถว input — toggle poll + ข้อความ + ส่ง */}
        <div className="flex items-center gap-2">
          {/* Poll toggle button — active style when composer is open. */}
          {/* ปุ่ม toggle poll — style active เมื่อ composer เปิด */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPoll((v) => !v)}
            aria-label="Create poll"
            className={cn(showPoll && "bg-accent/15 text-accent")}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          {/* Text input pill. */}
          {/* pill input ข้อความ */}
          <div className="flex flex-1 items-center gap-2 rounded-full border border-border/60 bg-background/50 px-3">
            {/* The actual text input. */}
            {/* input จริง */}
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                // Enter sends, Shift+Enter is allowed for newline future-proofing.
                // Enter = ส่ง, Shift+Enter เก็บไว้ใช้ขึ้นบรรทัดใหม่
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={`Message ${group.name}…`}
              className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground/70"
            />
            {/* Smile icon (decorative — no emoji picker yet). */}
            {/* ไอคอน smile (ตกแต่ง ยังไม่มี emoji picker) */}
            <Smile className="h-4 w-4 text-muted-foreground" />
          </div>
          {/* Send button. */}
          {/* ปุ่มส่ง */}
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

/**
 * Inline place-card rendered inside a chat bubble. Always 64-wide
 * so layouts stay consistent in narrow chat columns.
 *
 * (TH) Place card ใน bubble — กว้างคงที่ 64 เพื่อ layout ใน chat แคบ
 */
function PlaceCardBubble({
  placeCard,
  content,
  isMine,
}: {
  placeCard: PlaceCard;
  content: string;
  isMine: boolean;
}) {
  // Show a caption sub-bubble only when content differs from the place name.
  // โชว์ฟอง caption ก็ต่อเมื่อ content ต่างจากชื่อสถานที่
  const hasCaption = content && content !== placeCard.name;

  return (
    // Vertical stack — card on top, optional caption below.
    // คอลัมน์ — การ์ดบน, caption ล่าง (ถ้ามี)
    <div className="space-y-1">
      {/* The card itself. */}
      {/* การ์ดจริง */}
      <div className="w-64 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        {/* Hero image. */}
        {/* รูปหลัก */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={placeCard.imageUrl}
          alt={placeCard.name}
          className="h-32 w-full object-cover"
        />
        {/* Body. */}
        {/* body */}
        <div className="space-y-1.5 p-3">
          {/* Top row — title/subtitle + optional rating. */}
          {/* แถวบน — title/subtitle + rating (ถ้ามี) */}
          <div className="flex items-start justify-between gap-2">
            {/* Title + subtitle. */}
            {/* title + subtitle */}
            <div className="min-w-0">
              {/* Place name. */}
              {/* ชื่อสถานที่ */}
              <div className="truncate text-sm font-semibold leading-snug">
                {placeCard.name}
              </div>
              {/* Subtitle with pin icon. */}
              {/* subtitle พร้อมไอคอนหมุด */}
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="line-clamp-1">{placeCard.subtitle}</span>
              </div>
            </div>
            {placeCard.rating != null && (
              /* Rating chip. */
              /* chip คะแนน */
              <span className="flex shrink-0 items-center gap-0.5 text-xs font-medium">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {placeCard.rating}
              </span>
            )}
          </div>
          {placeCard.price != null && (
            /* Price line (when present). */
            /* บรรทัดราคา (ถ้ามี) */
            <div className="text-xs font-medium text-accent">
              {formatCurrency(placeCard.price)} / night
            </div>
          )}
          {/* Type badge. */}
          {/* badge ประเภท */}
          <Badge variant="secondary" className="text-[10px]">
            {placeCard.type === "accommodation" ? "🏨 Stay" : "🗺️ Destination"}
          </Badge>
        </div>
      </div>

      {hasCaption && (
        /* Caption sub-bubble. */
        /* sub-bubble caption */
        <div
          className={cn(
            "w-64 rounded-2xl px-3.5 py-2 text-sm shadow-sm",
            isMine
              ? "rounded-br-md bg-accent text-accent-foreground"
              : "rounded-bl-md border border-border/60 bg-card"
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
