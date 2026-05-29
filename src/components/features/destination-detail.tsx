/**
 * @file `<DestinationDetail>` — popup dialog opened when a user taps
 * a destination card (from the seasonal carousel or search results).
 * Shows: hero image, tags, price/season badges, lat/lng + Maps link,
 * up to 3 nearby stays, and CTAs (Share to Chat, Plan this trip).
 *
 * (TH) Dialog แสดงรายละเอียดจุดหมายเมื่อกดการ์ด — โชว์รูปหลัก, แท็ก, badge
 * ราคา/ฤดู, พิกัด + ลิงก์ Maps, ที่พักใกล้เคียง 3 รายการ และปุ่ม CTA
 * (Share to Chat, Plan this trip)
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  MapPin,
  MessageSquare,
  Navigation,
  Sparkles,
  Star,
  Tag,
  BedDouble,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ACCOMMODATIONS, PREFERENCE_META } from "@/lib/mock-data";
import { useVibeStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import type { Destination } from "@/lib/types";

/**
 * Props for `<DestinationDetail>`. `destination` may be `null` (closed
 * state). `onSelectStay` lets the caller bridge into the accommodation
 * detail dialog when a stay tile is clicked.
 *
 * (TH) Props: `destination` อาจเป็น null (ยังไม่เปิด); `onSelectStay`
 * ใช้ส่งต่อให้ caller เปิด accommodation detail เมื่อกด tile ที่พัก
 */
interface DestinationDetailProps {
  destination: Destination | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelectStay?: (accommodationId: string) => void;
}

/**
 * Price-level → "฿"/"฿฿"/"฿฿฿" mapping. Index 0 is unused (priceLevel
 * is 1..3) but kept for clarity.
 *
 * (TH) Mapping price-level → "฿".."฿฿฿" — index 0 ไม่ได้ใช้ (priceLevel
 * เริ่มที่ 1) แต่เก็บไว้เพื่อความชัดเจน
 */
const PRICE_SYMBOLS = ["", "฿", "฿฿", "฿฿฿"] as const;
/** Season → label. */
/** (TH) season → label ภาษาอังกฤษ */
const SEASON_LABELS: Record<string, string> = {
  spring: "Spring",
  summer: "Summer",
  autumn: "Autumn",
  winter: "Winter",
  all: "Year-round",
};

/**
 * Render the destination detail dialog. Looks up nearby stays from
 * the static `ACCOMMODATIONS` list and wires share-to-chat into the
 * active group.
 *
 * (TH) แสดง dialog รายละเอียด destination — หาที่พักจาก `ACCOMMODATIONS`
 * และเชื่อม share-to-chat กับกลุ่ม active
 */
export function DestinationDetail({
  destination,
  open,
  onOpenChange,
  onSelectStay,
}: DestinationDetailProps) {
  const router = useRouter();
  // Brief "Shared!" confirmation after sharing.
  // ธง "Shared!" สั้น ๆ หลังกด share
  const [shared, setShared] = React.useState(false);

  // Store accessors for the share-to-chat flow.
  // accessor ของ store สำหรับ flow share-to-chat
  const activeGroupId = useVibeStore((s) => s.activeGroupId);
  const groups = useVibeStore((s) => s.groups);
  const addMessage = useVibeStore((s) => s.addMessage);
  const user = useVibeStore((s) => s.user);
  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? groups[0] ?? null;

  // Up to 3 stays for this destination, memoized on destination id.
  // ที่พักไม่เกิน 3 รายการของ destination นี้ — memo ตาม id
  const stays = React.useMemo(
    () => ACCOMMODATIONS.filter((a) => a.destinationId === destination?.id).slice(0, 3),
    [destination?.id]
  );

  // Bail out when there's no destination to show.
  // ออกก่อนเลยถ้าไม่มี destination
  if (!destination) return null;

  // Deep link to Google Maps with the destination's lat/lng.
  // deep link ของ Google Maps พร้อมพิกัด
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${destination.coords.lat},${destination.coords.lng}`;
  // Preference metadata for the trip type chip.
  // metadata ของ preference เพื่อแสดง chip trip type
  const prefMeta = PREFERENCE_META[destination.tripType];

  /** Share this destination into the active group's chat. */
  /** (TH) แชร์ destination นี้เข้าแชทกลุ่ม active */
  const shareToChat = () => {
    if (!activeGroup || !user) return;
    addMessage(activeGroup.id, {
      authorId: user.id,
      authorName: `${user.firstName} ${user.lastName}`,
      authorAvatar: user.avatarDataUrl,
      content: `${destination.title}, ${destination.region}`,
      kind: "place",
      placeCard: {
        type: "destination",
        id: destination.id,
        name: `${destination.title}, ${destination.region}`,
        imageUrl: destination.imageUrl,
        subtitle: destination.tags.join(" · "),
      },
    });
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    // Radix Dialog wrapper.
    // ตัวห่อ Radix Dialog
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Dialog content — no padding so the hero image hits the edges. */}
      {/* เนื้อ dialog — ไม่มี padding ให้รูปหลักชนขอบ */}
      <DialogContent className="max-w-2xl p-0">
        {/* Hero image area. */}
        {/* ส่วนรูปหลัก */}
        <div className="relative h-52 w-full overflow-hidden rounded-t-3xl sm:h-64">
          {/* Background photo. */}
          {/* รูปพื้นหลัง */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={destination.imageUrl}
            alt={destination.title}
            className="h-full w-full object-cover"
          />
          {/* Dark gradient overlay. */}
          {/* ไล่สีดำทับ */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          {/* Top-left tag badges (up to 2). */}
          {/* badge แท็กมุมซ้ายบน (สูงสุด 2) */}
          <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
            {destination.tags.slice(0, 2).map((t) => (
              <Badge key={t} variant="secondary" className="border-white/20 bg-white/15 text-white backdrop-blur">
                {t}
              </Badge>
            ))}
          </div>
          {/* Bottom-left title overlay. */}
          {/* overlay ข้อความล่างซ้าย */}
          <div className="absolute inset-x-4 bottom-4 text-white">
            {/* DialogHeader for a11y wiring. */}
            {/* DialogHeader เพื่อให้ a11y ผูกค่าให้ */}
            <DialogHeader className="space-y-1 text-left">
              {/* Destination title. */}
              {/* ชื่อ destination */}
              <DialogTitle className="text-2xl font-semibold tracking-tight drop-shadow">
                {destination.title}
              </DialogTitle>
              {/* Region subtitle with pin icon. */}
              {/* subtitle region พร้อมไอคอนหมุด */}
              <DialogDescription className="text-white/80">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {destination.region}
                </span>
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* Body container. */}
        {/* container body */}
        <div className="space-y-4 p-5 sm:p-6">
          {/* Badge row — trip type + price level + season. */}
          {/* แถว badge — trip type + ระดับราคา + ฤดู */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Trip type chip. */}
            {/* chip trip type */}
            <Badge variant="secondary">
              <Tag className="h-3 w-3" /> {prefMeta.label}
            </Badge>
            {/* Price level chip. */}
            {/* chip ระดับราคา */}
            <Badge variant="secondary">{PRICE_SYMBOLS[destination.priceLevel]}</Badge>
            {/* Best season chip. */}
            {/* chip ฤดูแนะนำ */}
            <Badge variant="secondary">
              <Sparkles className="h-3 w-3" /> Best in {SEASON_LABELS[destination.season]}
            </Badge>
          </div>

          {/* Coordinates + Maps link line. */}
          {/* บรรทัดพิกัด + ลิงก์ Maps */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {/* Navigation icon. */}
            {/* ไอคอน navigation */}
            <Navigation className="h-3.5 w-3.5" />
            {destination.coords.lat.toFixed(4)}°, {destination.coords.lng.toFixed(4)}°
            {/* Maps link. */}
            {/* ลิงก์ Maps */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-1 text-accent hover:underline"
            >
              Open in Maps ↗
            </a>
          </div>

          {stays.length > 0 && (
            /* Nearby stays section (only when stays exist for this destination). */
            /* section ที่พัก (แสดงเฉพาะเมื่อมีที่พักของจุดหมายนี้) */
            <div>
              {/* Section caption. */}
              {/* คำว่า Available stays */}
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <BedDouble className="h-3.5 w-3.5" /> Available stays
              </div>
              {/* Stays grid (1/2/3 cols by breakpoint). */}
              {/* กริดที่พัก (1/2/3 คอลัมน์ตามจอ) */}
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {stays.map((a) => (
                  /* One stay tile. */
                  /* tile ที่พักหนึ่ง */
                  <button
                    key={a.id}
                    onClick={() => {
                      if (onSelectStay) {
                        onOpenChange(false);
                        onSelectStay(a.id);
                      }
                    }}
                    className="overflow-hidden rounded-2xl border border-border/60 bg-secondary/30 text-left transition-colors hover:border-accent/50 hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none"
                    disabled={!onSelectStay}
                  >
                    {/* Stay thumbnail. */}
                    {/* รูป thumbnail ของที่พัก */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.imageUrl}
                      alt={a.name}
                      className="h-20 w-full object-cover"
                    />
                    {/* Tile body. */}
                    {/* body ของ tile */}
                    <div className="p-2">
                      {/* Top row — name + rating star. */}
                      {/* แถวบน — ชื่อ + ดาวคะแนน */}
                      <div className="flex items-center justify-between">
                        {/* Stay name (truncated). */}
                        {/* ชื่อที่พัก (ตัดท้ายถ้ายาว) */}
                        <span className="truncate text-xs font-semibold">{a.name}</span>
                        {/* Star + rating. */}
                        {/* ดาว + คะแนน */}
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {a.rating}
                        </span>
                      </div>
                      {/* Price per night. */}
                      {/* ราคาต่อคืน */}
                      <div className="text-[11px] text-muted-foreground">
                        {formatCurrency(a.pricePerNight)}/night
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer CTAs. */}
          {/* ปุ่ม CTA ล่าง */}
          <div className="flex flex-wrap gap-2 pt-1">
            {activeGroup && (
              /* Share-to-chat button (only when a group is active). */
              /* ปุ่ม share-to-chat — มีเฉพาะเมื่อมีกลุ่ม active */
              <Button variant="glass" size="sm" onClick={shareToChat} className="flex-1 sm:flex-none">
                {shared ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Shared!
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-3.5 w-3.5" /> Share to Chat
                  </>
                )}
              </Button>
            )}
            {/* "Plan this trip" — closes the dialog and routes to /trip. */}
            {/* ปุ่ม "Plan this trip" — ปิด dialog แล้วไป /trip */}
            <Button
              variant="accent"
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                router.push("/trip");
              }}
            >
              <Navigation className="h-4 w-4" /> Plan this trip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
