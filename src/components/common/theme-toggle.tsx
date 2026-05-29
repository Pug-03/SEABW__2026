/**
 * @file `<ThemeToggle>` — round icon button that flips the global
 * theme between light and dark. Reads `useTheme()` to know which icon
 * (sun vs moon) to render, and calls `toggle()` on click.
 *
 * (TH) ปุ่ม icon รูปกลมสำหรับสลับธีม light/dark ของทั้งแอป อ่านธีมปัจจุบัน
 * จาก `useTheme()` เพื่อตัดสินใจว่าจะแสดง sun หรือ moon และเรียก `toggle()`
 * เมื่อกด
 */

"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";

/**
 * Render the theme toggle button. Uses the `glass` variant of `<Button>`
 * so it floats nicely on top of any background (header, hero, etc.).
 *
 * (TH) แสดงปุ่มสลับธีม ใช้ variant `glass` ของ `<Button>` เพื่อให้ลอยอยู่
 * บนพื้นหลังแบบไหนก็ดูเข้ากัน
 */
export function ThemeToggle() {
  // Subscribe to the current theme and the toggle action.
  // ดึงค่าธีมปัจจุบันและฟังก์ชัน toggle จาก context
  const { theme, toggle } = useTheme();
  return (
    // Glass-variant icon button — frosted look that floats on any backdrop.
    // ปุ่ม icon ทรงกลมแบบกระจกฝ้า — วางทับพื้นหลังอะไรก็ดูเข้ากัน
    <Button
      variant="glass"
      size="icon"
      onClick={toggle}
      aria-label="Toggle theme"
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
    >
      {/* Icon swaps based on current theme: sun in dark mode, moon in light. */}
      {/* icon สลับตามธีม: ดวงอาทิตย์เมื่ออยู่ dark, ดวงจันทร์เมื่ออยู่ light */}
      {theme === "dark" ? (
        // Light-mode target icon shown while currently in dark mode.
        // ไอคอน sun แสดงเมื่ออยู่โหมดมืด (กดเพื่อกลับไปโหมดสว่าง)
        <Sun className="h-4 w-4" />
      ) : (
        // Dark-mode target icon shown while currently in light mode.
        // ไอคอน moon แสดงเมื่ออยู่โหมดสว่าง (กดเพื่อสลับเป็นโหมดมืด)
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
