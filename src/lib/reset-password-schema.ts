/**
 * @file Zod schemas + helpers for the 3-step Reset Password flow.
 * Step 1 verifies identity (national ID + contact), step 2 verifies the
 * 6-digit OTP, step 3 sets a new password. Each step has its own schema so
 * `react-hook-form`'s `zodResolver` can validate one step at a time.
 *
 * (TH) สคีมา Zod + ตัวช่วยสำหรับ flow รีเซ็ตรหัสผ่าน 3 ขั้น ขั้น 1 ยืนยัน
 * ตัวตน (เลขบัตร ปชช. + ช่องติดต่อ), ขั้น 2 ยืนยัน OTP 6 หลัก, ขั้น 3 ตั้ง
 * รหัสผ่านใหม่ แต่ละขั้นมีสคีมาแยกกันเพื่อให้ `zodResolver` ตรวจทีละขั้น
 */

import { z } from "zod";

// ─── Step 1 — Identity ───────────────────────────────────────────────────────

/** Loose email check — server normalizes/validates for real. */
/** (TH) เช็คอีเมลแบบหลวม — ฝั่ง server จะ validate จริงอีกที */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Phone: 9–15 digits after stripping spaces, dashes, parens, leading +. */
/** (TH) เบอร์โทร: 9–15 หลักหลังตัดช่องว่าง ขีด วงเล็บ และ + นำหน้า */
const PHONE_RE = /^\+?[0-9]{9,15}$/;

/**
 * True when `value` looks like an email OR a phone number. Phone is
 * normalized (separators removed) before the regex test.
 *
 * (TH) คืน true เมื่อ `value` เป็นอีเมลหรือเบอร์โทร โดยเบอร์โทรจะถูกตัด
 * ตัวคั่นออกก่อนทดสอบด้วย regex
 */
export function isEmailOrPhone(value: string): boolean {
  const v = value.trim();
  if (EMAIL_RE.test(v)) return true;
  return PHONE_RE.test(v.replace(/[\s\-()]/g, ""));
}

/**
 * Step-1 schema. National ID must be exactly 13 digits; the contact
 * field must be a plausible email or phone. We intentionally do NOT
 * check whether the account exists here — that happens server-side and
 * always returns a generic response (see `reset-password-service`) to
 * prevent account-enumeration attacks.
 *
 * (TH) สคีมาขั้น 1 — เลขบัตรต้องเป็นตัวเลข 13 หลักพอดี และช่องติดต่อ
 * ต้องเป็นอีเมลหรือเบอร์โทรที่ดูสมเหตุสมผล เราจงใจไม่เช็คว่ามีบัญชีจริง
 * ไหมตรงนี้ (ทำที่ server และตอบแบบ generic เสมอเพื่อกัน enumeration)
 */
export const identitySchema = z.object({
  nationalId: z
    .string()
    .trim()
    .regex(/^\d{13}$/, "Enter your 13-digit National ID"),
  contact: z
    .string()
    .trim()
    .min(1, "Enter your email or phone")
    .refine(isEmailOrPhone, "Enter a valid email or phone number"),
});
export type IdentityValues = z.infer<typeof identitySchema>;

// ─── Step 2 — OTP ────────────────────────────────────────────────────────────

/** Step-2 schema — exactly 6 numeric digits. */
/** (TH) สคีมาขั้น 2 — ตัวเลข 6 หลักพอดี */
export const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});
export type OtpValues = z.infer<typeof otpSchema>;

// ─── Step 3 — New password ───────────────────────────────────────────────────

/** Individual password rules, reused by both the schema and the live meter. */
/** (TH) กฎรหัสผ่านแต่ละข้อ ใช้ซ้ำทั้งในสคีมาและมิเตอร์ความแข็งแรงแบบสด */
export const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "An uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "number", label: "A number", test: (p: string) => /[0-9]/.test(p) },
  {
    id: "special",
    label: "A special character",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
] as const;

/**
 * Step-3 schema. Enforces every rule in `PASSWORD_RULES` and that the
 * confirmation matches. The `.refine` attaches the mismatch error to the
 * `confirmPassword` field so it renders under the right input.
 *
 * (TH) สคีมาขั้น 3 — บังคับทุกกฎใน `PASSWORD_RULES` และให้รหัสยืนยันตรงกัน
 * `.refine` ผูก error กรณีไม่ตรงไว้ที่ฟิลด์ `confirmPassword` เพื่อให้แสดง
 * ใต้ช่องที่ถูกต้อง
 */
export const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Add an uppercase letter")
      .regex(/[0-9]/, "Add a number")
      .regex(/[^A-Za-z0-9]/, "Add a special character"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type PasswordValues = z.infer<typeof passwordSchema>;

// ─── Password strength ───────────────────────────────────────────────────────

/** Three-level strength label used by the meter. */
/** (TH) ระดับความแข็งแรง 3 ขั้นที่มิเตอร์ใช้ */
export type PasswordStrength = "weak" | "medium" | "strong";

/**
 * Score a password against `PASSWORD_RULES` plus a length bonus, then map
 * to a Weak / Medium / Strong label. Returns the per-rule pass map too so
 * the UI can render a live requirements checklist.
 *
 * (TH) ให้คะแนนรหัสผ่านตาม `PASSWORD_RULES` บวกโบนัสความยาว แล้ว map เป็น
 * Weak / Medium / Strong คืนผลผ่านรายกฎด้วยเพื่อให้ UI โชว์ checklist สด
 */
export function getPasswordStrength(password: string): {
  level: PasswordStrength;
  /** 0–4 — number of satisfied rules (drives the meter width). */
  score: number;
  /** Per-rule pass/fail keyed by rule id. */
  checks: Record<string, boolean>;
} {
  const checks: Record<string, boolean> = {};
  let passed = 0;
  for (const rule of PASSWORD_RULES) {
    const ok = rule.test(password);
    checks[rule.id] = ok;
    if (ok) passed += 1;
  }

  // Empty input is "weak" with a zero-width bar.
  // อินพุตว่าง = weak และแถบกว้าง 0
  if (!password) return { level: "weak", score: 0, checks };

  // Strong only when every rule passes AND it's comfortably long.
  // strong เมื่อผ่านทุกกฎ และยาวพอสมควรเท่านั้น
  if (passed === PASSWORD_RULES.length && password.length >= 12) {
    return { level: "strong", score: 4, checks };
  }
  if (passed >= 3) return { level: "medium", score: passed, checks };
  return { level: "weak", score: passed, checks };
}

/**
 * Mask a national ID so only the last 4 digits stay visible, e.g.
 * `"1234567890123" → "•••••••••0123"`. Inputs shorter than 5 digits are
 * returned as-is (nothing meaningful to hide yet).
 *
 * (TH) ปิดบังเลขบัตร ปชช. ให้เห็นเฉพาะ 4 ตัวท้าย เช่น
 * `"1234567890123" → "•••••••••0123"` ถ้าสั้นกว่า 5 หลักคืนค่าตามเดิม
 */
export function maskNationalId(digits: string): string {
  const clean = digits.replace(/\D/g, "");
  if (clean.length <= 4) return clean;
  return "•".repeat(clean.length - 4) + clean.slice(-4);
}
