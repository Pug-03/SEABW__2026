/**
 * @file `<Badge>` — small pill-shaped label used for tags, statuses, and
 * micro-indicators (e.g. "AI", "Free Wi-Fi", success/warning chips).
 * Variants centralize all the color/border combinations.
 *
 * (TH) `<Badge>` ป้ายเล็กทรงแคปซูล ใช้แสดงแท็ก สถานะ หรือ chip ขนาดเล็ก
 * (เช่น "AI", "Free Wi-Fi", สถานะ success/warning) รวมสีและขอบไว้ที่
 * variant เพื่อให้ใช้งานง่ายและสม่ำเสมอ
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ─── Variants ────────────────────────────────────────────────────────────────

/**
 * Tailwind class recipe for the badge. Each variant has a distinct
 * background/text/border combo for instant visual meaning.
 *
 * (TH) สูตร class ของ badge แต่ละ variant มีคู่สี พื้นหลัง/ข้อความ/ขอบ
 * ที่แตกต่างกันเพื่อสื่อความหมายได้ทันที
 */
const badgeVariants = cva(
  // Base pill shape with horizontal spacing for icon + text.
  // ฐาน: ทรงแคปซูล มี gap สำหรับ icon + ข้อความ
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        // Solid brand color.
        // สีหลักของแบรนด์
        default: "bg-primary text-primary-foreground",
        // Muted background for neutral chips.
        // สีพื้นจาง สำหรับ chip ปกติ
        secondary: "bg-secondary text-secondary-foreground",
        // Outlined version — transparent fill.
        // แบบเส้นขอบ พื้นใส
        outline: "border border-border text-foreground",
        // Accent (blue/indigo) chip.
        // สี accent (น้ำเงิน/อินดิโก้)
        accent: "bg-accent/15 text-accent border border-accent/30",
        // Green — positive states like "Available".
        // สีเขียว — สถานะดี เช่น "Available"
        success:
          "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",
        // Amber — caution, "Limited stock", etc.
        // สีเหลือง — เตือน, "Limited stock" ฯลฯ
        warning:
          "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30",
        // AI-branded gradient — marks AI-generated content.
        // ไล่สี AI — ใช้กับเนื้อหาที่ AI สร้างขึ้น
        ai: "bg-gradient-to-r from-fuchsia-500/20 to-indigo-500/20 text-indigo-700 dark:text-indigo-200 border border-indigo-400/40",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Props for `<Badge>`. Inherits native `<div>` attributes plus a
 * `variant` chooser. No `asChild` because badges are display-only.
 *
 * (TH) Props ของ `<Badge>` รับ attribute ของ <div> ทั้งหมด พร้อม `variant`
 * ไม่มี `asChild` เพราะ badge เป็น element แสดงผลอย่างเดียว
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Render a styled badge. Children are usually a short label string
 * with an optional leading lucide icon.
 *
 * (TH) แสดง badge ที่จัด style แล้ว children ทั่วไปเป็นข้อความสั้น
 * บวก icon นำหน้าจาก lucide (ถ้ามี)
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  // Single <div> rendering — variant + caller-supplied class merged.
  // render เป็น <div> เดียว รวม variant กับ className จาก caller
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
