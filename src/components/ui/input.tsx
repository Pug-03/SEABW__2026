/**
 * @file `<Input>` — styled wrapper around the native `<input>` element.
 * Adds rounded corners, a translucent background, focus ring, and
 * disabled/file variants. Forwards refs and accepts every native input prop.
 *
 * (TH) คอมโพเนนต์ `<Input>` ที่ห่อ <input> ของ HTML เพิ่มสไตล์มุมโค้ง
 * พื้นหลังโปร่งใส focus ring และจัด state disabled/file ให้พร้อมใช้งาน
 * รับ ref และ props ของ input ปกติทุกตัว
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Props for `<Input>`. Inherits every native `<input>` attribute —
 * we expose this empty interface so callers can extend it consistently
 * without writing the lengthy React type each time.
 *
 * (TH) Props ของ `<Input>` สืบทอด attribute ของ <input> ทั้งหมด —
 * ประกาศ interface ว่างไว้เพื่อให้ caller ใช้/ขยายต่อได้ง่ายกว่าเขียน
 * React.InputHTMLAttributes ทุกครั้ง
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Rendered as a real `<input>` element — `type` defaults to text but
 * passes through ("email", "password", "file", etc.). Refs forward to
 * the underlying DOM node.
 *
 * (TH) render เป็น <input> จริง รับ `type` ปกติ (text, email, password,
 * file ฯลฯ) และส่ง ref ลงไปยัง DOM node เพื่อให้ฟอร์มภายนอกควบคุมได้
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      // The single rendered input element with merged classes.
      // element เดียวที่ render: <input> รวม class กับ className ที่ส่งมา
      <input
        type={type}
        ref={ref}
        className={cn(
          // Base layout, height, padding, font.
          // layout พื้นฐาน: ขนาด ความสูง padding และ font
          "flex h-11 w-full rounded-2xl border border-input bg-background/50 px-4 py-2 text-sm transition-colors",
          // Placeholder text styling.
          // สไตล์ของ placeholder
          "placeholder:text-muted-foreground/70",
          // Focused state ring.
          // เส้นรอบเมื่อ focus
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
          // Disabled state styling.
          // สไตล์เมื่อถูก disabled
          "disabled:cursor-not-allowed disabled:opacity-50",
          // File-input chooser styling.
          // สไตล์ของปุ่มเลือกไฟล์ (type=file)
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
