/**
 * @file Avatar primitives wrapping Radix Avatar. Three pieces:
 *   - `<Avatar>`         — round container.
 *   - `<AvatarImage>`    — actual user image (or destination thumb).
 *   - `<AvatarFallback>` — initials/icon shown while loading or on error.
 *
 * (TH) ชุดคอมโพเนนต์ Avatar ครอบ Radix Avatar 3 ตัว: ตัวห่อ (Avatar),
 * รูปจริง (AvatarImage), และ fallback (AvatarFallback) สำหรับแสดงตอนรูป
 * ยังโหลดไม่เสร็จหรือโหลดล้มเหลว
 */

"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

/**
 * Outer avatar container. Always rounded and hides overflow so any
 * child image is clipped into a perfect circle.
 *
 * (TH) ตัวห่อ avatar ภายนอก ทรงกลมและซ่อนส่วนเกิน — เพื่อ clip รูปลูก
 * ให้เป็นวงกลมพอดี
 */
const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  // Avatar root — Radix handles the load/error logic for us.
  // Avatar root ของ Radix — จัดการ load/error ให้แล้ว
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

/**
 * The actual `<img>` shown inside an `<Avatar>`. Object-cover ensures
 * non-square photos fill the circle without distortion.
 *
 * (TH) tag <img> จริงภายใน Avatar ใช้ object-cover เพื่อให้รูปไม่จัตุรัส
 * เต็มวงกลมโดยไม่บิดเบี้ยว
 */
const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  // Image — Radix shows fallback automatically if this fails to load.
  // image — ถ้าโหลดล้มเหลว Radix จะสลับไปแสดง fallback ให้เอง
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

/**
 * Placeholder shown when the image is missing/loading. Typically holds
 * the user's initials. Default style is a blue/indigo gradient.
 *
 * (TH) ตัวสำรองเมื่อรูปยังไม่มี/กำลังโหลด/โหลดล้มเหลว มักใส่อักษรย่อชื่อ
 * เป็นไล่สีน้ำเงิน-อินดิโก้เป็นค่าเริ่มต้น
 */
const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  // Fallback — gradient circle that shows initials or an icon.
  // fallback — วงกลมไล่สีสำหรับใส่อักษรย่อชื่อหรือ icon
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-white text-sm font-semibold",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
