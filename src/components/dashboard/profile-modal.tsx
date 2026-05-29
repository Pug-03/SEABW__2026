/**
 * @file `<ProfileModal>` — full-featured profile sheet shown from the
 * navbar avatar menu. Contains:
 *   - A read-only profile snapshot (avatar, name, contacts, preferences).
 *   - An "Invite friends" tab with QR code + shareable URL.
 *   - An "Edit profile" tab gated behind a (mock) password re-verify.
 *   - Footer actions: switch account (keep data) or full logout (wipe).
 *
 * (TH) modal โปรไฟล์เต็มรูปแบบ เปิดจากเมนู avatar บน navbar ประกอบด้วย:
 * แสดงโปรไฟล์, แท็บเชิญเพื่อน (QR + URL), แท็บแก้ไขโปรไฟล์ (มี re-verify
 * รหัสผ่านแบบ mock), และปุ่มล่างสำหรับ switch account หรือ logout เต็มรูปแบบ
 */

"use client";

import * as React from "react";
import {
  Copy,
  Edit3,
  Lock,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { QRCode } from "@/components/common/qr-code";
import type { InsuranceDetails, User } from "@/lib/types";
import { PREFERENCE_META } from "@/lib/mock-data";
import { useVibeStore } from "@/lib/store";

/**
 * Props for `<ProfileModal>`. The modal is fully controlled; the
 * parent owns `open` and handles updates via `onUpdate`.
 *
 * (TH) Props — modal เป็น controlled ทั้งหมด; parent เป็นเจ้าของ `open`
 * และรับ patch ผ่าน `onUpdate`
 */
interface ProfileModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: User;
  onUpdate: (patch: Partial<User>) => void;
}

/** Internal sub-view within the modal body. */
/** (TH) แท็บภายในของ modal */
type Tab = "view" | "invite" | "edit";

/**
 * The profile modal component. Manages local tab state, password
 * verification gate, and the destructive logout confirmation.
 *
 * (TH) ตัว modal โปรไฟล์ — ดูแลแท็บ, ขั้น verify รหัสผ่าน, และคอนเฟิร์ม logout
 */
export function ProfileModal({
  open,
  onOpenChange,
  user,
  onUpdate,
}: ProfileModalProps) {
  const router = useRouter();
  // Store actions — `reset` wipes everything, `setUser` only signs out.
  // action ของ store — `reset` ลบทุกอย่าง, `setUser` แค่ออกจาก account
  const reset = useVibeStore((s) => s.reset);
  const setUser = useVibeStore((s) => s.setUser);

  // Current tab / verification flag / destructive-confirm state.
  // state ของแท็บ / สถานะ verify / state คอนเฟิร์ม logout
  const [tab, setTab] = React.useState<Tab>("view");
  const [verified, setVerified] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [verifyError, setVerifyError] = React.useState<string | null>(null);
  const [confirmLogout, setConfirmLogout] = React.useState(false);

  // Reset transient state every time the modal closes.
  // รีเซ็ต state ชั่วคราวทุกครั้งที่ modal ปิด
  React.useEffect(() => {
    if (!open) {
      setTab("view");
      setVerified(false);
      setPassword("");
      setVerifyError(null);
      setConfirmLogout(false);
    }
  }, [open]);

  /** Sign out (keep data) and bounce to the auth landing page. */
  /** (TH) sign out (เก็บข้อมูล) แล้วกลับหน้า auth */
  const handleSwitchAccount = () => {
    onOpenChange(false);
    setUser(null);
    router.push("/");
  };

  /** Full logout (wipe persisted store) and bounce home. */
  /** (TH) logout เต็ม (ล้าง store) แล้วกลับหน้า auth */
  const handleLogout = () => {
    onOpenChange(false);
    reset();
    router.push("/");
  };

  // Build a share URL whose path encodes the last 6 chars of the user ID.
  // ประกอบ URL เชิญที่ embed รหัสผู้ใช้ 6 ตัวท้าย
  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/trip?invite=${user.id.slice(-6).toUpperCase()}`
      : `https://vibetrip.app/trip?invite=${user.id.slice(-6).toUpperCase()}`;

  return (
    // Radix Dialog wrapper.
    // ตัวห่อ Radix Dialog
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Modal panel. */}
      {/* แผง modal */}
      <DialogContent className="max-w-xl">
        {/* Header — title + description. */}
        {/* header — title + คำอธิบาย */}
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>
            Manage your identity and share trip invites.
          </DialogDescription>
        </DialogHeader>

        {/* Identity block — avatar + name + email/phone + preference badges. */}
        {/* บล็อกข้อมูลผู้ใช้ — avatar + ชื่อ + email/เบอร์ + badge preference */}
        <div className="flex flex-col items-center text-center">
          {/* Large avatar with accent ring. */}
          {/* avatar ขนาดใหญ่พร้อม ring สี accent */}
          <Avatar className="h-24 w-24 ring-4 ring-accent/30">
            {user.avatarDataUrl && (
              // Uploaded avatar.
              // avatar ที่ผู้ใช้อัปโหลด
              <AvatarImage src={user.avatarDataUrl} alt={user.firstName} />
            )}
            {/* Initials fallback. */}
            {/* fallback อักษรย่อ */}
            <AvatarFallback className="text-2xl">
              {user.firstName[0]}
              {user.lastName[0]}
            </AvatarFallback>
          </Avatar>
          {/* Full name. */}
          {/* ชื่อ-นามสกุล */}
          <h3 className="mt-3 text-xl font-semibold tracking-tight">
            {user.firstName} {user.lastName}
          </h3>
          {/* @nickname handle. */}
          {/* handle @nickname */}
          <p className="text-xs text-muted-foreground">@{user.nickname}</p>
          {/* Contact row — email + phone with icons. */}
          {/* แถวการติดต่อ — email + เบอร์โทรพร้อมไอคอน */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            {/* Email cluster. */}
            {/* กลุ่ม email */}
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3 w-3" /> {user.email}
            </span>
            {/* Phone cluster. */}
            {/* กลุ่มเบอร์โทร */}
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3 w-3" /> {user.phone}
            </span>
          </div>
          {user.preferences.length > 0 && (
            /* Preferences badge wrap (only when any preferences selected). */
            /* แถว badge preference (แสดงเฉพาะเมื่อมี preference) */
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {user.preferences.map((p) => (
                <Badge key={p} variant="accent">
                  {PREFERENCE_META[p].label}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Tab switcher — 2 buttons: invite / edit. */}
        {/* แถวสลับแท็บ — 2 ปุ่ม: invite / edit */}
        <div className="grid grid-cols-2 gap-2">
          {/* "Invite friends" tab trigger. */}
          {/* ปุ่ม "Invite friends" */}
          <Button
            variant={tab === "invite" ? "accent" : "glass"}
            onClick={() => setTab("invite")}
          >
            <Users className="h-4 w-4" /> Invite friends
          </Button>
          {/* "Edit profile" tab trigger. */}
          {/* ปุ่ม "Edit profile" */}
          <Button
            variant={tab === "edit" ? "accent" : "glass"}
            onClick={() => setTab("edit")}
          >
            <Edit3 className="h-4 w-4" /> Edit profile
          </Button>
        </div>

        {tab === "invite" && (
          /* Invite tab body — QR code + copyable URL. */
          /* เนื้อหาแท็บ invite — QR code + URL ที่คัดลอกได้ */
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-secondary/30 p-4">
            {/* QR code with the short invite code below. */}
            {/* QR code พร้อม invite code สั้นด้านล่าง */}
            <QRCode
              value={inviteUrl}
              size={170}
              label={`Code: ${user.id.slice(-6).toUpperCase()}`}
            />
            {/* URL row — truncated link + copy button. */}
            {/* แถว URL — ลิงก์ตัดท้าย + ปุ่ม copy */}
            <div className="flex w-full items-center gap-2 rounded-xl bg-background/60 px-3 py-2 text-xs">
              {/* Truncated URL (full URL copies on click). */}
              {/* URL ที่ตัดท้าย (เวลา copy จะได้ URL เต็ม) */}
              <span className="flex-1 truncate font-mono">{inviteUrl}</span>
              {/* Copy button. */}
              {/* ปุ่ม copy */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(inviteUrl)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {tab === "edit" && (
          /* Edit tab — either the verify gate or the actual edit form. */
          /* แท็บ edit — แสดง verify gate หรือฟอร์มแก้ไขจริง */
          <>
            {!verified ? (
              /* Verify form — gates the edit form behind a password check. */
              /* ฟอร์ม verify — กั้นก่อนเข้าไปแก้ไขจริง */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // Mock verification — demo accepts any 4+ char password.
                  // verify แบบ mock — demo ยอมรับรหัสผ่าน 4 ตัวขึ้นไป
                  if (password.length < 4) {
                    setVerifyError(
                      "Please enter your password (min 4 characters for demo)."
                    );
                    return;
                  }
                  setVerified(true);
                  setVerifyError(null);
                }}
                className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4"
              >
                {/* Header row with lock icon. */}
                {/* แถวหัวพร้อมไอคอนกุญแจ */}
                <div className="flex items-center gap-2 text-sm font-medium">
                  {/* Lock icon. */}
                  {/* ไอคอนกุญแจ */}
                  <Lock className="h-4 w-4 text-amber-600" />
                  Re-verify to edit your profile
                </div>
                {/* Password field label. */}
                {/* label ของช่อง password */}
                <Label className="text-xs">Current password</Label>
                {/* Password input — autofocused for fast entry. */}
                {/* ช่องกรอกรหัส — autoFocus เพื่อให้กรอกได้ทันที */}
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                />
                {verifyError && (
                  /* Inline error line. */
                  /* บรรทัด error inline */
                  <div className="text-xs text-destructive">{verifyError}</div>
                )}
                {/* Verify button. */}
                {/* ปุ่ม Verify */}
                <Button type="submit" variant="accent" className="w-full">
                  <ShieldCheck className="h-4 w-4" /> Verify
                </Button>
              </form>
            ) : (
              /* Actual edit form (delegated to EditForm). */
              /* ฟอร์มแก้ไขจริง (ดูที่ EditForm) */
              <EditForm user={user} onSave={onUpdate} />
            )}
          </>
        )}

        {/* Footer — switch account / logout (with destructive confirm). */}
        {/* footer — switch account / logout (มีคอนเฟิร์มสำหรับลบข้อมูล) */}
        <div className="border-t border-border/60 pt-3">
          {confirmLogout ? (
            /* Destructive confirmation panel. */
            /* แผงคอนเฟิร์มการกระทำที่อันตราย */
            <div className="space-y-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
              {/* Question line. */}
              {/* บรรทัดคำถาม */}
              <p className="text-sm font-medium text-destructive">
                Log out and clear all local data?
              </p>
              {/* Warning subtext. */}
              {/* คำเตือนเพิ่มเติม */}
              <p className="text-xs text-muted-foreground">
                Your trips and messages are stored locally and will be removed.
              </p>
              {/* Cancel + confirm buttons. */}
              {/* ปุ่ม Cancel + ยืนยัน */}
              <div className="flex gap-2">
                {/* Cancel back to the safe footer. */}
                {/* ยกเลิกกลับไป footer ปกติ */}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setConfirmLogout(false)}
                >
                  Cancel
                </Button>
                {/* Final destructive action — wipes the store. */}
                {/* ยืนยันการลบ — ล้าง store จริง */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={handleLogout}
                >
                  <LogOut className="h-3.5 w-3.5" /> Yes, log out
                </Button>
              </div>
            </div>
          ) : (
            /* Default footer — two side-by-side actions. */
            /* footer ปกติ — ปุ่ม 2 ตัวอยู่ข้าง ๆ กัน */
            <div className="flex gap-2">
              {/* Switch account button (non-destructive). */}
              {/* ปุ่ม switch account (ไม่ลบข้อมูล) */}
              <Button
                variant="glass"
                size="sm"
                className="flex-1"
                onClick={handleSwitchAccount}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Switch account
              </Button>
              {/* Open the destructive confirm panel. */}
              {/* เปิดแผงคอนเฟิร์ม logout */}
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmLogout(true)}
              >
                <LogOut className="h-3.5 w-3.5" /> Log out
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Sub-form for actually editing profile fields. Composes the dirty
 * patch and pushes it to `onSave`. Briefly flashes a "Saved" state.
 *
 * (TH) ฟอร์มย่อยสำหรับแก้ไขข้อมูลโปรไฟล์ — ส่งเฉพาะ patch ไปยัง `onSave`
 * และโชว์ปุ่ม "Saved" ชั่วคราวหลังบันทึก
 */
function EditForm({
  user,
  onSave,
}: {
  user: User;
  onSave: (patch: Partial<User>) => void;
}) {
  // One local state per editable field — initial values come from `user`.
  // state แยกของแต่ละ field — ค่าตั้งต้นมาจาก `user`
  const [firstName, setFirstName] = React.useState(user.firstName);
  const [lastName, setLastName] = React.useState(user.lastName);
  const [nickname, setNickname] = React.useState(user.nickname);
  const [email, setEmail] = React.useState(user.email);
  const [phone, setPhone] = React.useState(user.phone);
  const [homeAddress, setHomeAddress] = React.useState(user.homeAddress);
  // Insurance — keep the shape consistent so the form is always valid.
  // ข้อมูลประกัน — เก็บโครงครบเพื่อให้ฟอร์มใช้งานได้ตลอด
  const [insurance, setInsurance] = React.useState<InsuranceDetails>(
    user.insurance ?? {
      provider: "",
      policyNumber: "",
      emergencyContact: "",
    }
  );
  // "Saved" toast flag — auto-clears after 1.5s.
  // ธง "Saved" ที่หายเองหลัง 1.5 วินาที
  const [saved, setSaved] = React.useState(false);

  /** Submit handler — build the patch and call `onSave`. */
  /** (TH) submit handler — สร้าง patch แล้วเรียก `onSave` */
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      firstName,
      lastName,
      nickname,
      email,
      phone,
      homeAddress,
      // Only attach insurance when at least a provider exists.
      // แนบ insurance เฉพาะเมื่อมีชื่อบริษัทเป็นอย่างน้อย
      insurance: insurance.provider ? insurance : undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    // <form> wrapper.
    // <form> ห่อ
    <form onSubmit={submit} className="space-y-3">
      {/* Personal info field grid (2 cols). */}
      {/* ตารางข้อมูลส่วนตัว (2 คอลัมน์) */}
      <div className="grid grid-cols-2 gap-3">
        {/* First name. */}
        {/* ชื่อจริง */}
        <div>
          <Label className="text-xs">First name</Label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        {/* Last name. */}
        {/* นามสกุล */}
        <div>
          <Label className="text-xs">Last name</Label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        {/* Nickname. */}
        {/* ชื่อเล่น */}
        <div>
          <Label className="text-xs">Nickname</Label>
          <Input value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </div>
        {/* Phone. */}
        {/* เบอร์โทร */}
        <div>
          <Label className="text-xs">Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        {/* Email — spans both columns. */}
        {/* email — กินสองคอลัมน์ */}
        <div className="col-span-2">
          <Label className="text-xs">Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {/* Home address — spans both columns. */}
        {/* ที่อยู่ — กินสองคอลัมน์ */}
        <div className="col-span-2">
          <Label className="text-xs">Home address</Label>
          <Input value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} />
        </div>
      </div>
      {/* Travel insurance section card. */}
      {/* การ์ดข้อมูลประกัน */}
      <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3">
        {/* Section header. */}
        {/* หัว section */}
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          {/* Shield-check icon. */}
          {/* ไอคอนโล่ */}
          <ShieldCheck className="h-4 w-4 text-emerald-500" /> Travel insurance
        </div>
        {/* Insurance field grid. */}
        {/* ตาราง field ประกัน */}
        <div className="grid grid-cols-2 gap-3">
          {/* Provider — spans both columns. */}
          {/* ชื่อบริษัท — กินสองคอลัมน์ */}
          <div className="col-span-2">
            <Label className="text-xs">Provider</Label>
            <Input
              value={insurance.provider}
              onChange={(e) =>
                setInsurance({ ...insurance, provider: e.target.value })
              }
            />
          </div>
          {/* Policy number. */}
          {/* เลขกรมธรรม์ */}
          <div>
            <Label className="text-xs">Policy number</Label>
            <Input
              value={insurance.policyNumber}
              onChange={(e) =>
                setInsurance({ ...insurance, policyNumber: e.target.value })
              }
            />
          </div>
          {/* Emergency contact. */}
          {/* ผู้ติดต่อฉุกเฉิน */}
          <div>
            <Label className="text-xs">Emergency contact</Label>
            <Input
              value={insurance.emergencyContact}
              onChange={(e) =>
                setInsurance({
                  ...insurance,
                  emergencyContact: e.target.value,
                })
              }
            />
          </div>
        </div>
      </div>
      {/* Save button — briefly flashes "Saved". */}
      {/* ปุ่ม save — สลับเป็น "Saved" ชั่วคราว */}
      <Button type="submit" variant="accent" className="w-full">
        {saved ? (
          <>
            <Sparkles className="h-4 w-4" /> Saved
          </>
        ) : (
          "Save changes"
        )}
      </Button>
    </form>
  );
}
