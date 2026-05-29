/**
 * @file `<BillSplitter>` — a small calculator widget that splits a
 * total amount between N people and produces a PromptPay QR for the
 * per-person share. People count is clamped to [2, 20]; the QR string
 * format is a simplified mock — replace `buildPromptPayQrString` with a
 * real PromptPay EMV-QR generator before going to production.
 *
 * (TH) วิดเจ็ตคำนวณการแบ่งบิล + สร้าง QR PromptPay สำหรับแต่ละคนจ่าย
 * จำนวนคนถูก clamp ไว้ที่ [2, 20] และฟอร์แมต QR เป็น mock — ก่อนใช้จริงต้อง
 * เปลี่ยน `buildPromptPayQrString` ให้ออก EMV-QR จริง
 */

"use client";

import * as React from "react";
import { Minus, Plus, QrCode, Receipt, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QRCode } from "@/components/common/qr-code";
import { formatCurrency } from "@/lib/utils";

// Bounds for the number of people in a split.
// ขอบเขตจำนวนคนในการหาร
const MIN_PEOPLE = 2;
const MAX_PEOPLE = 20;

/**
 * Build a mock PromptPay QR payload. Real PromptPay uses an EMV TLV
 * format that includes the recipient's mobile/id and a checksum —
 * this stub is enough to produce a scannable shape in screenshots.
 *
 * (TH) สร้าง payload QR PromptPay แบบ mock — ของจริงต้องเป็น EMV TLV
 * พร้อมเบอร์/เลขผู้รับและ checksum stub นี้ใช้พอเพื่อโชว์รูปร่าง QR
 */
function buildPromptPayQrString(amount: number): string {
  return `promptpay:0000000000:${amount.toFixed(2)}`;
}

/**
 * The bill-splitter card. Holds three pieces of state: the typed
 * amount string, the people counter, and whether the QR is currently
 * shown.
 *
 * (TH) การ์ดหารบิล มี state 3 ตัว: amount ที่ผู้ใช้พิมพ์, จำนวนคน, และ
 * ธงว่าจะโชว์ QR หรือไม่
 */
export function BillSplitter() {
  // Amount as a raw string so the user can clear it / type freely.
  // amount เป็น string เพื่อให้ผู้ใช้พิมพ์/ลบได้อิสระ
  const [amount, setAmount] = React.useState("");
  // People counter (clamped to [MIN, MAX]).
  // ตัวนับคน (clamp ระหว่าง MIN..MAX)
  const [people, setPeople] = React.useState(2);
  const [showQr, setShowQr] = React.useState(false);

  // Derived values. parseFloat falls back to 0 on bad input.
  // ค่าที่คำนวณ — parseFloat คืน 0 เมื่อ input ผิดรูป
  const total = parseFloat(amount) || 0;
  const perPerson = people > 0 && total > 0 ? total / people : 0;
  const qrValue = buildPromptPayQrString(perPerson);

  /** Clamp the people count into [MIN_PEOPLE, MAX_PEOPLE]. */
  /** (TH) clamp จำนวนคนให้อยู่ระหว่าง MIN..MAX */
  const clampPeople = (n: number) =>
    setPeople(Math.max(MIN_PEOPLE, Math.min(MAX_PEOPLE, n)));

  return (
    // Card wrapper.
    // ตัวห่อการ์ด
    <Card>
      {/* Card header — title + people badge. */}
      {/* header การ์ด — ชื่อ + badge แสดงจำนวนคน */}
      <CardHeader className="pb-3">
        {/* Header row. */}
        {/* แถวหัว */}
        <div className="flex items-center justify-between">
          {/* Title with receipt icon. */}
          {/* ชื่อพร้อมไอคอนใบเสร็จ */}
          <CardTitle className="flex items-center gap-2 text-base">
            {/* Receipt icon. */}
            {/* ไอคอนใบเสร็จ */}
            <Receipt className="h-4 w-4 text-accent" /> Bill Splitter
          </CardTitle>
          {/* Badge showing the current people count. */}
          {/* badge แสดงจำนวนคน */}
          <Badge variant="secondary">
            {/* Users icon. */}
            {/* ไอคอนคน */}
            <Users className="h-3 w-3" /> {people} people
          </Badge>
        </div>
      </CardHeader>
      {/* Card body — input row + result + QR section. */}
      {/* body การ์ด — แถวกรอก + ผลลัพธ์ + ส่วน QR */}
      <CardContent className="space-y-4">
        {/* Input row — total amount + people stepper. */}
        {/* แถวกรอก — ยอดรวม + ปุ่มเพิ่ม/ลดคน */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Amount field. */}
          {/* ช่อง amount */}
          <div className="flex-1">
            {/* Label */}
            {/* label */}
            <label className="mb-1 block text-xs text-muted-foreground">
              Total bill (฿)
            </label>
            {/* Numeric input. */}
            {/* input ตัวเลข */}
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 1500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-base"
            />
          </div>
          {/* People stepper. */}
          {/* ตัวเพิ่ม/ลดจำนวนคน */}
          <div>
            {/* Label */}
            {/* label */}
            <label className="mb-1 block text-xs text-muted-foreground">
              People
            </label>
            {/* Stepper row — minus, value, plus. */}
            {/* แถว stepper — ปุ่มลบ, เลข, ปุ่มบวก */}
            <div className="flex items-center gap-2">
              {/* Decrement button. */}
              {/* ปุ่มลดคน */}
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => clampPeople(people - 1)}
                disabled={people <= MIN_PEOPLE}
              >
                {/* Minus icon. */}
                {/* ไอคอนลบ */}
                <Minus className="h-4 w-4" />
              </Button>
              {/* Current people count, centered. */}
              {/* เลขปัจจุบันจัดกึ่งกลาง */}
              <span className="w-8 text-center text-lg font-semibold">
                {people}
              </span>
              {/* Increment button. */}
              {/* ปุ่มเพิ่มคน */}
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => clampPeople(people + 1)}
                disabled={people >= MAX_PEOPLE}
              >
                {/* Plus icon. */}
                {/* ไอคอนบวก */}
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {perPerson > 0 && (
          /* Result card — only when a positive per-person amount exists. */
          /* การ์ดผลลัพธ์ — แสดงเฉพาะเมื่อมีค่าเป็นบวก */
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4 text-center">
            {/* Helper label. */}
            {/* คำว่า "Each person pays" */}
            <div className="text-xs text-muted-foreground">
              Each person pays
            </div>
            {/* The big per-person amount. */}
            {/* ตัวเลขใหญ่ของยอดต่อคน */}
            <div className="mt-1 text-3xl font-semibold tracking-tight text-accent">
              {formatCurrency(perPerson)}
            </div>
            {total > 0 && (
              /* "Total ÷ N" subtitle. */
              /* บรรทัด "Total ÷ N" */
              <div className="mt-1 text-xs text-muted-foreground">
                Total {formatCurrency(total)} ÷ {people} people
              </div>
            )}
          </div>
        )}

        {perPerson > 0 && (
          /* QR section — toggle + the actual QR (when shown). */
          /* ส่วน QR — ปุ่มสลับ + QR จริงเมื่อกดโชว์ */
          <div className="flex flex-col items-center gap-3">
            {/* Toggle button. */}
            {/* ปุ่มสลับโชว์ QR */}
            <Button
              variant="glass"
              className="w-full"
              onClick={() => setShowQr((v) => !v)}
            >
              {/* QR icon. */}
              {/* ไอคอน QR */}
              <QrCode className="h-4 w-4" />
              {showQr ? "Hide QR" : "Generate PromptPay QR"}
            </Button>
            {showQr && (
              /* Actual QR — encoded with the per-person payload. */
              /* QR จริง — encode payload ของยอดต่อคน */
              <QRCode
                value={qrValue}
                size={160}
                label={`Scan to pay ${formatCurrency(perPerson)}`}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
