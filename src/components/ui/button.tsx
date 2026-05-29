/**
 * @file Reusable `<Button>` primitive built on top of Radix's `Slot` and
 * `class-variance-authority`. Centralizes every visual variant (default,
 * accent, destructive, outline, secondary, ghost, link, glass) and size
 * (default, sm, lg, icon) used across the app.
 *
 * (TH) ปุ่มมาตรฐานของแอป ใช้ Radix `Slot` + cva สำหรับ variant/size รวมศูนย์
 * ทุก style ของปุ่มไว้ที่นี่ที่เดียว — ถ้าอยากเพิ่มสี/ขนาดใหม่ ให้แก้
 * `buttonVariants` ด้านล่าง แทนการเขียน className เองในหน้าอื่น ๆ
 */

"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ─── Variants ────────────────────────────────────────────────────────────────

/**
 * Tailwind class recipe for the button. Edit here to change any look —
 * the rest of the codebase reads variants by name instead of hard-coding
 * classes.
 *
 * (TH) สูตร class ของปุ่ม — แก้ที่นี่ที่เดียวจะมีผลทั้งโปรเจกต์ คอมโพเนนต์
 * อื่น ๆ จะอ้าง variant ด้วยชื่อ ไม่ใช้ className เอง
 */
const buttonVariants = cva(
  // Base classes shared by every variant/size.
  // class พื้นฐานที่ทุก variant และทุก size ใช้ร่วมกัน
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary brand action.
        // ปุ่มหลักของแบรนด์
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        // Eye-catching gradient for "hero" CTAs.
        // ปุ่มเด่นแบบไล่สีสำหรับ CTA ใหญ่
        accent:
          "bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:brightness-110 shadow-lg shadow-blue-500/20",
        // Dangerous actions (delete, sign out).
        // การกระทำเสี่ยง (ลบ, ออกจากระบบ)
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // Quiet bordered button for secondary actions.
        // ปุ่มเส้นขอบสำหรับ action รอง
        outline:
          "border border-border bg-transparent hover:bg-secondary text-foreground",
        // Muted background, used inside dense lists.
        // ปุ่มสีเงียบ ๆ ใช้ในรายการที่หนาแน่น
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // No background until hover — minimal toolbar buttons.
        // ไม่มีพื้นหลังจนกว่าจะ hover — สำหรับ toolbar
        ghost: "hover:bg-secondary text-foreground",
        // Inline text link styling.
        // ลิงก์ข้อความ inline
        link: "text-accent underline-offset-4 hover:underline",
        // Glassmorphism look (frosted blur on photos / colored backgrounds).
        // เอฟเฟกต์กระจกฝ้าสำหรับวางทับรูป/พื้นหลังสี
        glass:
          "bg-white/60 dark:bg-white/10 backdrop-blur-xl border border-white/50 dark:border-white/10 text-foreground hover:bg-white/80 dark:hover:bg-white/20",
      },
      size: {
        // Standard 44px tap-target height.
        // ความสูงมาตรฐาน 44px (เหมาะกับการแตะบนมือถือ)
        default: "h-11 px-5 py-2",
        // Compact size — still tap-friendly but smaller text.
        // ขนาดกะทัดรัด — ยังกดสะดวก แต่ตัวอักษรเล็กลง
        sm: "h-11 px-4 text-xs",
        // Large CTA size.
        // ปุ่ม CTA ขนาดใหญ่
        lg: "h-12 px-7 text-base",
        // Square icon-only button.
        // ปุ่ม icon ทรงสี่เหลี่ยมจัตุรัส
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Props for `<Button>`. Inherits every native `<button>` attribute,
 * plus `variant` / `size` from `buttonVariants`. Set `asChild` to render
 * a different element (commonly `<Link>`) while keeping the button styles.
 *
 * (TH) Props ของ `<Button>` — รับ attribute ของ native button ทั้งหมด
 * บวก `variant`/`size` ของ cva ตั้ง `asChild` เพื่อ render element อื่น
 * (เช่น `<Link>`) โดยยังคงสไตล์ปุ่มไว้
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/**
 * Render a styled button (or any other element when `asChild`).
 * Forwards refs and spreads all native button props.
 *
 * (TH) แสดงปุ่มที่จัด style แล้ว ส่ง ref ต่อไปยัง DOM ได้ตามปกติ และ
 * รองรับการเปลี่ยน element ผ่าน `asChild`
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // Use Radix Slot when caller wants a custom element (e.g. <Link>).
    // เลือก Slot ของ Radix เมื่อต้องการ render เป็น element อื่น เช่น <Link>
    const Comp = asChild ? Slot : "button";
    return (
      // Single rendered element: <button> by default, otherwise the child.
      // element ที่ render: <button> โดย default, หรือ child ตาม asChild
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
