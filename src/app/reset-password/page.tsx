/**
 * @file Reset Password route (`/reset-password`). Reuses the same page shell
 * as the auth landing page — top bar with the brand logo + theme toggle, a
 * centered frosted card, and the footer — but the card hosts the 3-step
 * `<ResetPasswordForm>` instead of the auth tabs.
 *
 * (TH) หน้า Reset Password (`/reset-password`) ใช้เปลือกหน้าเดียวกับหน้า auth
 * — แถบบนมีโลโก้ + ปุ่มสลับธีม, การ์ดกระจกฝ้ากึ่งกลาง และ footer — แต่ในการ์ด
 * เป็นฟอร์ม 3 ขั้น `<ResetPasswordForm>` แทนแท็บ auth
 */

import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

/**
 * Reset password page. Mirrors the layout primitives of the root auth page
 * so the two screens feel like one product.
 *
 * (TH) หน้ารีเซ็ตรหัสผ่าน ใช้ primitive การจัดวางเดียวกับหน้า auth หลัก เพื่อ
 * ให้สองหน้ารู้สึกเป็นผลิตภัณฑ์เดียวกัน
 */
export default function ResetPasswordPage() {
  return (
    // Main page column — same paddings/max-width as the auth page.
    // คอลัมน์หน้าหลัก — padding/ความกว้างเท่าหน้า auth
    <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col overflow-x-hidden px-4 py-6 sm:px-6 sm:py-10">
      {/* Top bar — logo + theme toggle. */}
      {/* แถบบน — โลโก้ + ปุ่มสลับธีม */}
      <header className="flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {/* Centered content area. */}
      {/* ส่วนเนื้อหากึ่งกลาง */}
      <section className="flex flex-1 items-start justify-center py-6 sm:items-center sm:py-10">
        {/* Frosted card — narrower than the auth card since it's a focused task. */}
        {/* การ์ดกระจกฝ้า — แคบกว่าการ์ด auth เพราะเป็นงานเฉพาะ */}
        <div className="w-full max-w-md rounded-[28px] border border-border/60 bg-card/70 p-6 shadow-xl backdrop-blur-2xl sm:p-8">
          <ResetPasswordForm />
        </div>
      </section>

      {/* Footer — copyright. */}
      {/* footer — ลิขสิทธิ์ */}
      <footer className="pt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} VibeTrip · Plan, split, vibe.
      </footer>
    </main>
  );
}
