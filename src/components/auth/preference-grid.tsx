/**
 * @file `<PreferenceGrid>` — bento-style toggleable grid of travel
 * preferences. Each cell is one `Preference` (beach / mountain /
 * waterfall / city / camping / island / culture / foodie) with its
 * own gradient + lucide icon. Used during onboarding and inside the
 * profile settings modal.
 *
 * (TH) ตารางเลือก "preference การท่องเที่ยว" สไตล์ bento — ช่องละหนึ่ง
 * preference (beach / mountain / waterfall ฯลฯ) มีไล่สีและไอคอนของตัวเอง
 * ใช้ในขั้นตอน onboarding และในหน้าตั้งค่าโปรไฟล์
 */

"use client";

import * as React from "react";
import {
  Waves,
  Mountain,
  Droplets,
  Building2,
  Tent,
  Palmtree,
  Landmark,
  UtensilsCrossed,
  Check,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Preference } from "@/lib/types";
import { PREFERENCE_META } from "@/lib/mock-data";

// ─── Per-preference style maps ──────────────────────────────────────────────

/**
 * Lucide icon for each preference. Kept here (rather than in
 * `PREFERENCE_META`) so the data layer doesn't depend on UI imports.
 *
 * (TH) ไอคอน lucide ของแต่ละ preference เก็บแยกจาก `PREFERENCE_META`
 * เพื่อไม่ให้ data layer ผูกกับ UI library
 */
const ICONS: Record<Preference, LucideIcon> = {
  beach: Waves,
  mountain: Mountain,
  waterfall: Droplets,
  city: Building2,
  camping: Tent,
  island: Palmtree,
  culture: Landmark,
  foodie: UtensilsCrossed,
};

/**
 * Per-preference background gradient tokens. Layered over the card
 * surface at varying opacity (60% idle, 100% when selected).
 *
 * (TH) ไล่สีพื้นหลังของแต่ละ preference ทับลงบนการ์ดด้วยความทึบ 60%
 * ตอนปกติ และ 100% เมื่อถูกเลือก
 */
const GRADIENTS: Record<Preference, string> = {
  beach: "from-cyan-400/30 to-blue-500/30",
  mountain: "from-emerald-400/30 to-teal-600/30",
  waterfall: "from-sky-400/30 to-indigo-500/30",
  city: "from-zinc-400/30 to-slate-600/30",
  camping: "from-amber-400/30 to-orange-600/30",
  island: "from-emerald-300/30 to-cyan-500/30",
  culture: "from-rose-300/30 to-fuchsia-500/30",
  foodie: "from-orange-300/30 to-rose-500/30",
};

/**
 * Bento grid spans — how many cols/rows each cell occupies on md+.
 * Tweaking this rearranges the visual hierarchy; the cells reflow
 * automatically into the 2-col mobile layout when these are dropped.
 *
 * (TH) ค่าขยายช่องสไตล์ bento — กำหนดว่าบนจอ md ขึ้นไป cell ไหนใหญ่/ยาว
 * พอ resize ลง mobile ค่าพวกนี้จะถูกตัดทิ้ง กลับไปเรียงเป็นกริด 2 คอลัมน์ปกติ
 */
const SPANS: Record<Preference, string> = {
  beach: "md:col-span-2 md:row-span-2",
  mountain: "md:col-span-2",
  waterfall: "",
  city: "md:row-span-2",
  camping: "md:col-span-2",
  island: "",
  culture: "",
  foodie: "md:col-span-2",
};

// ─── Props ───────────────────────────────────────────────────────────────────

/**
 * Props for `<PreferenceGrid>`. `selected` is the current set of chosen
 * preferences; `onToggle` is called with the preference whose tile was
 * just clicked (caller decides add vs remove).
 *
 * (TH) Props: `selected` คือ preference ที่ถูกเลือกไว้ก่อน, `onToggle`
 * จะถูกเรียกเมื่อผู้ใช้กด tile ใด — caller ตัดสินใจเองว่าจะเพิ่มหรือเอาออก
 */
interface PreferenceGridProps {
  selected: Preference[];
  onToggle: (p: Preference) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Render the 8-tile preference picker. Each tile is a `<button>` (not
 * a checkbox) because the visual is unconventional and Radix doesn't
 * help here — we manage aria implicitly via `aria-pressed`-style affordances.
 *
 * (TH) แสดง tile 8 ช่องสำหรับเลือก preference แต่ละ tile ใช้ `<button>`
 * (ไม่ใช่ checkbox) เพราะหน้าตาไม่เป็นมาตรฐาน — เราจัดการ accessibility
 * ด้วยสไตล์ "ปุ่มที่กดค้าง" แทน
 */
export function PreferenceGrid({ selected, onToggle }: PreferenceGridProps) {
  // Get a stable iteration order over Preference keys.
  // ดึงรายชื่อ key เพื่อ map เป็น tile ลำดับคงที่
  const keys = Object.keys(PREFERENCE_META) as Preference[];
  return (
    // Bento grid wrapper — 2 cols on mobile, 4 cols on md+.
    // กริด bento — 2 คอลัมน์บนมือถือ, 4 คอลัมน์บนจอ md ขึ้นไป
    <div className="grid auto-rows-[120px] grid-cols-2 gap-3 md:grid-cols-4 md:auto-rows-[140px]">
      {keys.map((p) => {
        // Resolve icon, metadata, and selected state for this tile.
        // ดึง icon, metadata, และสถานะ selected ของ tile นี้
        const Icon = ICONS[p];
        const meta = PREFERENCE_META[p];
        const active = selected.includes(p);
        return (
          // Tile button — toggles selection on click.
          // ปุ่ม tile — กดเพื่อสลับการเลือก
          <button
            key={p}
            type="button"
            onClick={() => onToggle(p)}
            className={cn(
              "group relative overflow-hidden rounded-3xl border text-left transition-all duration-300",
              "border-border/60 bg-card/70 backdrop-blur-xl",
              "hover:scale-[1.02] hover:shadow-xl hover:border-accent/40",
              active && "border-accent ring-2 ring-accent/50 shadow-lg",
              SPANS[p]
            )}
          >
            {/* Gradient overlay — fades to full opacity when selected. */}
            {/* ไล่สีโปร่งใส — ความทึบสูงสุดเมื่อถูกเลือก */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity",
                GRADIENTS[p],
                active && "opacity-100"
              )}
            />
            {/* Content column — icon on top, label/description at bottom. */}
            {/* คอลัมน์เนื้อหา — icon ด้านบน, ข้อความด้านล่าง */}
            <div className="relative flex h-full flex-col justify-between p-4">
              {/* Preference icon (scales slightly on hover). */}
              {/* ไอคอนของ preference (ขยายเล็กน้อยตอน hover) */}
              <Icon
                className={cn(
                  "h-7 w-7 transition-transform group-hover:scale-110",
                  active ? "text-accent-foreground" : "text-foreground/80"
                )}
              />
              {/* Text block — label + short description. */}
              {/* ส่วนข้อความ — label + คำอธิบายสั้น */}
              <div>
                {/* Preference label (e.g. "Beach"). */}
                {/* ชื่อ preference (เช่น "Beach") */}
                <div className="text-sm font-semibold tracking-tight">
                  {meta.label}
                </div>
                {/* Subtitle from PREFERENCE_META. */}
                {/* คำอธิบายสั้นจาก PREFERENCE_META */}
                <div className="text-[11px] text-muted-foreground">
                  {meta.description}
                </div>
              </div>
            </div>
            {active && (
              /* Checkmark badge in the top-right when selected. */
              /* ตราเช็คมาร์กมุมขวาบนเมื่อถูกเลือก */
              <div className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-accent text-accent-foreground shadow-md">
                {/* Lucide check icon */}
                {/* ไอคอนถูกของ lucide */}
                <Check className="h-3.5 w-3.5" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
