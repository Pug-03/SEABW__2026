/**
 * @file `<ProfileCreation>` — final "welcome" screen shown at the end
 * of registration. Displays the user's avatar/name/preferences plus a
 * shareable invite (URL + QR + 6–8 char invite code). The user lands
 * on the dashboard once they click "Go to dashboard".
 *
 * (TH) หน้าจอ "ยินดีต้อนรับ" ตอนสมัครเสร็จ แสดงรูปโปรไฟล์/ชื่อ/preference
 * ของผู้ใช้ พร้อม invite สำหรับชวนเพื่อน (ลิงก์ + QR + รหัส 6-8 ตัวอักษร)
 * กด "Go to dashboard" เพื่อไปต่อ
 */

"use client";

import * as React from "react";
import { Check, Copy, Link2, Share2, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { QRCode } from "@/components/common/qr-code";
import type { User } from "@/lib/types";
import { PREFERENCE_META } from "@/lib/mock-data";

/**
 * Props for `<ProfileCreation>`. `inviteUrl` is the full URL the QR
 * encodes; `inviteCode` is the short human-readable form shown next
 * to the link.
 *
 * (TH) Props: `inviteUrl` คือ URL เต็มที่ฝัง QR, `inviteCode` คือรหัสสั้น
 * รูปแบบที่คนอ่านง่ายแสดงข้าง ๆ ลิงก์
 */
interface ProfileCreationProps {
  user: User;
  inviteUrl: string;
  inviteCode: string;
  onContinue: () => void;
}

/**
 * Render the post-signup welcome card. Wires up clipboard copy and
 * (when available) the native Web Share API for sharing the invite.
 *
 * (TH) แสดงการ์ดต้อนรับหลังสมัครเสร็จ ผูกการคัดลอกลิงก์เข้า clipboard
 * และ Web Share API (ถ้าบราวเซอร์รองรับ) สำหรับส่งคำเชิญ
 */
export function ProfileCreation({
  user,
  inviteUrl,
  inviteCode,
  onContinue,
}: ProfileCreationProps) {
  // True for ~1.5s after the user copies the link, so the button can
  // briefly switch to a "Copied" confirmation state.
  // true ประมาณ 1.5 วินาทีหลังคัดลอก เพื่อสลับปุ่มเป็น "Copied"
  const [copied, setCopied] = React.useState(false);

  /**
   * Copy the invite URL to the clipboard and briefly flip the
   * `copied` flag for visual confirmation.
   *
   * (TH) คัดลอก invite URL ลง clipboard และสลับธง copied ชั่วคราวเพื่อ
   * แสดง feedback ให้ผู้ใช้
   */
  const copy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  /**
   * Use the native share sheet when available, otherwise fall back to
   * a plain clipboard copy.
   *
   * (TH) ใช้ share sheet ของระบบเมื่อบราวเซอร์รองรับ ไม่งั้น fallback ไปคัดลอก
   * ลง clipboard แทน
   */
  const share = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
          title: "Join my VibeTrip",
          text: `Hop on my trip — invite code ${inviteCode}`,
          url: inviteUrl,
        });
      } catch {
        // User cancelled or share failed — fall back to copy silently.
        // ผู้ใช้ยกเลิกหรือ share ล้มเหลว — fallback ไปคัดลอกแบบเงียบ ๆ
        copy();
      }
    } else copy();
  };

  return (
    // Outer vertical container — header on top, two-column body below.
    // ตัวห่อหลัก — header ด้านบน, สองคอลัมน์ด้านล่าง
    <div className="space-y-6">
      {/* Header section — "You're all set" pill + greeting + subtitle. */}
      {/* ส่วน header — ป้าย "You're all set" + คำทักทาย + คำอธิบาย */}
      <div className="text-center">
        {/* Status pill with sparkle icon. */}
        {/* ป้ายสถานะพร้อม icon ประกาย */}
        <div className="mx-auto mb-1 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          {/* Sparkle icon */}
          {/* ไอคอนประกาย */}
          <Sparkles className="h-3 w-3" /> {"You're"} all set
        </div>
        {/* Greeting heading addressing the user by nickname. */}
        {/* หัวข้อต้อนรับโดยเรียกผู้ใช้ด้วย nickname */}
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome, {user.nickname}
        </h2>
        {/* Subtitle explaining the invite-sharing CTA below. */}
        {/* คำอธิบายว่าด้านล่างคือ CTA ส่งคำเชิญ */}
        <p className="mt-1 text-sm text-muted-foreground">
          Share your invite so your crew can hop into trips.
        </p>
      </div>

      {/* Two-column body: profile card on the left, QR card on the right. */}
      {/* body สองคอลัมน์: ข้อมูลโปรไฟล์ซ้าย, QR code ขวา */}
      <div className="grid gap-3 sm:gap-6 md:grid-cols-2">
        {/* Left column — profile card. */}
        {/* คอลัมน์ซ้าย — การ์ดข้อมูลโปรไฟล์ */}
        <div className="space-y-4 rounded-3xl border border-border/60 bg-card/70 p-4 sm:p-6 backdrop-blur-xl">
          {/* Identity row: avatar + name + nickname/email. */}
          {/* แถวบ่งบอกตัวตน: avatar + ชื่อ + nickname/email */}
          <div className="flex items-center gap-4">
            {/* User avatar (image or fallback initials). */}
            {/* avatar ผู้ใช้ (รูปจริงหรืออักษรย่อ) */}
            <Avatar className="h-16 w-16 ring-2 ring-accent/30">
              {user.avatarDataUrl && (
                // Real uploaded avatar image.
                // รูป avatar ที่ผู้ใช้อัปโหลด
                <AvatarImage src={user.avatarDataUrl} alt={user.firstName} />
              )}
              {/* Fallback initials shown if no image. */}
              {/* fallback อักษรย่อชื่อ-นามสกุล */}
              <AvatarFallback>
                {user.firstName[0]}
                {user.lastName[0]}
              </AvatarFallback>
            </Avatar>
            {/* Name + secondary identity line. */}
            {/* ชื่อจริง + บรรทัด nickname/email */}
            <div>
              {/* Full name. */}
              {/* ชื่อ-นามสกุล */}
              <div className="text-lg font-semibold">
                {user.firstName} {user.lastName}
              </div>
              {/* Nickname + email. */}
              {/* nickname + email */}
              <div className="text-xs text-muted-foreground">
                @{user.nickname} • {user.email}
              </div>
            </div>
          </div>

          {/* Preferences block — chips for each chosen vibe. */}
          {/* บล็อก preferences — chip ของแต่ละ vibe ที่เลือก */}
          <div>
            {/* Section caption. */}
            {/* หัวบล็อก */}
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Preferences
            </div>
            {/* Chip wrap — wraps onto multiple lines as needed. */}
            {/* แถว chip — ขึ้นบรรทัดใหม่อัตโนมัติเมื่อล้น */}
            <div className="flex flex-wrap gap-1.5">
              {user.preferences.length === 0 && (
                // Empty hint when no preferences were chosen.
                // ข้อความบอกตอนยังไม่ได้เลือก preference เลย
                <span className="text-sm text-muted-foreground">
                  Pick at least one to personalize recommendations
                </span>
              )}
              {user.preferences.map((p) => (
                /* One badge per chosen preference. */
                /* badge หนึ่งตัวต่อหนึ่ง preference */
                <Badge key={p} variant="accent">
                  {PREFERENCE_META[p].label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Invite link card — URL + copy button + code line. */}
          {/* การ์ดลิงก์เชิญ — URL + ปุ่มคัดลอก + บรรทัดรหัส */}
          <div className="rounded-2xl border border-border/60 bg-secondary/40 p-3">
            {/* Top row — URL label + URL + copy button. */}
            {/* แถวบน — label + URL + ปุ่ม copy */}
            <div className="flex items-center justify-between gap-2">
              {/* URL block — label above the truncated link. */}
              {/* บล็อก URL — label เหนือลิงก์ที่ truncate */}
              <div className="min-w-0">
                {/* "Invite link" caption. */}
                {/* คำว่า "Invite link" */}
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Invite link
                </div>
                {/* Truncated invite URL (full URL still copyable). */}
                {/* URL ตัดท้าย — แต่ตอน copy จะได้ URL เต็ม */}
                <div className="truncate font-mono text-xs">{inviteUrl}</div>
              </div>
              {/* Copy button — flips to "Copied" briefly after click. */}
              {/* ปุ่มคัดลอก — สลับเป็น "Copied" ชั่วคราวหลังกด */}
              <Button size="sm" variant="outline" onClick={copy}>
                {copied ? (
                  // Confirmation state after a successful copy.
                  // สถานะหลังคัดลอกสำเร็จ
                  <>
                    <Check className="h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  // Idle "Copy" state.
                  // สถานะปกติ ก่อนกด
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </>
                )}
              </Button>
            </div>
            {/* Bottom row — code label + actual short code. */}
            {/* แถวล่าง — รหัสสั้นสำหรับกรอก */}
            <div className="mt-2 flex items-center gap-2 text-xs">
              {/* Link icon to visually anchor the code line. */}
              {/* ไอคอนลิงก์เพื่อสื่อว่านี่คือรหัสคู่กับลิงก์ */}
              <Link2 className="h-3 w-3 text-accent" />
              {/* "Code:" label. */}
              {/* คำว่า "Code:" */}
              <span className="text-muted-foreground">Code:</span>
              {/* The short invite code in monospace for clarity. */}
              {/* รหัสเชิญสั้น ใช้ฟอนต์ monospace เพื่ออ่านง่าย */}
              <span className="font-mono font-semibold">{inviteCode}</span>
            </div>
          </div>

          {/* CTA row — Share invite + Go to dashboard. Stacks on mobile. */}
          {/* แถว CTA — Share invite + Go to dashboard เรียงคอลัมน์บนมือถือ */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {/* Share button — opens native share sheet, falls back to copy. */}
            {/* ปุ่ม Share — เปิด share sheet ของระบบ ถ้าไม่รองรับจะ fallback ไป copy */}
            <Button
              variant="glass"
              onClick={share}
              className="w-full sm:flex-1"
            >
              <Share2 className="h-4 w-4" /> Share invite
            </Button>
            {/* Primary CTA — proceed to dashboard. */}
            {/* ปุ่มหลัก — ไปต่อยังหน้า dashboard */}
            <Button
              variant="accent"
              onClick={onContinue}
              className="w-full sm:flex-1"
            >
              <Users className="h-4 w-4" /> Go to dashboard
            </Button>
          </div>
        </div>

        {/* Right column — QR code card (size adapts to viewport). */}
        {/* คอลัมน์ขวา — การ์ด QR (ขนาดเปลี่ยนตามความกว้างจอ) */}
        <div className="flex items-center justify-center rounded-3xl border border-border/60 bg-card/70 p-4 sm:p-6 backdrop-blur-xl">
          {/* Small QR for mobile (hidden on sm+). */}
          {/* QR ขนาดเล็กสำหรับมือถือ (ซ่อนตั้งแต่จอ sm ขึ้นไป) */}
          <QRCode value={inviteUrl} size={160} className="sm:hidden" label={`Code: ${inviteCode}`} />
          {/* Larger QR for sm screens and up. */}
          {/* QR ขนาดใหญ่สำหรับจอ sm ขึ้นไป */}
          <QRCode value={inviteUrl} size={200} className="hidden sm:flex" label={`Code: ${inviteCode}`} />
        </div>
      </div>
    </div>
  );
}
