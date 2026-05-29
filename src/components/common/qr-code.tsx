/**
 * @file `<QRCode>` — wraps `qrcode.react`'s `<QRCodeCanvas>` inside a
 * white rounded card so it scans well even on dark backgrounds. Used by
 * the bill-splitter widget to render a PromptPay payment QR.
 *
 * (TH) คอมโพเนนต์แสดง QR code ห่อ `<QRCodeCanvas>` ของ qrcode.react ไว้ใน
 * การ์ดสีขาวมุมโค้ง เพื่อให้สแกนได้ดีแม้พื้นหลังเป็นโทนเข้ม ใช้กับวิดเจ็ต
 * bill splitter ที่ต้องโชว์ QR PromptPay
 */

"use client";

import { QRCodeCanvas } from "qrcode.react";
import { cn } from "@/lib/utils";

/**
 * Props for `<QRCode>`. `value` is the string encoded into the QR;
 * `size` is the rendered pixel size (default 180); `label` adds a
 * caption below the QR if provided.
 *
 * (TH) Props ของ `<QRCode>`: `value` คือสตริงที่ใส่ลง QR, `size` ขนาดพิกเซล
 * (default 180), `label` คำอธิบายเล็ก ๆ ใต้ QR (ถ้ามี)
 */
interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
  label?: string;
}

/**
 * Render a white-backed QR code card. Error-correction level "H" gives
 * the highest tolerance to occlusion — important since the card may be
 * partially covered by a thumb when held up to scan.
 *
 * (TH) แสดง QR code บนการ์ดพื้นขาว ตั้ง error-correction "H" เพื่อให้
 * รองรับการบังบางส่วนได้ — กันกรณีนิ้วบังตอนสแกน
 */
export function QRCode({ value, size = 180, className, label }: QRCodeProps) {
  return (
    // Outer card — solid white background, rounded corners, soft shadow.
    // การ์ดด้านนอก — พื้นขาว มุมโค้ง เงาบาง
    <div
      className={cn(
        "inline-flex flex-col items-center gap-2 rounded-3xl border border-border/60 bg-white p-4 text-neutral-950 shadow-lg",
        className
      )}
    >
      {/* The actual QR canvas from qrcode.react. */}
      {/* canvas ของ QR จริง ๆ จาก qrcode.react */}
      <QRCodeCanvas
        value={value}
        size={size}
        level="H"
        marginSize={2}
        bgColor="#ffffff"
        fgColor="#000000"
      />
      {/* Optional caption rendered below the QR. */}
      {/* ข้อความใต้ QR (ถ้ามีค่า) */}
      {label && (
        <span className="text-xs font-medium text-neutral-600">{label}</span>
      )}
    </div>
  );
}
