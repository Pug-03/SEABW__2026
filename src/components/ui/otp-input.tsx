/**
 * @file `<OtpInput>` — a row of individual single-digit boxes for entering a
 * one-time passcode. Controlled: the parent owns the full `value` string and
 * receives updates via `onChange`. Handles the fiddly UX you expect from OTP
 * fields: auto-advance on type, backspace-to-previous, arrow navigation,
 * full-code paste, and digit-only filtering.
 *
 * (TH) คอมโพเนนต์ `<OtpInput>` — แถวช่องกรอกตัวเลขทีละหลักสำหรับ OTP เป็น
 * controlled (parent ถือ `value` เต็มและรับค่าผ่าน `onChange`) จัดการ UX ของ
 * ช่อง OTP ให้ครบ: เลื่อนช่องอัตโนมัติเมื่อพิมพ์, backspace ย้อนกลับ, ปุ่ม
 * ลูกศร, วาง (paste) ทั้งโค้ด และกรองให้เหลือเฉพาะตัวเลข
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Props for `<OtpInput>`.
 * (TH) Props ของ `<OtpInput>`
 */
interface OtpInputProps {
  /** Current code (0–`length` digits). */
  /** (TH) โค้ดปัจจุบัน (0–`length` หลัก) */
  value: string;
  /** Called with the new code on every change. */
  /** (TH) ถูกเรียกพร้อมโค้ดใหม่ทุกครั้งที่เปลี่ยน */
  onChange: (next: string) => void;
  /** Number of digit boxes. Defaults to 6. */
  /** (TH) จำนวนช่องตัวเลข ค่าเริ่มต้น 6 */
  length?: number;
  /** Disable all inputs (e.g. during verify or lockout). */
  /** (TH) ปิดการใช้งานทุกช่อง (เช่นระหว่าง verify หรือถูกล็อก) */
  disabled?: boolean;
  /** Paint the error ring when true. */
  /** (TH) แสดงขอบสีแดงเมื่อเป็น true */
  invalid?: boolean;
  /** Focus the first box on mount. */
  /** (TH) โฟกัสช่องแรกตอน mount */
  autoFocus?: boolean;
  /** id of the element describing this field (for aria-describedby). */
  /** (TH) id ขององค์ประกอบที่อธิบายฟิลด์นี้ (สำหรับ aria-describedby) */
  describedBy?: string;
}

/**
 * Render `length` digit boxes wired to a single `value` string.
 *
 * (TH) render ช่องตัวเลข `length` ช่อง ผูกกับสตริง `value` เดียว
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  invalid = false,
  autoFocus = false,
  describedBy,
}: OtpInputProps) {
  // One ref per box so we can move focus programmatically.
  // ref ต่อหนึ่งช่อง เพื่อย้ายโฟกัสด้วยโค้ดได้
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);

  // Focus the first box on mount when asked.
  // โฟกัสช่องแรกตอน mount เมื่อร้องขอ
  React.useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  // The code split into fixed slots so each box reads its own char.
  // แยกโค้ดเป็นช่องคงที่ เพื่อให้แต่ละกล่องอ่านตัวอักษรของตัวเอง
  const digits = React.useMemo(
    () => Array.from({ length }, (_, i) => value[i] ?? ""),
    [value, length]
  );

  /** Move focus to box `i`, clamped to the valid range. */
  /** (TH) ย้ายโฟกัสไปช่อง `i` โดยจำกัดให้อยู่ในช่วงที่ถูกต้อง */
  const focusBox = (i: number) => {
    const clamped = Math.max(0, Math.min(length - 1, i));
    refs.current[clamped]?.focus();
    refs.current[clamped]?.select();
  };

  /**
   * Handle typing in box `i`. We only ever take the last typed digit, write
   * it into slot `i`, and advance. Non-digits are ignored.
   *
   * (TH) จัดการการพิมพ์ในช่อง `i` รับเฉพาะตัวเลขตัวสุดท้ายที่พิมพ์ เขียนลง
   * ช่อง `i` แล้วเลื่อนไปช่องถัดไป ตัวที่ไม่ใช่ตัวเลขจะถูกละทิ้ง
   */
  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    const arr = Array.from({ length }, (_, k) => value[k] ?? "");
    arr[i] = digit;
    onChange(arr.join("").slice(0, length));
    if (i < length - 1) focusBox(i + 1);
  };

  /**
   * Keyboard handling: backspace clears current (or steps back when empty),
   * arrows navigate between boxes.
   *
   * (TH) จัดการคีย์บอร์ด: backspace ล้างช่องปัจจุบัน (หรือถอยกลับเมื่อว่าง),
   * ลูกศรเลื่อนระหว่างช่อง
   */
  const handleKeyDown = (
    i: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const arr = Array.from({ length }, (_, k) => value[k] ?? "");
      if (arr[i]) {
        // Clear the current box but keep focus here.
        // ล้างช่องปัจจุบันแต่คงโฟกัสไว้ที่เดิม
        arr[i] = "";
        onChange(arr.join(""));
      } else if (i > 0) {
        // Already empty → clear the previous box and move back.
        // ว่างอยู่แล้ว → ล้างช่องก่อนหน้าและถอยกลับ
        arr[i - 1] = "";
        onChange(arr.join(""));
        focusBox(i - 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusBox(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusBox(i + 1);
    }
  };

  /**
   * Paste a whole code into any box: take the first `length` digits and
   * focus the box after the last filled one.
   *
   * (TH) วางทั้งโค้ดลงช่องใดก็ได้: ดึงตัวเลข `length` ตัวแรก แล้วโฟกัสช่อง
   * ถัดจากช่องที่เติมล่าสุด
   */
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    focusBox(Math.min(pasted.length, length - 1));
  };

  return (
    // Row of boxes — evenly spaced, wraps to fit small screens.
    // แถวของช่อง — เว้นระยะเท่ากัน และพอดีกับจอเล็ก
    <div className="flex items-center justify-between gap-2 sm:gap-3" role="group" aria-label="One-time passcode">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={d}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            // Square-ish box, centered large digit.
            // ช่องทรงเกือบสี่เหลี่ยม ตัวเลขใหญ่จัดกึ่งกลาง
            "h-12 w-full min-w-0 rounded-2xl border bg-background/50 text-center text-lg font-semibold transition-colors sm:h-14 sm:text-xl",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            invalid ? "border-destructive" : "border-input"
          )}
        />
      ))}
    </div>
  );
}
