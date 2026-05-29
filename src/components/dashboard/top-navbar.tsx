/**
 * @file `<TopNavbar>` — sticky glass-effect navbar at the top of the
 * authenticated pages. Holds the settings button + logo on the left;
 * trips link, theme toggle, and avatar menu on the right. The avatar
 * menu opens a small popover with profile / switch-account / logout.
 *
 * (TH) navbar กระจกแบบ sticky ของหน้าใช้งานหลังล็อกอิน ปุ่ม settings +
 * โลโก้อยู่ซ้าย, ลิงก์ trips, ปุ่มสลับธีม, และเมนู avatar อยู่ขวา เมนู
 * avatar เปิด popover เล็ก ๆ ที่มี profile / switch account / logout
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  MessageSquare,
  Plane,
  RefreshCw,
  Settings,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import type { User } from "@/lib/types";
import { useVibeStore } from "@/lib/store";

/**
 * Props for `<TopNavbar>`. The navbar doesn't open the settings or
 * profile modals itself — it just calls back so the parent can manage
 * them (avoids prop drilling state into every page).
 *
 * (TH) Props: navbar ไม่เปิด modal เอง — เรียก callback ขึ้น parent ให้
 * parent จัดการเอง (กัน prop drill ไปทุกหน้า)
 */
interface TopNavbarProps {
  user: User | null;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

/**
 * Sticky top navbar. Includes click-outside handling for the avatar
 * popover so it dismisses naturally.
 *
 * (TH) navbar sticky พร้อม click-outside ให้ popover ปิดเองเวลาคลิกข้างนอก
 */
export function TopNavbar({
  user,
  onOpenSettings,
  onOpenProfile,
}: TopNavbarProps) {
  const router = useRouter();
  // Pull just the actions we need from the store (selectors keep subs narrow).
  // ดึงเฉพาะ action ที่ใช้ — selector แคบกว่า ทำให้ subscribe น้อยลง
  const reset = useVibeStore((s) => s.reset);
  const setUser = useVibeStore((s) => s.setUser);
  // Whether the avatar popover is open.
  // popover ของ avatar เปิดอยู่หรือไม่
  const [menuOpen, setMenuOpen] = React.useState(false);
  // Ref to detect clicks outside the popover for auto-dismiss.
  // ref ของ popover สำหรับตรวจจับการคลิกข้างนอกเพื่อปิดเอง
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Wire/unwire the click-outside listener only when the menu is open.
  // ใส่ listener click-outside เฉพาะตอนเมนูเปิด เพื่อประหยัด event
  React.useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  /**
   * Sign the user out but keep their groups/photos — used when the
   * user wants to log into a different account but doesn't want to
   * destroy demo data.
   *
   * (TH) ล็อกเอาต์ผู้ใช้ปัจจุบัน แต่ไม่ลบกลุ่ม/รูป — ใช้กรณีอยากสลับ
   * account แต่ยังเก็บข้อมูล demo ไว้
   */
  const handleSwitchAccount = () => {
    setMenuOpen(false);
    setUser(null);
    router.push("/");
  };

  /**
   * Full logout — wipes everything in the persistent store and goes
   * back to the auth landing page.
   *
   * (TH) logout เต็มรูปแบบ — ล้างทุกอย่างใน store แล้วกลับไปหน้า auth
   */
  const handleLogout = () => {
    setMenuOpen(false);
    reset();
    router.push("/");
  };

  return (
    // Sticky <header> — stays at the top of the viewport on scroll.
    // <header> sticky — อยู่บนสุดของ viewport เวลาเลื่อน
    <header className="sticky top-0 z-40">
      {/* Inner max-width container with horizontal padding. */}
      {/* container ภายในจำกัด max-width และมี padding ด้านข้าง */}
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        {/* Glass-effect bar with two clusters: left side + right side. */}
        {/* bar กระจก มีสองกลุ่ม: ซ้าย และ ขวา */}
        <div className="glass-strong flex items-center justify-between gap-2 rounded-2xl px-3 py-2 shadow-sm">
          {/* Left cluster — settings cog + logo (desktop only). */}
          {/* กลุ่มซ้าย — ปุ่ม settings + โลโก้ (เฉพาะ desktop) */}
          <div className="flex items-center gap-2">
            {/* Settings icon button. */}
            {/* ปุ่ม icon settings */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSettings}
              aria-label="Open settings"
            >
              {/* Settings cog icon. */}
              {/* ไอคอน cog */}
              <Settings className="h-4 w-4" />
            </Button>
            {/* Logo, visible on sm and up. */}
            {/* โลโก้ — แสดงตั้งแต่จอ sm ขึ้นไป */}
            <div className="hidden sm:block">
              <Logo />
            </div>
          </div>

          {/* Right cluster — trips link, theme toggle, avatar menu. */}
          {/* กลุ่มขวา — ลิงก์ trips, สลับธีม, เมนู avatar */}
          <div className="flex items-center gap-2">
            {/* Trips button (text label) — visible on sm+. */}
            {/* ปุ่ม trips แบบมี label — แสดงตั้งแต่ sm ขึ้นไป */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/trip")}
              className="hidden sm:inline-flex"
            >
              <MessageSquare className="h-4 w-4" /> Trips
            </Button>
            {/* Trips button (icon only) — mobile fallback. */}
            {/* ปุ่ม trips แบบไอคอนล้วน — สำหรับมือถือ */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/trip")}
              className="sm:hidden"
              aria-label="Trips"
            >
              <Plane className="h-4 w-4" />
            </Button>
            {/* Theme toggle. */}
            {/* ปุ่มสลับธีม */}
            <ThemeToggle />

            {/* Avatar + popover container — ref used for click-outside. */}
            {/* container avatar + popover — มี ref สำหรับ click-outside */}
            <div ref={menuRef} className="relative ml-1">
              {/* Avatar button — toggles the popover. */}
              {/* ปุ่ม avatar — สลับเปิด/ปิด popover */}
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-full ring-1 ring-border/60 transition-shadow hover:ring-accent/50"
                aria-label="Account menu"
                aria-expanded={menuOpen}
              >
                {/* Actual avatar (image or initials fallback). */}
                {/* avatar จริง (รูป หรือ fallback อักษรย่อ) */}
                <Avatar className="h-9 w-9">
                  {user?.avatarDataUrl && (
                    // Uploaded avatar image.
                    // รูป avatar ที่ผู้ใช้อัปโหลด
                    <AvatarImage src={user.avatarDataUrl} alt={user.firstName} />
                  )}
                  {/* Initials fallback — "VT" when signed out. */}
                  {/* fallback อักษรย่อ — เป็น "VT" เมื่อล็อกเอาต์ */}
                  <AvatarFallback>
                    {user
                      ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`
                      : "VT"}
                  </AvatarFallback>
                </Avatar>
              </button>

              {menuOpen && (
                /* Popover panel — positioned below the avatar. */
                /* แผง popover — วางใต้ avatar */
                <div className="absolute right-0 top-11 z-50 w-48 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl backdrop-blur-xl">
                  {user && (
                    /* User identity header inside the popover. */
                    /* หัว popover แสดงข้อมูลผู้ใช้ */
                    <div className="border-b border-border/60 px-3 py-2">
                      {/* Full name. */}
                      {/* ชื่อ-นามสกุล */}
                      <div className="truncate text-sm font-medium">
                        {user.firstName} {user.lastName}
                      </div>
                      {/* @nickname handle. */}
                      {/* handle @nickname */}
                      <div className="truncate text-xs text-muted-foreground">
                        @{user.nickname}
                      </div>
                    </div>
                  )}
                  {/* Profile menu item. */}
                  {/* เมนู Profile */}
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent/10"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenProfile();
                    }}
                  >
                    {/* User icon. */}
                    {/* ไอคอน user */}
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    Profile
                  </button>
                  {/* Switch-account menu item. */}
                  {/* เมนู Switch account */}
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent/10"
                    onClick={handleSwitchAccount}
                  >
                    {/* Refresh icon. */}
                    {/* ไอคอน refresh */}
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    Switch account
                  </button>
                  {/* Log out — sits below a separator with destructive color. */}
                  {/* Log out — อยู่ล่างเส้นคั่น สีอันตราย */}
                  <button
                    className="flex w-full items-center gap-2 border-t border-border/60 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    {/* Log out icon. */}
                    {/* ไอคอน log out */}
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
