/**
 * @file `<LoginForm>` — small sign-in form rendered inside the
 * "Sign in" tab on the auth landing page. Validates that both fields
 * are filled, simulates a network delay, then hands the credentials to
 * the parent via `onSubmit`. Auth is mocked at the page level.
 *
 * (TH) ฟอร์มเข้าสู่ระบบขนาดเล็ก แสดงในแท็บ "Sign in" ของหน้าแรก
 * ตรวจสอบว่ากรอกครบสองช่องไหม, จำลอง delay เครือข่าย แล้วส่งค่ากลับขึ้น
 * parent ผ่าน `onSubmit` (การ auth จริงจะถูก mock ที่ฝั่ง page)
 */

"use client";

import * as React from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

/**
 * Props for `<LoginForm>`. `onSubmit` is called with trimmed
 * identifier (email or phone) and raw password after local validation
 * and a 500ms simulated network delay.
 *
 * (TH) Props: `onSubmit` จะถูกเรียกพร้อม identifier ที่ trim แล้ว และ
 * password ตามจริง หลังผ่าน validation และดีเลย์เทียบเครือข่าย 500ms
 */
interface LoginFormProps {
  onSubmit: (identifier: string, password: string) => void;
}

/**
 * Render the sign-in form. Manages local state for the two inputs,
 * a single error message, and a loading flag during the fake submit.
 *
 * (TH) render ฟอร์ม sign-in มี state สำหรับ 2 ช่องกรอก, ข้อความ error
 * เดียว, และธง loading ระหว่างจำลองการส่ง
 */
export function LoginForm({ onSubmit }: LoginFormProps) {
  // Identifier = email OR phone (the API would normalize on the server).
  // ค่ารับผู้ใช้: email หรือเบอร์โทร (ฝั่ง backend จะ normalize เอง)
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  // Single combined error string — shown below the password field.
  // ข้อความ error เดียว — แสดงใต้ฟอร์ม
  const [error, setError] = React.useState<string | null>(null);
  // True only during the fake submit delay so the button can show a spinner.
  // true เฉพาะระหว่าง delay จำลอง เพื่อให้ปุ่มแสดง spinner
  const [loading, setLoading] = React.useState(false);

  /**
   * Validate, briefly pretend to call an API, then bubble values up.
   *
   * (TH) ตรวจค่า, จำลองการเรียก API, แล้วส่งค่าขึ้น parent
   */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Both fields are required — clear messaging beats per-field errors here.
    // ทั้งสองช่องบังคับ — ใช้ error เดียวให้ผู้ใช้เข้าใจง่าย
    if (!identifier.trim() || !password) {
      setError("Enter your email/phone and password");
      return;
    }
    setLoading(true);
    // Simulated latency so the spinner is actually visible to the user.
    // หน่วงเวลาให้ผู้ใช้เห็น spinner ก่อนจริง ๆ
    await new Promise((r) => setTimeout(r, 500));
    setLoading(false);
    onSubmit(identifier.trim(), password);
  };

  return (
    // <form> wrapper — handles enter-key submit and bundles fields.
    // <form> ห่อทุกอย่าง รองรับการกด Enter เพื่อ submit
    <form onSubmit={submit} className="space-y-5">
      {/* Identifier field group: label + input. */}
      {/* กลุ่ม field identifier: label + input */}
      <div>
        {/* Field label */}
        {/* ป้ายชื่อ field */}
        <Label className="mb-1.5 block">Email or phone</Label>
        {/* Identifier input — autoComplete="username" hints saved logins. */}
        {/* ช่องกรอก identifier — autoComplete="username" ช่วย browser auto-fill */}
        <Input
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="you@vibetrip.app"
          autoComplete="username"
        />
      </div>
      {/* Password field group: label + masked input. */}
      {/* กลุ่ม field password: label + ช่องกรอกแบบปกปิด */}
      <div>
        {/* Field label */}
        {/* ป้ายชื่อ field */}
        <Label className="mb-1.5 block">Password</Label>
        {/* Password input — type=password masks chars; auto-fills last password. */}
        {/* ช่องกรอกรหัสผ่าน — ปิดบังตัวอักษร และ auto-fill ค่ารหัสล่าสุด */}
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>
      {/* Inline error message, only when set. */}
      {/* ข้อความ error แสดงเมื่อมีค่า */}
      {error && <div className="text-xs text-destructive">{error}</div>}
      {/* Submit button — shows spinner while submitting. */}
      {/* ปุ่ม submit — แสดง spinner ระหว่างกำลังส่ง */}
      <Button
        type="submit"
        variant="accent"
        size="lg"
        className="w-full"
        disabled={loading}
      >
        {loading ? (
          // Spinner inside the button while the fake request resolves.
          // spinner ในปุ่มระหว่างจำลองการเรียก API
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          // Idle button content: label + arrow icon.
          // เนื้อหาปุ่มตอนปกติ: ข้อความ + ลูกศร
          <>
            Sign in <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
      {/* Forgot-password helper line (action not wired in demo). */}
      {/* บรรทัดช่วยกรณีลืมรหัสผ่าน (ยังไม่ wire จริงใน demo) */}
      <p className="text-center text-xs text-muted-foreground">
        Forgot password?
        {/* Accent-colored "Reset" link — placeholder for future flow. */}
        {/* ข้อความ "Reset" สี accent — placeholder รอเชื่อมขั้นตอน reset จริง */}
        <span className="text-accent"> Reset</span>
      </p>
    </form>
  );
}
