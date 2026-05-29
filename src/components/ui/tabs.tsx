/**
 * @file Tabs primitives wrapping Radix Tabs. Four pieces:
 *   - `<Tabs>`          — root (uncontrolled by default).
 *   - `<TabsList>`      — the pill-shaped strip holding the triggers.
 *   - `<TabsTrigger>`   — one clickable tab.
 *   - `<TabsContent>`   — the panel shown for the active tab.
 *
 * Composition:
 *   <Tabs defaultValue="a">
 *     <TabsList>
 *       <TabsTrigger value="a">A</TabsTrigger>
 *       <TabsTrigger value="b">B</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="a">...</TabsContent>
 *     <TabsContent value="b">...</TabsContent>
 *   </Tabs>
 *
 * (TH) คอมโพเนนต์แท็บห่อ Radix Tabs ประกอบด้วย root, list, trigger, content
 * ใช้ตามแบบด้านบน — เลือก tab เริ่มต้นด้วย defaultValue และเชื่อม trigger
 * กับ content ด้วยค่า `value` ตรงกัน
 */

"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

// Root has no styling — re-export Radix as-is.
// root ไม่มีสไตล์เพิ่ม ใช้ของ Radix ตรง ๆ
const Tabs = TabsPrimitive.Root;

/**
 * Pill-shaped container that holds the tab triggers. Inactive triggers
 * sit on a muted background; the active trigger gets a white card surface.
 *
 * (TH) ตัวห่อทรงแคปซูลของชุดแท็บ trigger ที่ไม่ active อยู่บนพื้นจาง
 * ส่วน trigger ที่ active จะมีพื้นหลังขาวเหมือนการ์ด
 */
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  // Tabs list — pill container that wraps every TabsTrigger.
  // tabs list — ตัวห่อทรงแคปซูลของ TabsTrigger ทั้งหมด
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-11 items-center justify-center rounded-full bg-secondary p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

/**
 * One clickable tab. Active state styling fires via `data-state=active`.
 *
 * (TH) แท็บที่กดได้หนึ่งตัว สไตล์ active จะถูก trigger ผ่าน data-state=active
 */
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  // Trigger — one tab button; active state uses data-state attribute.
  // trigger — ปุ่มแท็บหนึ่งตัว สไตล์ active อ่านจาก data-state
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-full px-5 py-1.5 text-sm font-medium transition-all",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

/**
 * Panel content shown when its `value` matches the active tab.
 *
 * (TH) แผง content ที่แสดงเมื่อ `value` ตรงกับ trigger ที่ active
 */
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  // Tab panel content — visible only when its `value` matches active.
  // เนื้อหาของแท็บ — แสดงเฉพาะเมื่อ value ตรงกับแท็บที่ active
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
