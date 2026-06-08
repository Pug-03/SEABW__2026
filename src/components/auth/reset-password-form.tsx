/**
 * @file `<ResetPasswordForm>` — the secure 3-step "forgot password" wizard.
 *
 *   Step 1 — Identity:  national ID (13 digits, masked to last 4) + the
 *             email/phone on file, then "Send OTP".
 *   Step 2 — OTP:       6 single-digit boxes, a 5-minute countdown, a resend
 *             button, generic error messages, and a 5-attempt → 15-min lock.
 *   Step 3 — Password:  new + confirm password with a live strength meter and
 *             a requirements checklist.
 *
 * Validation uses `react-hook-form` + `zod` (one schema per step). All the
 * security-sensitive logic (OTP issue/verify, expiry, rate-limiting, generic
 * non-enumerating responses) is delegated to `reset-password-service`, which
 * stands in for a real backend. On success every local session is invalidated
 * via the Zustand store's `reset()`.
 *
 * (TH) วิซาร์ด "ลืมรหัสผ่าน" 3 ขั้นแบบปลอดภัย
 *   ขั้น 1 — ตัวตน: เลขบัตร ปชช. (13 หลัก ปิดบังเหลือ 4 ตัวท้าย) + อีเมล/เบอร์
 *   ขั้น 2 — OTP: ช่องตัวเลข 6 ช่อง, นับถอยหลัง 5 นาที, ปุ่มส่งใหม่, ข้อความ
 *            error แบบ generic และล็อก 15 นาทีเมื่อผิด 5 ครั้ง
 *   ขั้น 3 — รหัสผ่าน: ตั้งรหัสใหม่ + ยืนยัน พร้อมมิเตอร์ความแข็งแรงและ
 *            checklist เงื่อนไข
 * ใช้ `react-hook-form` + `zod` (สคีมาแยกต่อขั้น) ตรรกะความปลอดภัยอยู่ใน
 * `reset-password-service` (จำลอง backend) เมื่อสำเร็จจะล้างทุก session ผ่าน
 * `reset()` ของ store
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { OtpInput } from "@/components/ui/otp-input";
import { cn } from "@/lib/utils";
import { useVibeStore } from "@/lib/store";
import {
  identitySchema,
  otpSchema,
  passwordSchema,
  getPasswordStrength,
  maskNationalId,
  PASSWORD_RULES,
  type IdentityValues,
  type OtpValues,
  type PasswordValues,
} from "@/lib/reset-password-schema";
import {
  requestOtp,
  verifyOtp,
  resetPassword,
  getLockState,
  OTP_TTL_MS,
} from "@/lib/reset-password-service";

// ─── Shared helpers ──────────────────────────────────────────────────────────

/** Resend cooldown so users can't hammer "Send again". */
/** (TH) คูลดาวน์การส่งใหม่ กันผู้ใช้กดรัว ๆ */
const RESEND_COOLDOWN_MS = 30 * 1000;

/**
 * Tick every second and return the milliseconds remaining until `target`
 * (0 once passed, 0 when `target` is null). Used for the OTP countdown,
 * lockout countdown, and resend cooldown.
 *
 * (TH) เดินทุก 1 วินาทีและคืนมิลลิวินาทีที่เหลือจนถึง `target` (เป็น 0 เมื่อ
 * เลยกำหนดหรือ `target` เป็น null) ใช้กับนับถอยหลัง OTP, ล็อก และคูลดาวน์
 */
function useRemaining(target: number | null): number {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (target == null) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (target == null) return 0;
  return Math.max(0, target - now);
}

/** Format milliseconds as `m:ss` (e.g. 90000 → "1:30"). */
/** (TH) จัดรูปมิลลิวินาทีเป็น `m:ss` (เช่น 90000 → "1:30") */
function formatMmSs(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Mask the contact for display on the OTP step — keeps the user oriented
 * ("we sent it to j•••@mail.com") without printing the full address/number.
 *
 * (TH) ปิดบังช่องติดต่อสำหรับแสดงบนขั้น OTP — ให้ผู้ใช้รู้ว่าโค้ดถูกส่งไปที่
 * ไหนคร่าว ๆ โดยไม่โชว์อีเมล/เบอร์เต็ม
 */
function maskContact(contact: string): string {
  const v = contact.trim();
  if (v.includes("@")) {
    const [local, domain] = v.split("@");
    const head = local.slice(0, 1);
    return `${head}${"•".repeat(Math.max(local.length - 1, 2))}@${domain}`;
  }
  const digits = v.replace(/\D/g, "");
  return digits.length > 4
    ? `${"•".repeat(digits.length - 4)}${digits.slice(-4)}`
    : digits;
}

/** Small inline error row — reused by every step. */
/** (TH) แถว error เล็ก ๆ ใช้ซ้ำทุกขั้น */
function FieldError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <div
      id={id}
      role="alert"
      className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive"
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

// ─── Orchestrator ────────────────────────────────────────────────────────────

/** Which screen of the wizard is showing. */
/** (TH) กำลังแสดงหน้าจอไหนของวิซาร์ด */
type Step = 1 | 2 | 3 | "done";

/**
 * The wizard shell. Owns cross-step state (current step, the active
 * challenge, the masked contact) and renders the progress header + the
 * active step. Individual steps own their own form state.
 *
 * (TH) เปลือกของวิซาร์ด ถือ state ข้ามขั้น (ขั้นปัจจุบัน, challenge ที่ใช้งาน,
 * ช่องติดต่อที่ปิดบัง) และ render หัว progress + ขั้นปัจจุบัน แต่ละขั้นถือ
 * state ฟอร์มของตัวเอง
 */
export function ResetPasswordForm() {
  const router = useRouter();
  // Wipes the persisted user/groups — our "invalidate all sessions" action.
  // ล้าง user/groups ที่เก็บไว้ — คือ action "ยกเลิกทุก session" ของเรา
  const resetStore = useVibeStore((s) => s.reset);

  const [step, setStep] = React.useState<Step>(1);
  // The active OTP challenge (id + expiry). Updated on send and on resend.
  // challenge OTP ที่ใช้งาน (id + วันหมดอายุ) อัปเดตเมื่อส่งและส่งใหม่
  const [challengeId, setChallengeId] = React.useState<string>("");
  const [expiresAt, setExpiresAt] = React.useState<number>(0);
  // The verified identity, kept so "resend" can re-issue to the same target.
  // ตัวตนที่ยืนยันแล้ว เก็บไว้เพื่อให้ "ส่งใหม่" ออกโค้ดไปที่เดิมได้
  const [identity, setIdentity] = React.useState<IdentityValues | null>(null);

  // Numeric progress for the bar (3 evenly-spaced steps; "done" = full).
  // ค่าความคืบหน้าของแถบ (3 ขั้นเท่า ๆ กัน; "done" = เต็ม)
  const progress = step === "done" ? 100 : Math.round((step / 3) * 100);

  /**
   * Step 1 complete — issue the first OTP and advance to step 2.
   * (TH) ขั้น 1 เสร็จ — ออก OTP แรกแล้วไปขั้น 2
   */
  const handleIdentity = (values: IdentityValues) => {
    const res = requestOtp(values.nationalId, values.contact);
    setIdentity(values);
    setChallengeId(res.challengeId);
    setExpiresAt(res.expiresAt);
    setStep(2);
  };

  /**
   * Resend — re-issue an OTP to the same identity and refresh id/expiry.
   * Lockout/attempt state is preserved server-side by the service.
   * (TH) ส่งใหม่ — ออก OTP ให้ตัวตนเดิมและรีเฟรช id/วันหมดอายุ สถานะล็อก/
   * ครั้งจะถูกคงไว้ฝั่ง service
   */
  const handleResend = () => {
    if (!identity) return;
    const res = requestOtp(identity.nationalId, identity.contact);
    setChallengeId(res.challengeId);
    setExpiresAt(res.expiresAt);
  };

  /**
   * Step 3 complete — finalize the reset, invalidate sessions, show success.
   * (TH) ขั้น 3 เสร็จ — ปิดงานรีเซ็ต, ล้าง session, แสดงหน้าสำเร็จ
   */
  const handlePassword = (values: PasswordValues): boolean => {
    const res = resetPassword(challengeId, values.password);
    if (!res.ok) return false;
    // Invalidate every existing session on this device after a reset.
    // ยกเลิกทุก session บนอุปกรณ์นี้หลังรีเซ็ตสำเร็จ
    resetStore();
    setStep("done");
    return true;
  };

  return (
    // Wizard column.
    // คอลัมน์วิซาร์ด
    <div className="space-y-6">
      {/* Header — title, progress bar, "back to login". */}
      {/* หัว — ชื่อ, แถบความคืบหน้า, ลิงก์กลับไปหน้าเข้าสู่ระบบ */}
      <Header step={step} progress={progress} />

      {/* Active step. */}
      {/* ขั้นที่กำลังแสดง */}
      {step === 1 && <IdentityStep onComplete={handleIdentity} />}
      {step === 2 && identity && (
        <OtpStep
          challengeId={challengeId}
          expiresAt={expiresAt}
          maskedContact={maskContact(identity.contact)}
          onResend={handleResend}
          onVerified={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && <PasswordStep onComplete={handlePassword} />}
      {step === "done" && (
        <SuccessView onBackToLogin={() => router.push("/")} />
      )}
    </div>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

/** Step titles shown next to the progress bar. */
/** (TH) ชื่อขั้นที่แสดงข้างแถบความคืบหน้า */
const STEP_TITLES = ["Verify identity", "Enter code", "New password"] as const;

/**
 * Wizard header — icon + title, a "Back to login" link, the progress bar,
 * and the "Step n of 3" / current-step caption.
 *
 * (TH) หัววิซาร์ด — ไอคอน + ชื่อ, ลิงก์กลับไปเข้าสู่ระบบ, แถบความคืบหน้า และ
 * คำบรรยาย "ขั้น n จาก 3"
 */
function Header({ step, progress }: { step: Step; progress: number }) {
  const stepNum = step === "done" ? 3 : step;
  return (
    <div className="space-y-4">
      {/* Title row + back link. */}
      {/* แถวชื่อเรื่อง + ลิงก์ย้อนกลับ */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {/* Brand-tinted icon tile. */}
          {/* กล่องไอคอนโทนแบรนด์ */}
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
            <KeyRound className="h-4.5 w-4.5" />
          </span>
          <div>
            {/* Page title. */}
            {/* ชื่อหน้า */}
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
              Reset password
            </h1>
            {/* Sub-caption. */}
            {/* คำบรรยายรอง */}
            <p className="text-xs text-muted-foreground">
              Secure account recovery
            </p>
          </div>
        </div>
        {/* Back to login — always available. */}
        {/* กลับไปเข้าสู่ระบบ — กดได้เสมอ */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </Link>
      </div>

      {/* Progress bar. */}
      {/* แถบความคืบหน้า */}
      <Progress value={progress} aria-label={`Step ${stepNum} of 3`} />

      {/* "Step n of 3" + current title. */}
      {/* "ขั้น n จาก 3" + ชื่อขั้นปัจจุบัน */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium uppercase tracking-wider text-muted-foreground">
          Step {stepNum} of 3
        </span>
        <span className="font-medium text-foreground">
          {STEP_TITLES[stepNum - 1]}
        </span>
      </div>
    </div>
  );
}

// ─── Step 1 — Identity ───────────────────────────────────────────────────────

/**
 * Identity step. Collects the masked national ID + contact, then asks the
 * service to send an OTP. The service never reveals whether the account
 * exists, so the only errors here are local format errors.
 *
 * (TH) ขั้นตัวตน เก็บเลขบัตรที่ปิดบัง + ช่องติดต่อ แล้วให้ service ส่ง OTP
 * service จะไม่บอกว่ามีบัญชีจริงไหม จึงมีแต่ error รูปแบบฝั่ง client เท่านั้น
 */
function IdentityStep({
  onComplete,
}: {
  onComplete: (values: IdentityValues) => void;
}) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IdentityValues>({
    resolver: zodResolver(identitySchema),
    defaultValues: { nationalId: "", contact: "" },
  });
  const [submitting, setSubmitting] = React.useState(false);

  const submit = handleSubmit(async (values) => {
    setSubmitting(true);
    // Simulated network latency so the spinner is visible.
    // จำลอง delay เครือข่ายให้เห็น spinner
    await new Promise((r) => setTimeout(r, 500));
    setSubmitting(false);
    onComplete(values);
  });

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {/* National ID — masked to last 4 except while focused. */}
      {/* เลขบัตร ปชช. — ปิดบังเหลือ 4 ตัวท้าย ยกเว้นตอนโฟกัส */}
      <div>
        <Label htmlFor="nationalId" className="mb-1.5 block">
          National ID
        </Label>
        <Controller
          control={control}
          name="nationalId"
          render={({ field }) => (
            <MaskedNationalIdInput
              id="nationalId"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              invalid={!!errors.nationalId}
              describedBy={errors.nationalId ? "nationalId-err" : "nationalId-help"}
            />
          )}
        />
        {errors.nationalId ? (
          <FieldError id="nationalId-err">{errors.nationalId.message}</FieldError>
        ) : (
          <p id="nationalId-help" className="mt-1.5 text-[11px] text-muted-foreground">
            13 digits — only the last 4 stay visible.
          </p>
        )}
      </div>

      {/* Email or phone on file. */}
      {/* อีเมลหรือเบอร์โทรที่ผูกกับบัญชี */}
      <div>
        <Label htmlFor="contact" className="mb-1.5 block">
          Email or phone
        </Label>
        <Input
          id="contact"
          autoComplete="username"
          placeholder="you@vibetrip.app or +66 81 234 5678"
          aria-invalid={!!errors.contact}
          aria-describedby={errors.contact ? "contact-err" : undefined}
          {...register("contact")}
        />
        <FieldError id="contact-err">{errors.contact?.message}</FieldError>
      </div>

      {/* Privacy note — explains the generic behavior. */}
      {/* หมายเหตุความเป็นส่วนตัว — อธิบายพฤติกรรม generic */}
      <p className="flex items-start gap-2 rounded-2xl border border-border/60 bg-secondary/30 p-3 text-[11px] text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
        For your security, we&apos;ll send a one-time code if these details
        match an account. You won&apos;t be told whether the account exists.
      </p>

      {/* Send OTP. */}
      {/* ส่ง OTP */}
      <Button
        type="submit"
        variant="accent"
        size="lg"
        className="w-full"
        disabled={submitting}
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Send code <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}

/**
 * Masked national-ID input. Stores raw digits but, when blurred, shows only
 * the last 4 (e.g. `•••••••••0123`). On focus it reveals the raw value so the
 * user can edit it normally. Digit-only, capped at 13.
 *
 * (TH) ช่องเลขบัตรแบบปิดบัง เก็บตัวเลขดิบ แต่เมื่อไม่ได้โฟกัสจะโชว์แค่ 4 ตัว
 * ท้าย (เช่น `•••••••••0123`) เมื่อโฟกัสจะเผยค่าดิบให้แก้ไขได้ตามปกติ รับ
 * เฉพาะตัวเลข สูงสุด 13 หลัก
 */
function MaskedNationalIdInput({
  id,
  value,
  onChange,
  onBlur,
  invalid,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  invalid: boolean;
  describedBy?: string;
}) {
  const [focused, setFocused] = React.useState(false);
  // Show raw digits while editing; mask to last 4 once focus leaves.
  // โชว์ตัวเลขดิบระหว่างแก้ไข; ปิดบังเหลือ 4 ตัวท้ายเมื่อออกจากโฟกัส
  const display = focused ? value : maskNationalId(value);
  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="1 2345 67890 12 3"
      value={display}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        onBlur();
      }}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 13))}
      className={cn(invalid && "border-destructive", "font-mono tracking-wider")}
    />
  );
}

// ─── Step 2 — OTP ────────────────────────────────────────────────────────────

/**
 * OTP step. Renders the 6 digit boxes, a live 5-minute expiry countdown, a
 * resend button (with a short cooldown), and enforces the lockout returned by
 * the service. Error copy is intentionally generic.
 *
 * (TH) ขั้น OTP แสดงช่องตัวเลข 6 ช่อง, นับถอยหลังหมดอายุ 5 นาทีแบบสด, ปุ่ม
 * ส่งใหม่ (มีคูลดาวน์สั้น ๆ) และบังคับใช้การล็อกที่ service คืนมา ข้อความ
 * error เป็นแบบ generic โดยตั้งใจ
 */
function OtpStep({
  challengeId,
  expiresAt,
  maskedContact,
  onResend,
  onVerified,
  onBack,
}: {
  challengeId: string;
  expiresAt: number;
  maskedContact: string;
  onResend: () => void;
  onVerified: () => void;
  onBack: () => void;
}) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "" },
  });

  // Generic server-side error message (separate from zod format errors).
  // ข้อความ error จาก service แบบ generic (แยกจาก error รูปแบบของ zod)
  const [serverError, setServerError] = React.useState<string | null>(null);
  // Lock expiry epoch ms, or null when not locked.
  // เวลา (epoch ms) ที่ล็อกจะหมด หรือ null เมื่อไม่ถูกล็อก
  const [lockedUntil, setLockedUntil] = React.useState<number | null>(null);
  const [verifying, setVerifying] = React.useState(false);

  // On mount / challenge change, reflect any pre-existing lock immediately.
  // เมื่อ mount หรือ challenge เปลี่ยน ให้สะท้อนสถานะล็อกที่มีอยู่ทันที
  React.useEffect(() => {
    const lock = getLockState(challengeId);
    setLockedUntil(lock.locked ? lock.lockedUntil ?? null : null);
  }, [challengeId]);

  // Countdowns: OTP expiry, lockout, and resend cooldown.
  // นับถอยหลัง: หมดอายุ OTP, ล็อก และคูลดาวน์ส่งใหม่
  const expiryLeft = useRemaining(expiresAt);
  const lockLeft = useRemaining(lockedUntil);
  const cooldownLeft = useRemaining(expiresAt - OTP_TTL_MS + RESEND_COOLDOWN_MS);

  const expired = expiryLeft <= 0;
  const locked = lockedUntil != null && lockLeft > 0;
  const canResend = !locked && cooldownLeft <= 0;

  // When a live lock elapses, clear it so the UI re-enables.
  // เมื่อการล็อกที่กำลังนับหมดลง ให้ล้างเพื่อเปิดใช้งาน UI อีกครั้ง
  React.useEffect(() => {
    if (lockedUntil != null && lockLeft <= 0) setLockedUntil(null);
  }, [lockLeft, lockedUntil]);

  const submit = handleSubmit(async ({ code }) => {
    setServerError(null);
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 400));
    const res = verifyOtp(challengeId, code);
    setVerifying(false);

    if (res.ok) {
      onVerified();
      return;
    }
    // Map the (deliberately vague) failure into user-facing copy.
    // แปลงผลล้มเหลว (ที่จงใจกำกวม) เป็นข้อความสำหรับผู้ใช้
    if (res.locked) {
      setLockedUntil(res.lockedUntil ?? null);
      setServerError(null);
    } else if (res.expired) {
      setServerError("That code has expired. Request a new one.");
    } else if (typeof res.attemptsRemaining === "number") {
      setServerError(
        `Invalid verification code. ${res.attemptsRemaining} attempt${
          res.attemptsRemaining === 1 ? "" : "s"
        } remaining.`
      );
    } else {
      setServerError("Invalid verification code.");
    }
    // Clear the boxes so the next attempt starts fresh.
    // ล้างช่องเพื่อให้พยายามครั้งถัดไปเริ่มใหม่
    reset({ code: "" });
  });

  const handleResendClick = () => {
    onResend();
    setServerError(null);
    reset({ code: "" });
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {/* Where we "sent" the code. */}
      {/* บอกว่าเรา "ส่ง" โค้ดไปที่ไหน */}
      <p className="text-sm text-muted-foreground">
        Enter the 6-digit code we sent to{" "}
        <span className="font-medium text-foreground">{maskedContact}</span>.
      </p>

      {locked ? (
        // Locked banner — replaces the inputs entirely during lockout.
        // แบนเนอร์ถูกล็อก — แทนที่ช่องกรอกทั้งหมดระหว่างถูกล็อก
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">
              Too many attempts
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              For your security this request is locked. Try again in{" "}
              <span className="font-medium text-foreground">
                {formatMmSs(lockLeft)}
              </span>
              .
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* The 6 digit boxes. */}
          {/* ช่องตัวเลข 6 ช่อง */}
          <Controller
            control={control}
            name="code"
            render={({ field }) => (
              <OtpInput
                value={field.value}
                onChange={field.onChange}
                disabled={verifying || expired}
                invalid={!!errors.code || !!serverError}
                autoFocus
                describedBy={serverError ? "otp-err" : undefined}
              />
            )}
          />

          {/* Format error (zod) or generic server error. */}
          {/* error รูปแบบ (zod) หรือ error generic จาก service */}
          <FieldError id="otp-err">
            {errors.code?.message ?? serverError}
          </FieldError>

          {/* Timer + resend row. */}
          {/* แถวตัวจับเวลา + ส่งใหม่ */}
          <div className="flex items-center justify-between text-xs">
            <span
              className={cn(
                "tabular-nums",
                expired ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {expired ? (
                "Code expired"
              ) : (
                <>
                  Expires in{" "}
                  <span className="font-medium text-foreground">
                    {formatMmSs(expiryLeft)}
                  </span>
                </>
              )}
            </span>
            <button
              type="button"
              onClick={handleResendClick}
              disabled={!canResend}
              className="inline-flex items-center gap-1 font-medium text-accent transition-colors hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {canResend
                ? "Resend code"
                : `Resend in ${formatMmSs(cooldownLeft)}`}
            </button>
          </div>
        </>
      )}

      {/* Actions — back + verify. */}
      {/* ปุ่ม — ย้อนกลับ + ยืนยัน */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={onBack}
          className="sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          type="submit"
          variant="accent"
          size="lg"
          disabled={verifying || locked || expired}
          className="sm:w-auto"
        >
          {verifying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Verify <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── Step 3 — New password ───────────────────────────────────────────────────

/**
 * Password step. New + confirm password, a live strength meter, and a
 * requirements checklist. On submit it finalizes via `onComplete`; if the
 * service rejects (e.g. the challenge expired mid-flow) we surface a generic
 * error and bounce the user back implicitly by showing it.
 *
 * (TH) ขั้นรหัสผ่าน ตั้งรหัสใหม่ + ยืนยัน พร้อมมิเตอร์ความแข็งแรงแบบสดและ
 * checklist เงื่อนไข เมื่อกดยืนยันจะปิดงานผ่าน `onComplete` ถ้า service
 * ปฏิเสธ (เช่น challenge หมดอายุระหว่างทาง) จะแสดง error แบบ generic
 */
function PasswordStep({
  onComplete,
}: {
  onComplete: (values: PasswordValues) => boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onChange",
  });
  const [reveal, setReveal] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // Live password value drives the strength meter + checklist.
  // ค่ารหัสผ่านแบบสดขับเคลื่อนมิเตอร์ความแข็งแรง + checklist
  const password = watch("password") ?? "";
  const strength = getPasswordStrength(password);

  const submit = handleSubmit(async (values) => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    const ok = onComplete(values);
    setSubmitting(false);
    if (!ok) {
      // Generic failure — don't explain the internal reason.
      // ล้มเหลวแบบ generic — ไม่อธิบายเหตุผลภายใน
      setError("password", {
        message: "Something went wrong. Please restart the reset process.",
      });
    }
  });

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {/* New password + reveal toggle. */}
      {/* รหัสผ่านใหม่ + ปุ่มเผย/ซ่อน */}
      <div>
        <Label htmlFor="password" className="mb-1.5 block">
          New password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={reveal ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-err" : undefined}
            className="pr-11"
            {...register("password")}
          />
          {/* Eye toggle — reveals both password fields. */}
          {/* ปุ่มรูปตา — เผย/ซ่อนทั้งสองช่อง */}
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <FieldError id="password-err">{errors.password?.message}</FieldError>

        {/* Strength meter — only once the user starts typing. */}
        {/* มิเตอร์ความแข็งแรง — แสดงเมื่อผู้ใช้เริ่มพิมพ์ */}
        {password.length > 0 && <StrengthMeter strength={strength} />}
      </div>

      {/* Requirements checklist. */}
      {/* checklist เงื่อนไข */}
      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const ok = strength.checks[rule.id];
          return (
            <li
              key={rule.id}
              className={cn(
                "flex items-center gap-1.5 text-xs transition-colors",
                ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              )}
            >
              <CheckCircle2
                className={cn("h-3.5 w-3.5 shrink-0", !ok && "opacity-40")}
              />
              {rule.label}
            </li>
          );
        })}
      </ul>

      {/* Confirm password. */}
      {/* ยืนยันรหัสผ่าน */}
      <div>
        <Label htmlFor="confirmPassword" className="mb-1.5 block">
          Confirm password
        </Label>
        <Input
          id="confirmPassword"
          type={reveal ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "confirm-err" : undefined}
          {...register("confirmPassword")}
        />
        <FieldError id="confirm-err">{errors.confirmPassword?.message}</FieldError>
      </div>

      {/* Submit. */}
      {/* ยืนยัน */}
      <Button
        type="submit"
        variant="accent"
        size="lg"
        className="w-full"
        disabled={submitting}
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Lock className="h-4 w-4" /> Reset password
          </>
        )}
      </Button>
    </form>
  );
}

/** Visual labels + colors per strength level. */
/** (TH) ป้าย + สีต่อระดับความแข็งแรง */
const STRENGTH_META: Record<
  ReturnType<typeof getPasswordStrength>["level"],
  { label: string; bar: string; text: string }
> = {
  weak: { label: "Weak", bar: "bg-destructive", text: "text-destructive" },
  medium: { label: "Medium", bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  strong: { label: "Strong", bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
};

/**
 * Four-segment strength bar + label, driven by `getPasswordStrength`.
 *
 * (TH) แถบความแข็งแรง 4 ช่อง + ป้าย ขับเคลื่อนด้วย `getPasswordStrength`
 */
function StrengthMeter({
  strength,
}: {
  strength: ReturnType<typeof getPasswordStrength>;
}) {
  const meta = STRENGTH_META[strength.level];
  return (
    <div className="mt-2.5">
      {/* Segmented bar — `score` of 4 segments filled in the level color. */}
      {/* แถบแบ่งช่อง — เติม `score` จาก 4 ช่องด้วยสีของระดับ */}
      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < strength.score ? meta.bar : "bg-secondary"
            )}
          />
        ))}
      </div>
      {/* Label row. */}
      {/* แถวป้าย */}
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          Password strength
        </span>
        <span className={cn("text-[11px] font-semibold", meta.text)}>
          {meta.label}
        </span>
      </div>
    </div>
  );
}

// ─── Success ─────────────────────────────────────────────────────────────────

/**
 * Final confirmation screen. Confirms the reset, notes that all sessions
 * were signed out, and offers a button back to login.
 *
 * (TH) หน้าจอยืนยันสุดท้าย ยืนยันการรีเซ็ต บอกว่าทุก session ถูกออกจากระบบ
 * แล้ว และมีปุ่มกลับไปเข้าสู่ระบบ
 */
function SuccessView({ onBackToLogin }: { onBackToLogin: () => void }) {
  return (
    <div className="space-y-5 text-center">
      {/* Success badge. */}
      {/* ตราสำเร็จ */}
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight">
          Password updated
        </h2>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Your password has been reset. For your security, we&apos;ve signed
          out all other sessions — please sign in again with your new password.
        </p>
      </div>
      {/* Back to login CTA. */}
      {/* ปุ่มกลับไปเข้าสู่ระบบ */}
      <Button
        variant="accent"
        size="lg"
        className="w-full"
        onClick={onBackToLogin}
      >
        <LogIn className="h-4 w-4" /> Back to login
      </Button>
    </div>
  );
}
