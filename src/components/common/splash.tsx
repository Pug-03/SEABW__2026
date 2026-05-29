/**
 * @file `<Splash>` — full-viewport loading screen with the VibeTrip
 * logo and a spinning indicator. Used as the placeholder while the
 * Zustand store rehydrates from localStorage (see `useStoreHydrated`).
 *
 * (TH) หน้าจอ splash เต็มจอ มีโลโก้และ spinner ใช้แทน UI หลักช่วงที่
 * Zustand persist กำลังโหลดข้อมูลจาก localStorage (ดู `useStoreHydrated`)
 */

"use client";

import { Loader2 } from "lucide-react";
import { Logo } from "@/components/common/logo";

/**
 * Full-screen splash with a loading message. The default label is
 * "Loading…" but pass any short string (e.g. "Restoring your trips…").
 *
 * (TH) splash เต็มจอพร้อมข้อความสถานะ ค่าเริ่มต้นคือ "Loading…" — ส่ง
 * ข้อความสั้น ๆ อื่นได้ เช่น "Restoring your trips…"
 */
export function Splash({ label = "Loading…" }: { label?: string }) {
  return (
    // Outer wrapper — full viewport, content centered both axes.
    // wrapper ภายนอก — เต็ม viewport จัดเนื้อหากึ่งกลางทั้งสองแกน
    <div className="grid min-h-screen place-items-center">
      {/* Vertical stack: logo on top, status line underneath. */}
      {/* คอลัมน์: โลโก้ด้านบน, ข้อความสถานะด้านล่าง */}
      <div className="flex flex-col items-center gap-3">
        {/* Brand logo. */}
        {/* โลโก้แบรนด์ */}
        <Logo />
        {/* Spinner + status label row. */}
        {/* แถว spinner + ข้อความสถานะ */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {/* Spinning indicator (lucide). */}
          {/* ตัวหมุนของ lucide */}
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {label}
        </div>
      </div>
    </div>
  );
}
