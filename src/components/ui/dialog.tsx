/**
 * @file Modal dialog primitives — thin styled wrappers around Radix's
 * accessible dialog. Re-exports the unstyled pieces (`Dialog`,
 * `DialogTrigger`, `DialogPortal`, `DialogClose`) alongside the styled
 * ones (`DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogFooter`,
 * `DialogTitle`, `DialogDescription`).
 *
 * Composition pattern:
 *   <Dialog>
 *     <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
 *     <DialogContent>
 *       <DialogHeader>
 *         <DialogTitle>...</DialogTitle>
 *         <DialogDescription>...</DialogDescription>
 *       </DialogHeader>
 *       ...body...
 *       <DialogFooter>...buttons...</DialogFooter>
 *     </DialogContent>
 *   </Dialog>
 *
 * (TH) ชุดคอมโพเนนต์ modal dialog ห่อ Radix Dialog ที่รองรับ a11y
 * แล้ว ทั้ง overlay พื้นหลังเบลอ ปุ่มปิดมุมขวาบน และ animation เปิด/ปิด
 * เรียก Trigger + Content ลักษณะตามตัวอย่างด้านบน
 */

"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Unstyled re-exports ─────────────────────────────────────────────────────
// These don't need wrapping — they carry no visual styling, only logic.
// อันนี้ไม่ต้องห่อเพิ่ม เพราะเป็น logic ไม่มี style

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

// ─── Overlay (the dimmed/blurred background) ─────────────────────────────────

/**
 * Fullscreen dim+blur layer behind the dialog. Animated in/out via
 * Radix's data-state attributes. Rendered automatically by `DialogContent`.
 *
 * (TH) เลเยอร์มืดเบลอเต็มจอด้านหลัง dialog แอนิเมตเปิด/ปิดผ่าน data-state
 * ของ Radix `DialogContent` จะ render ตัวนี้ให้อัตโนมัติ
 */
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  // Fixed positioning so it covers the entire viewport.
  // ใช้ position fixed เพื่อคลุมทั้ง viewport
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// ─── Content (the centered card with the close button) ──────────────────────

/**
 * The visible modal body. Renders inside a Portal so it escapes any
 * parent stacking context. Includes the dim overlay and a built-in
 * close button in the upper right.
 *
 * (TH) เนื้อหา modal ที่ผู้ใช้เห็น render ใน Portal เพื่อไม่ติดบริบทของ
 * ตัวห่อด้านนอก รวม overlay และปุ่มปิด (X) มุมขวาบนให้พร้อม
 */
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  // Portal — escapes any parent stacking/overflow context.
  // Portal — หลุดออกจาก stacking/overflow ของ parent
  <DialogPortal>
    {/* Dimmed background. */}
    {/* พื้นหลังมืด */}
    <DialogOverlay />
    {/* Centered modal panel. */}
    {/* แผง modal ที่จัดกึ่งกลางจอ */}
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Layout + sizing.
        // layout และขนาด
        "fixed left-1/2 top-1/2 z-50 grid w-[calc(100vw-1rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4",
        // Surface styling.
        // สไตล์พื้นผิว
        "rounded-2xl border border-border/60 bg-card/95 backdrop-blur-2xl p-4 shadow-2xl sm:rounded-3xl sm:p-6",
        // Open/close animation flags.
        // ธง animation เปิด/ปิด
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        // Constrain max height and allow scrolling.
        // จำกัดความสูงและให้เลื่อนข้างในได้
        "max-h-[calc(100dvh-1rem)] overflow-y-auto",
        className
      )}
      {...props}
    >
      {/* Caller-provided body content. */}
      {/* เนื้อหาที่ caller ส่งเข้ามา */}
      {children}
      {/* Built-in close (X) button. */}
      {/* ปุ่มปิด (X) ในตัว */}
      <DialogPrimitive.Close
        className="absolute right-4 top-4 rounded-full p-1.5 opacity-70 transition-opacity hover:opacity-100 hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Close"
      >
        {/* Close icon */}
        {/* ไอคอน X */}
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

// ─── Header / footer / title / description ──────────────────────────────────

/**
 * Header row of a dialog — vertical stack of title + description.
 *
 * (TH) แถวหัวของ dialog เรียงแนวตั้ง title + description
 */
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  // Vertical stack with consistent spacing.
  // เรียงแนวตั้งและเว้นระยะให้สม่ำเสมอ
  <div
    className={cn("flex flex-col space-y-1.5 text-left", className)}
    {...props}
  />
);

/**
 * Footer row of a dialog — stacks vertically on mobile, horizontally
 * on `sm:` and up (right-aligned).
 *
 * (TH) แถวล่างของ dialog: มือถือเรียงแนวตั้ง, จอ sm ขึ้นไปเรียงแนวนอน
 * และชิดขวา
 */
const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  // Responsive flex: column on mobile, reversed-row on desktop.
  // flex responsive: คอลัมน์บนมือถือ, แถวกลับด้านบนจอ sm ขึ้นไป
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);

/**
 * Dialog heading. Radix wires this up as the accessible label.
 *
 * (TH) หัวข้อของ dialog Radix จะผูกตัวนี้เป็น aria-label ให้อัตโนมัติ
 */
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  // Radix Title — large bold heading, becomes aria-labelledby target.
  // Radix Title — หัวข้อตัวใหญ่ Radix จะใช้เป็น aria-labelledby ให้
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-xl font-semibold tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

/**
 * Dialog subtitle text. Wired up as aria-describedby by Radix.
 *
 * (TH) คำอธิบายเสริมของ dialog Radix ผูกเป็น aria-describedby ให้
 */
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  // Muted description text under the title.
  // ข้อความบรรยายสีจางใต้ title
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
