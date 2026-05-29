/**
 * @file `<Label>` — thin styled wrapper around Radix's accessible label
 * primitive. Standard form label styling (small, medium weight) with
 * automatic dimming when the associated input is disabled (peer-disabled).
 *
 * (TH) คอมโพเนนต์ `<Label>` ห่อ Radix Label ที่รองรับ a11y อยู่แล้ว เพิ่ม
 * สไตล์มาตรฐานของ label ในฟอร์ม (เล็ก หนาปานกลาง) และจะหรี่ลงอัตโนมัติ
 * เมื่อ input ที่ associate ถูก disabled ผ่าน peer-disabled
 */

"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

/**
 * Forwarded-ref Label. Pair with a form control via `htmlFor`:
 *   <Label htmlFor="email">Email</Label>
 *   <Input id="email" ... />
 *
 * (TH) ใช้คู่กับ input ผ่าน `htmlFor` เพื่อให้ screen reader/บราวเซอร์
 * จับคู่ label กับ field ได้ถูกต้อง
 */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  // Radix label root — handles a11y for us, we only add styling.
  // Radix label root จัดการ accessibility ให้แล้ว เราแค่เติมสไตล์
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none text-foreground/80 peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
