/**
 * @file `<SettingsModal>` — privacy/security settings sheet opened
 * from the navbar cog. Toggles (precise location, online status,
 * notifications, biometric, 2FA), a change-password form, and a
 * language picker. All toggles are local-only in this demo — they
 * don't persist anywhere.
 *
 * (TH) modal ตั้งค่าความเป็นส่วนตัวและความปลอดภัย เปิดจากปุ่ม cog
 * บน navbar — มีสวิตช์เปิด/ปิดต่าง ๆ, ฟอร์มเปลี่ยนรหัสผ่าน, และตัวเลือก
 * ภาษา (ทุกสวิตช์เป็น state local ใน demo นี้ ยังไม่ได้ persist จริง)
 */

"use client";

import * as React from "react";
import {
  Bell,
  Eye,
  Fingerprint,
  Globe,
  KeyRound,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Props for `<SettingsModal>` — Radix Dialog controlled-open pattern.
 *
 * (TH) Props — ใช้รูปแบบ controlled-open ของ Radix Dialog
 */
interface SettingsModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

// ─── Toggle row helper ───────────────────────────────────────────────────────

/** Props for one labeled toggle row inside a section. */
/** (TH) Props ของแถวสวิตช์หนึ่งแถวใน section */
interface ToggleRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  defaultChecked?: boolean;
}

/**
 * One row of "icon + title + description + switch". State is local —
 * fine for this demo since the values aren't sent anywhere yet.
 *
 * (TH) แถวรวม "icon + title + description + switch" — state เก็บใน
 * คอมโพเนนต์เอง พอสำหรับ demo เพราะค่าไม่ได้ส่งไปไหน
 */
function ToggleRow({ icon, title, description, defaultChecked }: ToggleRowProps) {
  // Local switch value — replace with a hook into settings storage later.
  // ค่าสวิตช์ local — ภายหลังควรผูกกับ store/settings จริง
  const [v, setV] = React.useState(!!defaultChecked);
  return (
    // Row container — card-like background with consistent spacing.
    // container แถว — พื้นการ์ดและจัดระยะให้สม่ำเสมอ
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-secondary/30 p-3">
      {/* Left cluster — icon tile + label/description. */}
      {/* กลุ่มซ้าย — กระเบื้อง icon + ชื่อ/คำอธิบาย */}
      <div className="flex min-w-0 items-start gap-3">
        {/* Icon tile. */}
        {/* กระเบื้อง icon */}
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-background">
          {icon}
        </div>
        {/* Text block. */}
        {/* ส่วนข้อความ */}
        <div className="min-w-0">
          {/* Row title. */}
          {/* ชื่อแถว */}
          <div className="text-sm font-medium">{title}</div>
          {/* Row description (muted). */}
          {/* คำอธิบายแถว (สีจาง) */}
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      {/* The actual switch. */}
      {/* สวิตช์จริง */}
      <Switch checked={v} onCheckedChange={setV} />
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

/**
 * The settings sheet itself. Holds a local form for changing password
 * with a short success/error inline message (no real backend).
 *
 * (TH) ตัว modal settings — ภายในมีฟอร์มเปลี่ยนรหัสผ่าน พร้อมข้อความ
 * สำเร็จ/ผิดพลาด inline (ยังไม่มี backend จริง)
 */
export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  // Change-password form state.
  // state ของฟอร์มเปลี่ยนรหัสผ่าน
  const [currentPw, setCurrentPw] = React.useState("");
  const [newPw, setNewPw] = React.useState("");
  // Inline success/error message (ok=true means success).
  // ข้อความ feedback (ok=true คือสำเร็จ)
  const [pwMsg, setPwMsg] = React.useState<{ ok: boolean; text: string } | null>(null);

  /**
   * Validate and "submit" the password change. Demo only — auto-clears
   * the message after 2.5s.
   *
   * (TH) validate + "ส่ง" ฟอร์มเปลี่ยนรหัสผ่าน — demo เท่านั้น ข้อความหายไป
   * อัตโนมัติหลัง 2.5 วินาที
   */
  const updateCredentials = () => {
    if (!currentPw || !newPw) {
      setPwMsg({ ok: false, text: "Both fields are required." });
      return;
    }
    if (newPw.length < 8) {
      setPwMsg({ ok: false, text: "New password must be at least 8 characters." });
      return;
    }
    setCurrentPw("");
    setNewPw("");
    setPwMsg({ ok: true, text: "Password updated!" });
    setTimeout(() => setPwMsg(null), 2500);
  };

  return (
    // Radix Dialog (controlled open).
    // Radix Dialog แบบ controlled
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Modal content panel. */}
      {/* แผงเนื้อหา modal */}
      <DialogContent className="max-w-lg">
        {/* Header — title + description. */}
        {/* header — title + description */}
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Privacy permissions and security credentials.
          </DialogDescription>
        </DialogHeader>

        {/* Privacy section. */}
        {/* section ความเป็นส่วนตัว */}
        <section className="space-y-2">
          {/* Section caption. */}
          {/* คำว่า "Privacy" */}
          <div className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Privacy
          </div>
          {/* Toggle: precise location. */}
          {/* สวิตช์: precise location */}
          <ToggleRow
            icon={<MapPin className="h-4 w-4 text-accent" />}
            title="Precise location"
            description="Used for nearby SOS, ETA & fuel estimates."
            defaultChecked
          />
          {/* Toggle: online status visibility. */}
          {/* สวิตช์: แสดง online status */}
          <ToggleRow
            icon={<Eye className="h-4 w-4 text-accent" />}
            title="Show online status"
            description="Group mates see when you are active."
            defaultChecked
          />
          {/* Toggle: push notifications. */}
          {/* สวิตช์: push notifications */}
          <ToggleRow
            icon={<Bell className="h-4 w-4 text-accent" />}
            title="Push notifications"
            description="Polls, expenses, and trip updates."
            defaultChecked
          />
        </section>

        {/* Security section. */}
        {/* section ความปลอดภัย */}
        <section className="space-y-2">
          {/* Section caption. */}
          {/* คำว่า "Security" */}
          <div className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Security
          </div>
          {/* Toggle: biometric unlock. */}
          {/* สวิตช์: biometric unlock */}
          <ToggleRow
            icon={<Fingerprint className="h-4 w-4 text-accent" />}
            title="Biometric unlock"
            description="Use Face ID / fingerprint to open the app."
          />
          {/* Toggle: 2FA. */}
          {/* สวิตช์: 2FA */}
          <ToggleRow
            icon={<ShieldCheck className="h-4 w-4 text-accent" />}
            title="Two-factor authentication"
            description="Required for edits and high-value transfers."
            defaultChecked
          />
        </section>

        {/* Change-password section card. */}
        {/* การ์ดเปลี่ยนรหัสผ่าน */}
        <section className="space-y-3 rounded-2xl border border-border/60 bg-secondary/30 p-4">
          {/* Section header with key icon. */}
          {/* หัวการ์ดพร้อมไอคอนกุญแจ */}
          <div className="flex items-center gap-2 text-sm font-medium">
            {/* Key icon. */}
            {/* ไอคอนกุญแจ */}
            <KeyRound className="h-4 w-4" /> Change password
          </div>
          {/* Field grid + submit. */}
          {/* ตาราง field + ปุ่ม submit */}
          <div className="grid gap-2">
            {/* Current password field. */}
            {/* field รหัสผ่านปัจจุบัน */}
            <div>
              <Label className="text-xs">Current password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
              />
            </div>
            {/* New password field. */}
            {/* field รหัสผ่านใหม่ */}
            <div>
              <Label className="text-xs">New password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
            </div>
            {pwMsg && (
              /* Feedback line — green on success, destructive on error. */
              /* บรรทัด feedback — เขียวเมื่อสำเร็จ, สีอันตรายเมื่อ error */
              <p className={`text-xs ${pwMsg.ok ? "text-green-500" : "text-destructive"}`}>
                {pwMsg.text}
              </p>
            )}
            {/* Submit button. */}
            {/* ปุ่ม submit */}
            <Button variant="accent" size="sm" className="mt-1 w-full" onClick={updateCredentials}>
              Update credentials
            </Button>
          </div>
        </section>

        {/* Language picker row. */}
        {/* แถวเลือกภาษา */}
        <section className="flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/30 p-3">
          {/* Left cluster — globe icon + label. */}
          {/* กลุ่มซ้าย — ไอคอนลูกโลก + label */}
          <div className="flex items-center gap-3">
            {/* Globe icon. */}
            {/* ไอคอนลูกโลก */}
            <Globe className="h-4 w-4" />
            {/* Text block. */}
            {/* ส่วนข้อความ */}
            <div>
              {/* Section title. */}
              {/* หัวข้อ */}
              <div className="text-sm font-medium">Language</div>
              {/* Auto-detected note. */}
              {/* note "Auto-detected" */}
              <div className="text-xs text-muted-foreground">Auto-detected</div>
            </div>
          </div>
          {/* Native select for language. */}
          {/* select ภาษา (native) */}
          <select className="rounded-xl border border-input bg-background px-3 py-1.5 text-sm">
            <option>English</option>
            <option>ไทย</option>
            <option>日本語</option>
          </select>
        </section>
      </DialogContent>
    </Dialog>
  );
}
