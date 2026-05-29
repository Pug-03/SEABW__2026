/**
 * @file `<SosWidget>` — emergency card on the dashboard. Shows a
 * top-line readiness summary (3 stats), a list of nearby SOS facilities
 * with tap-to-call buttons, and (when "active") a flashy insurance
 * card with a pseudo-barcode of the policy number.
 *
 * (TH) วิดเจ็ต SOS บน dashboard — แสดงสถานะความพร้อม 3 ตัว, รายชื่อสถานที่
 * ฉุกเฉินใกล้ตัวพร้อมปุ่มกดโทร, และเมื่อ "Activate" แล้วจะโชว์การ์ดประกัน
 * พร้อม barcode mock ของเลขกรมธรรม์
 */

"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Fuel,
  Hospital,
  IdCard,
  Phone,
  ShieldCheck,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SOS_FACILITIES } from "@/lib/mock-data";
import type { InsuranceDetails, User } from "@/lib/types";

/** Props — the widget needs the user to render the insurance card. */
/** (TH) Props — ต้องใช้ User เพื่อ render การ์ดประกัน */
interface SosWidgetProps {
  user: User;
}

/**
 * Lucide icon per SOS facility type. Keyed exactly to the `f.type`
 * literal so a missing entry would surface as a type error.
 *
 * (TH) ไอคอน lucide ของแต่ละหมวด SOS — key ตรงกับ literal ของ `f.type`
 * เพื่อให้ TypeScript จับ entry ที่ขาด
 */
const ICONS = {
  Hospital: Hospital,
  Police: Shield,
  Gas: Fuel,
} as const;

/**
 * The SOS card. The `active` boolean is local — once activated, the
 * insurance card is revealed and the "Hospital" call button turns
 * destructive to emphasize the urgency.
 *
 * (TH) การ์ด SOS — `active` เป็น state local เมื่อกด Activate จะโชว์การ์ด
 * ประกัน และปุ่มโทรโรงพยาบาลจะเปลี่ยนเป็นสี destructive เพื่อเน้นความเร่งด่วน
 */
export function SosWidget({ user }: SosWidgetProps) {
  // Whether the SOS mode is on.
  // โหมด SOS เปิดอยู่หรือไม่
  const [active, setActive] = React.useState(false);
  return (
    // Outer card. Border turns destructive when active.
    // การ์ดภายนอก — ขอบเปลี่ยนเป็นสี destructive เมื่อ active
    <Card
      className={cn(
        "overflow-hidden transition-colors",
        active && "border-destructive/60"
      )}
    >
      {/* Header — title with alert icon + Activate/Deactivate button. */}
      {/* header — title + ปุ่ม Activate/Deactivate */}
      <CardHeader
        className={cn(
          "pb-3 transition-colors",
          active && "bg-destructive/10"
        )}
      >
        {/* Header row. */}
        {/* แถวหัว */}
        <div className="flex items-center justify-between">
          {/* Title with alert icon (pulses when active). */}
          {/* title พร้อมไอคอนเตือน (เต้นเมื่อ active) */}
          <CardTitle className="flex items-center gap-2 text-base">
            {/* Alert triangle icon. */}
            {/* ไอคอนสามเหลี่ยมเตือน */}
            <AlertTriangle
              className={cn(
                "h-4 w-4",
                active ? "text-destructive animate-pulse" : "text-accent"
              )}
            />
            Nearby SOS
          </CardTitle>
          {/* Activate / SOS active toggle button. */}
          {/* ปุ่ม Activate / SOS active */}
          <Button
            variant={active ? "destructive" : "outline"}
            size="sm"
            onClick={() => setActive((a) => !a)}
          >
            {active ? (
              /* Active state. */
              /* state active */
              <>
                <ShieldAlert className="h-3.5 w-3.5" /> SOS active
              </>
            ) : (
              /* Idle state. */
              /* state ปกติ */
              <>
                <ShieldCheck className="h-3.5 w-3.5" /> Activate
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      {/* Card body. */}
      {/* body */}
      <CardContent className="space-y-3">
        {/* Top stats row — emergency / insurance / nearest. */}
        {/* แถวสรุป — emergency / ประกัน / ใกล้สุด */}
        <div className="grid grid-cols-3 gap-2">
          {/* Emergency call readiness. */}
          {/* ความพร้อมเรียกฉุกเฉิน */}
          <ReadinessStat
            icon={<Phone className="h-3.5 w-3.5" />}
            label="Emergency"
            value="Ready"
            good
          />
          {/* Insurance presence. */}
          {/* การมีประกันในระบบ */}
          <ReadinessStat
            icon={<IdCard className="h-3.5 w-3.5" />}
            label="Insurance"
            value={user.insurance ? "On file" : "Missing"}
            good={!!user.insurance}
          />
          {/* Distance to nearest facility (mock from SOS_FACILITIES[0]). */}
          {/* ระยะถึงสถานที่ใกล้สุด (mock จาก SOS_FACILITIES[0]) */}
          <ReadinessStat
            icon={<Hospital className="h-3.5 w-3.5" />}
            label="Nearest"
            value={`${SOS_FACILITIES[0]?.distanceKm ?? 0} km`}
            good
          />
        </div>

        {active && user.insurance && (
          /* Insurance card — shown only in active mode and when present. */
          /* การ์ดประกัน — โชว์เฉพาะตอน active และมีประกัน */
          <InsuranceCard insurance={user.insurance} user={user} />
        )}
        {active && !user.insurance && (
          /* Warning panel — active but no insurance on file. */
          /* panel เตือน — active แต่ไม่มีประกัน */
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
            {/* Warning title. */}
            {/* หัวข้อเตือน */}
            <div className="font-medium text-amber-700 dark:text-amber-300">
              No travel insurance on file
            </div>
            {/* Body copy. */}
            {/* ข้อความ */}
            <p className="mt-0.5 text-muted-foreground">
              Add policy details from your profile so first responders can act
              faster.
            </p>
          </div>
        )}

        {/* Facility list. */}
        {/* รายการสถานที่ */}
        <ul className="space-y-2">
          {SOS_FACILITIES.map((f) => {
            // Resolve icon + tone color per facility type.
            // ดึง icon + สีตามหมวด
            const Icon = ICONS[f.type];
            const tone =
              f.type === "Hospital"
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-300"
                : f.type === "Police"
                ? "bg-blue-500/15 text-blue-600 dark:text-blue-300"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300";
            return (
              // One facility row.
              // แถวสถานที่หนึ่งแถว
              <li
                key={`${f.type}-${f.name}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-secondary/30 p-3"
              >
                {/* Left cluster — colored icon tile + name/type. */}
                {/* กลุ่มซ้าย — กระเบื้องสี + ชื่อ/หมวด */}
                <div className="flex min-w-0 items-center gap-3">
                  {/* Icon tile with category-colored background. */}
                  {/* กระเบื้อง icon */}
                  <div
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                      tone
                    )}
                  >
                    {/* Category icon. */}
                    {/* ไอคอนหมวด */}
                    <Icon className="h-4 w-4" />
                  </div>
                  {/* Name + type/distance line. */}
                  {/* ชื่อ + หมวด/ระยะ */}
                  <div className="min-w-0">
                    {/* Facility name (truncated). */}
                    {/* ชื่อสถานที่ (ตัดท้าย) */}
                    <div className="truncate text-sm font-medium">{f.name}</div>
                    {/* "Type · {n} km" caption. */}
                    {/* คำว่า "Type · n km" */}
                    <div className="text-[11px] text-muted-foreground">
                      {f.type} · {f.distanceKm} km away
                    </div>
                  </div>
                </div>
                {/* Call button — turns destructive in active+Hospital case. */}
                {/* ปุ่มโทร — เปลี่ยนเป็น destructive ถ้า active และเป็นโรงพยาบาล */}
                <Button
                  size="sm"
                  variant={active && f.type === "Hospital" ? "destructive" : "glass"}
                  asChild
                >
                  <a href={`tel:${f.phone.replace(/\s/g, "")}`}>
                    <Phone className="h-3.5 w-3.5" /> Call
                  </a>
                </Button>
              </li>
            );
          })}
        </ul>

        {/* Safety checklist card. */}
        {/* การ์ด checklist ความปลอดภัย */}
        <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3">
          {/* Header. */}
          {/* หัว */}
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {/* Check icon. */}
            {/* ไอคอนถูก */}
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Quick safety card
          </div>
          {/* Items grid. */}
          {/* รายการ */}
          <div className="grid gap-2 text-[11px] text-muted-foreground">
            {/* Item 1 — share location with the group. */}
            {/* รายการที่ 1 — แชร์ตำแหน่งกับกลุ่ม */}
            <div className="flex items-center justify-between gap-2">
              <span>Share location with your group</span>
              <Badge variant="secondary">Recommended</Badge>
            </div>
            {/* Item 2 — keep ID/passport accessible. */}
            {/* รายการที่ 2 — เก็บ ID/พาสปอร์ตให้หยิบง่าย */}
            <div className="flex items-center justify-between gap-2">
              <span>Keep passport or ID accessible</span>
              <Badge variant="secondary">Travel ready</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Small "readiness" stat tile used in the 3-up row at the top of
 * the widget. Green when `good`, amber otherwise.
 *
 * (TH) tile สรุปสถานะ — เขียวเมื่อ `good`, เหลืองเมื่อไม่
 */
function ReadinessStat({
  icon,
  label,
  value,
  good,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  good: boolean;
}) {
  return (
    // Tile wrapper.
    // ตัวห่อ tile
    <div className="rounded-2xl border border-border/60 bg-secondary/30 p-2.5">
      {/* Colored icon badge. */}
      {/* กระเบื้อง icon สี */}
      <div
        className={cn(
          "mb-1 inline-flex h-7 w-7 items-center justify-center rounded-xl",
          good
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
            : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
        )}
      >
        {icon}
      </div>
      {/* Uppercase label. */}
      {/* label ตัวพิมพ์ใหญ่ */}
      <div className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {/* Value. */}
      {/* ค่า */}
      <div className="truncate text-xs font-semibold">{value}</div>
    </div>
  );
}

/**
 * Decorative "insurance card" panel shown when SOS is active and the
 * user has insurance on file. Looks like a wallet card with policy
 * info + a generated pseudo-barcode.
 *
 * (TH) panel การ์ดประกันที่ดูเหมือนบัตรในกระเป๋า แสดงเลขกรมธรรม์ ผู้ติดต่อ
 * และ barcode mock ใช้เลขกรมธรรม์
 */
function InsuranceCard({
  insurance,
  user,
}: {
  insurance: InsuranceDetails;
  user: User;
}) {
  return (
    // Gradient card.
    // การ์ดไล่สี
    <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-teal-500/15 p-4">
      {/* Two-column layout — info on the left, barcode on the right. */}
      {/* layout 2 คอลัมน์ — ข้อมูลซ้าย, barcode ขวา */}
      <div className="flex items-start justify-between">
        {/* Info column. */}
        {/* คอลัมน์ข้อมูล */}
        <div>
          {/* Active insurance badge. */}
          {/* badge ประกัน active */}
          <Badge variant="success" className="mb-1.5">
            <ShieldCheck className="h-3 w-3" /> Active travel insurance
          </Badge>
          {/* Provider name. */}
          {/* ชื่อบริษัทประกัน */}
          <div className="text-lg font-semibold tracking-tight">
            {insurance.provider}
          </div>
          {/* Policy number caption. */}
          {/* เลขกรมธรรม์ */}
          <div className="text-xs text-muted-foreground">
            Policy {insurance.policyNumber}
          </div>
          {/* Emergency contact — tap-to-call link. */}
          {/* ผู้ติดต่อฉุกเฉิน — ลิงก์ tap-to-call */}
          <div className="mt-1 text-xs">
            Emergency:{" "}
            <a
              href={`tel:${insurance.emergencyContact.replace(/\s/g, "")}`}
              className="font-medium text-accent"
            >
              {insurance.emergencyContact}
            </a>
          </div>
          {/* Insured-person caption. */}
          {/* คำว่าผู้เอาประกัน */}
          <div className="mt-2 text-[11px] text-muted-foreground">
            Insured: {user.firstName} {user.lastName} · DOB on file
          </div>
        </div>
        {/* Decorative barcode mock. */}
        {/* barcode mock ตกแต่ง */}
        <BarcodeMock value={insurance.policyNumber} />
      </div>
    </div>
  );
}

/**
 * Render a deterministic pseudo-barcode based on character codes of
 * the policy number. Purely decorative — does not encode anything
 * scannable.
 *
 * (TH) วาด barcode mock จาก char code ของเลขกรมธรรม์ — สำหรับโชว์เท่านั้น
 * ไม่ใช่ barcode จริง
 */
function BarcodeMock({ value }: { value: string }) {
  // Memoize the bar widths/fills so they're stable for a given value.
  // memo bar widths/fills เพื่อให้คงที่ตามค่า value
  const bars = React.useMemo(() => {
    const seed = (value || "POLICY").split("");
    return Array.from({ length: 36 }, (_, i) => {
      const c = seed[i % seed.length]?.charCodeAt(0) ?? 0;
      const width = ((c + i) % 3) + 1;
      const filled = (c + i) % 5 !== 0;
      return { width, filled };
    });
  }, [value]);
  return (
    // Barcode wrapper.
    // ตัวห่อ barcode
    <div className="flex flex-col items-end gap-1 rounded-xl bg-white p-2 dark:bg-white/90">
      {/* Bar row. */}
      {/* แถวขีดของ barcode */}
      <div className="flex h-10 items-end gap-[2px]">
        {bars.map((b, i) => (
          /* One bar — either solid black or background-color. */
          /* ขีดหนึ่งอัน — ดำ หรือเว้นว่าง */
          <span
            key={i}
            className={cn(
              "h-full",
              b.filled ? "bg-neutral-900" : "bg-white"
            )}
            style={{ width: b.width }}
          />
        ))}
      </div>
      {/* Policy number caption under the bars. */}
      {/* เลขกรมธรรม์ใต้ barcode */}
      <span className="font-mono text-[9px] text-neutral-700">{value}</span>
    </div>
  );
}
