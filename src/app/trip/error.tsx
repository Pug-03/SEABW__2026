/**
 * @file `/trip` route error boundary. Next.js renders this whenever a
 * client error escapes the trip page tree. Provides a friendly message
 * with a retry button and a dashboard escape hatch.
 *
 * (TH) error boundary ของ route `/trip` — Next.js จะ render ตัวนี้เมื่อ
 * เกิด error หลุดจาก tree ของ /trip มีปุ่มลองใหม่และทางออกไป dashboard
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, LayoutDashboard, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Error boundary component. Next.js passes the thrown error + a
 * `reset()` function that retries the page render.
 *
 * (TH) คอมโพเนนต์ error boundary — Next.js ส่ง error + ฟังก์ชัน `reset()`
 * มาให้ ใช้ลอง render ใหม่
 */
export default function TripError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  // Log the error so developers see the root cause in the console.
  // log error ลง console เพื่อให้นักพัฒนาเห็นต้นเหตุ
  React.useEffect(() => {
    console.error("[/trip] runtime error:", error);
  }, [error]);

  return (
    // Centered full-page wrapper.
    // wrapper เต็มหน้าจอกึ่งกลาง
    <main className="grid min-h-screen place-items-center px-4">
      {/* Error card. */}
      {/* การ์ดข้อความ error */}
      <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card/70 p-8 text-center shadow-xl backdrop-blur-2xl">
        {/* Icon tile — alert triangle on destructive background. */}
        {/* กระเบื้อง icon — สามเหลี่ยมเตือนบนพื้น destructive */}
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-destructive/15 text-destructive">
          {/* Alert icon. */}
          {/* ไอคอนเตือน */}
          <AlertTriangle className="h-6 w-6" />
        </div>
        {/* Headline. */}
        {/* หัวเรื่อง */}
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          The trip hub hit a snag
        </h1>
        {/* Error message — falls back to a generic line. */}
        {/* ข้อความ error — fallback เป็นข้อความทั่วไปถ้าไม่มี */}
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || "Something went wrong while loading your trips."}
        </p>
        {/* Action buttons — Try again + Back to dashboard. */}
        {/* ปุ่ม action — Try again + Back to dashboard */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {/* Retry button — calls Next's `reset`. */}
          {/* ปุ่ม retry — เรียก reset ของ Next */}
          <Button variant="accent" onClick={reset}>
            <RotateCw className="h-4 w-4" /> Try again
          </Button>
          {/* Escape hatch back to the dashboard. */}
          {/* ทางออกกลับไปหน้า dashboard */}
          <Button variant="glass" onClick={() => router.push("/dashboard")}>
            <LayoutDashboard className="h-4 w-4" /> Back to dashboard
          </Button>
        </div>
      </div>
    </main>
  );
}
