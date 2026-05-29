/**
 * @file `<Logo>` — the VibeTrip wordmark used in the top navbar, splash
 * screen, and auth headers. Combines a small gradient icon tile with
 * the bicolored "VibeTrip" word ("Trip" in the accent color).
 *
 * (TH) คอมโพเนนต์โลโก้ "VibeTrip" ใช้ใน top navbar, splash, และหัวฟอร์ม
 * auth ประกอบด้วยกระเบื้อง icon ไล่สี + ข้อความ "VibeTrip" ที่คำว่า "Trip"
 * เป็นสีเน้น
 */

import { Plane } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Renders the VibeTrip wordmark. Accepts an optional className for
 * layout tweaks (e.g. spacing inside a flex row).
 *
 * (TH) แสดงโลโก้ VibeTrip รับ className เพิ่มเติมสำหรับปรับ layout เช่น
 * เพิ่มระยะห่างภายใน flex row
 */
export function Logo({ className }: { className?: string }) {
  return (
    // Horizontal row holding the icon tile and the wordmark.
    // แถวแนวนอนที่บรรจุ icon tile และข้อความโลโก้
    <div className={cn("flex items-center gap-2", className)}>
      {/* Icon tile — gradient square with the plane icon centered inside. */}
      {/* กระเบื้อง icon — สี่เหลี่ยมไล่สี วาง icon เครื่องบินตรงกลาง */}
      <div className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
        {/* Lucide plane icon. */}
        {/* ไอคอนเครื่องบินจาก lucide */}
        <Plane className="h-4 w-4" />
      </div>
      {/* Wordmark — "Vibe" + accent-colored "Trip". */}
      {/* ข้อความโลโก้ — "Vibe" + "Trip" ที่ทำสี accent */}
      <span className="text-lg font-semibold tracking-tight">
        Vibe
        {/* Accent-colored suffix to highlight the brand. */}
        {/* ส่วนต่อท้ายสี accent เพื่อเน้นแบรนด์ */}
        <span className="text-accent">Trip</span>
      </span>
    </div>
  );
}
