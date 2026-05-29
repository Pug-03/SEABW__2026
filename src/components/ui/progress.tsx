/**
 * @file `<Progress>` — accessible progress bar built on Radix Progress.
 * The fill is a blue→indigo gradient that animates between values.
 *
 * Pass a numeric `value` in 0–100. Anything else (e.g. omitted/null)
 * renders an empty bar.
 *
 * (TH) แถบความคืบหน้าบน Radix Progress รองรับ a11y ตัว fill เป็น
 * ไล่สีน้ำเงิน→อินดิโก้พร้อมแอนิเมตเปลี่ยนค่า ส่งค่า `value` ระหว่าง 0–100
 * ถ้าไม่ส่งหรือเป็น null จะแสดงเป็นแถบว่าง
 */

"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

/**
 * Progress bar component. Forwards refs and accepts all Radix Progress
 * props (notably `value` and `max`).
 *
 * (TH) คอมโพเนนต์ progress bar ส่ง ref ต่อไปยัง DOM และรับ props ของ
 * Radix Progress ครบ (สำคัญสุดคือ `value` และ `max`)
 */
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  // Outer track — neutral background bar that holds the indicator.
  // แทร็กด้านนอก — แถบสีเงียบ ๆ ที่เก็บ indicator
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    {/* Inner indicator — animates via `translateX` based on value (0..100). */}
    {/* แถบ indicator ภายใน — ขยับด้วย translateX ตามค่า value (0..100) */}
    <ProgressPrimitive.Indicator
      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
