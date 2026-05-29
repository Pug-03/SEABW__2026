/**
 * @file `<AccommodationDetail>` — full-screen-ish dialog showing rich
 * info for one accommodation: hero image with gallery thumbnails,
 * description, address with copy + Maps link, stay info
 * (check-in/check-out + cancellation), amenity chips, and the price
 * + 3 action buttons (Share to Chat / Directions / Book Now).
 *
 * (TH) Dialog แสดงรายละเอียดที่พักหนึ่งแห่งแบบเต็มจอ: รูปหลัก + แกลเลอรี
 * thumbnail, คำอธิบาย, ที่อยู่พร้อมปุ่ม copy + ลิงก์ Maps, ข้อมูลเข้า/ออก
 * และนโยบายยกเลิก, chip amenities, ราคา และ 3 ปุ่มแอ็คชัน (Share to Chat
 * / Directions / Book Now)
 */

"use client";

import * as React from "react";
import {
  BedDouble,
  Calendar,
  Check,
  Copy,
  ExternalLink,
  Info,
  LogOut,
  MapPin,
  MessageSquare,
  Navigation,
  Sparkles,
  Star,
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
import { cn, formatCurrency, haversineDistanceKm } from "@/lib/utils";
import { DESTINATIONS } from "@/lib/mock-data";
import { useVibeStore } from "@/lib/store";
import type { Accommodation, GeoCoords, Preference } from "@/lib/types";

/**
 * Props for `<AccommodationDetail>`. `accommodation` may be `null`
 * (closed state — the dialog renders nothing). `withinBudget` and
 * `matchedPreferences` drive the AI/budget badges.
 *
 * (TH) Props: `accommodation` อาจเป็น null (ตอนยังไม่เปิด — render
 * nothing), `withinBudget` และ `matchedPreferences` คุม badge AI/งบ
 */
interface AccommodationDetailProps {
  accommodation: Accommodation | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  origin?: GeoCoords | null;
  matchedPreferences?: Preference[];
  withinBudget?: boolean;
}

/**
 * The accommodation detail dialog. Wires the share-to-chat flow into
 * the active trip group and handles clipboard + Maps deep links.
 *
 * (TH) Dialog รายละเอียดที่พัก — เชื่อมการแชร์เข้ากลุ่มทริปและจัดการ
 * clipboard / ลิงก์ Maps
 */
export function AccommodationDetail({
  accommodation,
  open,
  onOpenChange,
  origin,
  matchedPreferences = [],
  withinBudget = true,
}: AccommodationDetailProps) {
  // Which gallery image is shown as the hero. Defaults to main image.
  // ภาพหลักที่กำลังโชว์ — default คือรูปหลัก
  const [activeImage, setActiveImage] = React.useState<string | null>(null);
  // Briefly true after a successful address copy.
  // เป็น true สั้น ๆ หลังคัดลอกที่อยู่
  const [copied, setCopied] = React.useState(false);
  // Briefly true after sharing to chat (UI confirmation).
  // เป็น true สั้น ๆ หลัง share ไปแชท
  const [shared, setShared] = React.useState(false);

  // Pull a handful of values from the store for the share-to-chat flow.
  // ดึงค่าจาก store สำหรับ flow share-to-chat
  const activeGroupId = useVibeStore((s) => s.activeGroupId);
  const groups = useVibeStore((s) => s.groups);
  const addMessage = useVibeStore((s) => s.addMessage);
  const user = useVibeStore((s) => s.user);
  // Pick the active group, falling back to the first one available.
  // เลือกกลุ่ม active หรือกลุ่มแรกถ้าไม่มี active
  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? groups[0] ?? null;

  // Reset gallery + copied state whenever the accommodation changes.
  // รีเซ็ตรูปหลัก + ธง copied เมื่อ accommodation เปลี่ยน
  React.useEffect(() => {
    if (accommodation) setActiveImage(accommodation.imageUrl);
    setCopied(false);
  }, [accommodation]);

  // Bail out early when there's no accommodation to show.
  // ออกก่อนเลยถ้าไม่มี accommodation
  if (!accommodation) return null;

  // Look up the destination so we can show "<Destination>, <Region>".
  // หา destination เพื่อโชว์ "<Destination>, <Region>"
  const destination = DESTINATIONS.find(
    (d) => d.id === accommodation.destinationId
  );
  // Distance from the user's current location (if known).
  // ระยะจากตำแหน่งผู้ใช้ (ถ้ารู้)
  const distanceFromYou = origin
    ? Math.round(haversineDistanceKm(origin, accommodation.coords))
    : null;
  // Google Maps deep link with the lat/lng.
  // ลิงก์ deep ของ Google Maps
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${accommodation.coords.lat},${accommodation.coords.lng}`;

  /** Copy the address and briefly flip `copied` for visual feedback. */
  /** (TH) คัดลอกที่อยู่และสลับธง copied ชั่วคราว */
  const copyAddress = async () => {
    await navigator.clipboard.writeText(accommodation.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  /**
   * Share this accommodation into the active group's chat as a
   * `PlaceCard` message. No-op when there's no active group or user.
   *
   * (TH) แชร์ที่พักนี้เข้าแชทกลุ่ม active เป็นข้อความแบบ `PlaceCard`
   * — ถ้าไม่มีกลุ่ม active หรือผู้ใช้ จะ no-op
   */
  const shareToChat = () => {
    if (!activeGroup || !user) return;
    addMessage(activeGroup.id, {
      authorId: user.id,
      authorName: `${user.firstName} ${user.lastName}`,
      authorAvatar: user.avatarDataUrl,
      content: accommodation.name,
      kind: "place",
      placeCard: {
        type: "accommodation",
        id: accommodation.id,
        name: accommodation.name,
        imageUrl: accommodation.imageUrl,
        subtitle: accommodation.address,
        price: accommodation.pricePerNight,
        rating: accommodation.rating,
      },
    });
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    // Radix Dialog (controlled).
    // Radix Dialog แบบ controlled
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Dialog content — wider than default; no internal padding. */}
      {/* เนื้อ dialog — กว้างกว่า default และไม่มี padding ภายใน */}
      <DialogContent className="max-w-3xl p-0">
        {/* Hero image area with badges + overlay title. */}
        {/* ส่วนรูปหลักพร้อม badge + ข้อความ overlay */}
        <div className="relative h-56 w-full overflow-hidden rounded-t-3xl sm:h-64">
          {/* The active hero image. */}
          {/* รูปหลักที่กำลังโชว์ */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeImage ?? accommodation.imageUrl}
            alt={accommodation.name}
            className="h-full w-full object-cover"
          />
          {/* Dark gradient overlay for legibility. */}
          {/* ไล่สีดำเพื่อให้ข้อความอ่านได้ */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          {/* Top-left badge cluster — AI recommended + over-budget warning. */}
          {/* มุมซ้ายบน — badge AI + เตือนเกินงบ */}
          <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
            {matchedPreferences.length > 0 && (
              <Badge variant="ai">
                <Sparkles className="h-3 w-3" /> AI Recommended
              </Badge>
            )}
            {!withinBudget && <Badge variant="warning">Over budget</Badge>}
          </div>
          {/* Top-right rating chip. */}
          {/* มุมขวาบน — chip คะแนน */}
          <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white">
            {/* Star icon. */}
            {/* ไอคอนดาว */}
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {accommodation.rating}
            <span className="opacity-70">
              · {accommodation.reviewCount.toLocaleString()} reviews
            </span>
          </div>
          {/* Bottom-left text overlay — title + region. */}
          {/* overlay ข้อความล่างซ้าย — ชื่อ + region */}
          <div className="absolute inset-x-4 bottom-4 text-white">
            {/* Use the Dialog header here so a11y wiring (aria-labelledby) hooks up. */}
            {/* ใช้ DialogHeader ที่นี่เพื่อให้ Radix ผูก aria-labelledby ให้ */}
            <DialogHeader className="space-y-1 text-left">
              {/* Title. */}
              {/* ชื่อ */}
              <DialogTitle className="text-2xl font-semibold tracking-tight drop-shadow">
                {accommodation.name}
              </DialogTitle>
              {/* Subtitle — destination/region. */}
              {/* subtitle — destination/region */}
              <DialogDescription className="text-white/80">
                <span className="inline-flex items-center gap-1">
                  {/* Pin icon. */}
                  {/* ไอคอนหมุด */}
                  <MapPin className="h-3.5 w-3.5" />
                  {destination
                    ? `${destination.title}, ${destination.region}`
                    : "Location"}
                </span>
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* Body container. */}
        {/* container body */}
        <div className="space-y-5 p-5 sm:p-6">
          {accommodation.gallery.length > 0 && (
            /* Gallery thumbnail strip — swap to set the hero image. */
            /* แถบ thumbnail แกลเลอรี — กดเพื่อเปลี่ยนรูปหลัก */
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 scrollbar-hide">
              {[accommodation.imageUrl, ...accommodation.gallery].map((src) => (
                /* One thumbnail button. */
                /* ปุ่ม thumbnail หนึ่งใบ */
                <button
                  key={src}
                  onClick={() => setActiveImage(src)}
                  className={cn(
                    "shrink-0 overflow-hidden rounded-xl border transition-all",
                    activeImage === src
                      ? "border-accent ring-2 ring-accent/40"
                      : "border-border/60 hover:border-accent/40"
                  )}
                >
                  {/* The thumbnail image. */}
                  {/* รูป thumbnail */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-14 w-20 object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Description paragraph. */}
          {/* ย่อหน้าคำอธิบาย */}
          <p className="text-sm leading-relaxed text-muted-foreground">
            {accommodation.description}
          </p>

          {/* Two-card row — address + stay info. */}
          {/* แถวสองการ์ด — ที่อยู่ + ข้อมูลการเข้าพัก */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Address card. */}
            {/* การ์ดที่อยู่ */}
            <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3">
              {/* Section header — pin + caption. */}
              {/* หัวการ์ด — pin + คำว่า Address */}
              <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> Address
              </div>
              {/* Address text. */}
              {/* ที่อยู่ */}
              <p className="text-sm leading-snug">{accommodation.address}</p>
              {/* Buttons row — copy + Maps. */}
              {/* แถวปุ่ม — copy + Maps */}
              <div className="mt-2 flex items-center gap-2">
                {/* Copy button. */}
                {/* ปุ่ม copy */}
                <Button size="sm" variant="outline" onClick={copyAddress}>
                  {copied ? (
                    /* "Copied" confirmation. */
                    /* state คัดลอกเสร็จ */
                    <>
                      <Check className="h-3.5 w-3.5" /> Copied
                    </>
                  ) : (
                    /* Idle copy state. */
                    /* state ปกติ */
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </>
                  )}
                </Button>
                {/* Maps button. */}
                {/* ปุ่ม Maps */}
                <Button size="sm" variant="glass" asChild>
                  <a href={mapsUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> Maps
                  </a>
                </Button>
              </div>
              {/* Tiny coords line + distance from user (if known). */}
              {/* บรรทัดเล็กแสดงพิกัด + ระยะจากผู้ใช้ */}
              <div className="mt-2 text-[11px] text-muted-foreground">
                {accommodation.coords.lat.toFixed(4)}°,{" "}
                {accommodation.coords.lng.toFixed(4)}°
                {distanceFromYou != null && (
                  <span className="ml-2 inline-flex items-center gap-1">
                    <Navigation className="h-3 w-3" /> {distanceFromYou} km from you
                  </span>
                )}
              </div>
            </div>

            {/* Stay info card. */}
            {/* การ์ดข้อมูลการเข้าพัก */}
            <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3">
              {/* Section header — calendar + caption. */}
              {/* หัวการ์ด — ปฏิทิน + คำว่า Stay */}
              <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> Stay
              </div>
              {/* Check-in / check-out grid. */}
              {/* กริด check-in / check-out */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                {/* Check-in row. */}
                {/* แถว check-in */}
                <div className="flex items-center gap-1.5">
                  <BedDouble className="h-4 w-4 text-accent" />
                  <span className="text-muted-foreground">Check-in</span>
                  <span className="ml-auto font-medium">
                    {accommodation.checkIn}
                  </span>
                </div>
                {/* Check-out row. */}
                {/* แถว check-out */}
                <div className="flex items-center gap-1.5">
                  <LogOut className="h-4 w-4 text-accent" />
                  <span className="text-muted-foreground">Check-out</span>
                  <span className="ml-auto font-medium">
                    {accommodation.checkOut}
                  </span>
                </div>
              </div>
              {/* Cancellation policy info note. */}
              {/* note นโยบายยกเลิก */}
              <div className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                {accommodation.cancellationPolicy}
              </div>
            </div>
          </div>

          {/* Amenities section. */}
          {/* section amenities */}
          <div>
            {/* Section caption. */}
            {/* คำว่า Amenities */}
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Amenities
            </div>
            {/* Amenity chip wrap. */}
            {/* แถว chip amenities */}
            <div className="flex flex-wrap gap-1.5">
              {accommodation.amenities.map((a) => (
                <Badge key={a} variant="secondary">
                  <Check className="h-3 w-3 text-emerald-500" /> {a}
                </Badge>
              ))}
            </div>
          </div>

          {/* CTA footer — price on the left, action buttons on the right. */}
          {/* footer CTA — ราคาซ้าย, ปุ่มขวา */}
          <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
            {/* Price block. */}
            {/* บล็อกราคา */}
            <div>
              {/* "From" caption. */}
              {/* คำว่า From */}
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                From
              </div>
              {/* Price per night. */}
              {/* ราคาต่อคืน */}
              <div className="text-2xl font-semibold tracking-tighter">
                {formatCurrency(accommodation.pricePerNight)}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / night
                </span>
              </div>
            </div>
            {/* Action button cluster — 1 col on mobile, 3 cols on sm+. */}
            {/* กลุ่มปุ่ม action — 1 คอลัมน์มือถือ, 3 คอลัมน์บน sm+ */}
            <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3">
              {activeGroup && (
                /* Share-to-chat button — only when a group is active. */
                /* ปุ่ม share to chat — มีเฉพาะเมื่อมีกลุ่ม active */
                <Button
                  variant="glass"
                  className="h-11 w-full gap-1.5 text-sm"
                  onClick={shareToChat}
                >
                  {shared ? (
                    <>
                      <Check className="h-4 w-4" /> Shared!
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4" /> Share to Chat
                    </>
                  )}
                </Button>
              )}
              {/* Directions button — opens Maps. */}
              {/* ปุ่ม Directions — เปิด Maps */}
              <Button variant="glass" className="h-11 w-full gap-1.5 text-sm" asChild>
                <a href={mapsUrl} target="_blank" rel="noreferrer">
                  <Navigation className="h-4 w-4" /> Directions
                </a>
              </Button>
              {/* Book Now — opens Google Travel hotels search. */}
              {/* ปุ่ม Book Now — เปิดหน้าค้นหา Google Travel */}
              <Button
                variant="accent"
                className="h-11 w-full gap-1.5 text-sm"
                asChild
              >
                <a
                  href={`https://www.google.com/travel/hotels/entity/${encodeURIComponent(accommodation.name)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-4 w-4" /> Book Now
                </a>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
