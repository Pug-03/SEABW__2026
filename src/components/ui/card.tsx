/**
 * @file `<Card>` family — a small set of styled `div`/`h3`/`p` wrappers
 * that provide consistent rounded-corner containers with header/title/
 * description/content/footer slots.
 *
 * Compose them like:
 *   <Card>
 *     <CardHeader>
 *       <CardTitle>Hello</CardTitle>
 *       <CardDescription>Subtitle</CardDescription>
 *     </CardHeader>
 *     <CardContent>...</CardContent>
 *     <CardFooter>...</CardFooter>
 *   </Card>
 *
 * (TH) ชุดคอมโพเนนต์ `<Card>` สำหรับห่อเนื้อหาเป็นการ์ดมุมโค้ง มีช่อง
 * header/title/description/content/footer ให้ประกอบกันได้ ใช้ตัวอย่างตามด้านบน
 */

import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Card root ───────────────────────────────────────────────────────────────

/**
 * Outer card container — rounded, bordered, subtly shadowed. Inherits
 * all native `<div>` attributes and forwards refs.
 *
 * (TH) ตัวห่อนอกสุดของการ์ด มุมโค้ง มีขอบและเงาบาง ๆ รับ props ของ <div>
 * ปกติทั้งหมด และส่ง ref ต่อได้
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  // Outer card surface — controls border radius, border, background, shadow.
  // ผิวด้านนอกของการ์ด: คุมมุมโค้ง ขอบ พื้นหลัง และเงา
  <div
    ref={ref}
    className={cn(
      "rounded-3xl border border-border/60 bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

// ─── Header / title / description ────────────────────────────────────────────

/**
 * Header row of a card — typically wraps `<CardTitle>` and
 * `<CardDescription>` together with consistent padding.
 *
 * (TH) แถวหัวของการ์ด ใช้ห่อ `<CardTitle>` และ `<CardDescription>`
 * โดยจัดระยะ padding ให้สม่ำเสมอ
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  // Vertical stack with consistent spacing for title + description.
  // เรียงแนวตั้ง เว้นระยะระหว่าง title กับ description
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/**
 * Primary heading inside a card. Rendered as an `<h3>` for accessibility
 * even though the typed ref is on the wrapping div.
 *
 * (TH) หัวเรื่องหลักในการ์ด render เป็น <h3> เพื่อ accessibility ที่ดี
 * ส่วน ref ส่งไปยัง element h3 จริง ๆ ผ่านการ cast type
 */
const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  // <h3> tag so screen readers parse it as a section heading.
  // ใช้ <h3> เพื่อให้ screen reader อ่านเป็นหัวข้อส่วน
  <h3
    ref={ref as React.Ref<HTMLHeadingElement>}
    className={cn(
      "text-xl font-semibold leading-tight tracking-tight",
      className
    )}
    {...(props as React.HTMLAttributes<HTMLHeadingElement>)}
  />
));
CardTitle.displayName = "CardTitle";

/**
 * Muted subtitle paragraph that pairs with `<CardTitle>`.
 *
 * (TH) ข้อความรองในการ์ด สีจาง ใช้คู่กับ `<CardTitle>` เป็นคำอธิบาย
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  // Muted color, small text — the descriptive line under a title.
  // สีจาง ขนาดเล็ก — ข้อความบรรยายใต้ title
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

// ─── Body / footer ───────────────────────────────────────────────────────────

/**
 * Main body container of a card. Has horizontal padding but no top
 * padding (so it butts up against `<CardHeader>` cleanly).
 *
 * (TH) ส่วนเนื้อหาหลักของการ์ด มี padding รอบข้างแต่ไม่มี padding บน
 * เพื่อให้ติดกับ `<CardHeader>` ได้พอดี
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  // Body region — padding on sides/bottom, no padding-top to hug the header.
  // ส่วน body — เว้นด้านข้างและล่าง ไม่เว้นด้านบนเพื่อชิด header
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

/**
 * Bottom row of a card — usually holds action buttons. Uses flex so
 * children align horizontally with consistent spacing.
 *
 * (TH) แถวล่างสุดของการ์ด มักวางปุ่ม action ใช้ flex จัดเรียงแนวนอน
 * และเว้นระยะให้สม่ำเสมอ
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  // Footer region — horizontal flex layout for action buttons.
  // ส่วน footer — flex แนวนอน สำหรับปุ่ม action
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
