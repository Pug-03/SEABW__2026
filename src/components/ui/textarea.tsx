/**
 * @file `<Textarea>` — styled wrapper around the native `<textarea>`.
 * Same look as `<Input>` but multi-line: rounded, translucent
 * background, focus ring, and resize disabled.
 *
 * (TH) คอมโพเนนต์ `<Textarea>` ห่อ <textarea> ของ HTML จัดสไตล์ให้เข้าชุด
 * กับ `<Input>` แต่เป็นหลายบรรทัด มุมโค้ง พื้นใส มี focus ring และ
 * ปิดการขยาย/ย่อด้วยมือ (resize-none) เพื่อ layout เสถียร
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Props for `<Textarea>`. Inherits every native textarea attribute.
 *
 * (TH) Props ของ `<Textarea>` สืบทอด attribute ของ <textarea> ปกติทั้งหมด
 */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * Render a styled, ref-forwarded `<textarea>`. The minimum height of
 * 80px gives enough room for a couple of lines while preventing the
 * field from collapsing to a single-line look.
 *
 * (TH) render เป็น <textarea> ที่จัดสไตล์แล้ว ส่ง ref ต่อได้ มี min-height
 * 80px เพื่อให้รองรับหลายบรรทัดและไม่หดเป็นเหมือน input บรรทัดเดียว
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    // Single <textarea> element with merged classes.
    // element <textarea> เดียวที่ render รวม class กับ className ที่ส่งมา
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-2xl border border-input bg-background/50 px-4 py-3 text-sm transition-colors",
        "placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
