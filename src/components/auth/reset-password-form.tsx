/**
 * @file `<ResetPasswordForm>` — the secure 3-step "forgot password" wizard.
 *
 *   Step 1 — Identity:  choose a delivery channel (Email or SMS), enter the
 *             national ID (13 digits, masked to last 4) + the matching
 *             email/phone, then "Send code".
 *   Step 2 — OTP:       6 single-digit boxes, a 5-minute countdown, a resend
 *             button, generic error messages, and a server-enforced attempt
 *             cap / send rate-limit.
 *   Step 3 — Password:  new + confirm password with a live strength meter and
 *             a requirements checklist.
 *
 * OTP delivery + verification are real server calls now:
 *   POST /api/auth/send-otp    { method, identifier }
 *   POST /api/auth/verify-otp  { identifier, otp }
 * The server generates/hashes/stores the code (bcrypt + 5-min TTL), rate-limits
 * sends, and never returns the raw code. Client-side validation uses
 * `react-hook-form` + `zod`. On success every local session is invalidated via
 * the Zustand store's `reset()`.
 *
 * (TH) วิซาร์ด "ลืมรหัสผ่าน" 3 ขั้นแบบปลอดภัย
 *   ขั้น 1 — ตัวตน: เลือกช่องส่ง (อีเมล/SMS) + เลขบัตร ปชช. (ปิดบังเหลือ 4 ตัว
 *            ท้าย) + อีเมล/เบอร์ที่ตรงกับช่อง แล้วกด "ส่งโค้ด"
 *   ขั้น 2 — OTP: ช่องตัวเลข 6 ช่อง, นับถอยหลัง 5 นาที, ปุ่มส่งใหม่, ข้อความ
 *            error แบบ generic และเพดานครั้ง/rate-limit ที่บังคับฝั่ง server
 *   ขั้น 3 — รหัสผ่าน: ตั้งรหัสใหม่ + ยืนยัน พร้อมมิเตอร์และ checklist
 * การส่ง/ตรวจ OTP เป็นการเรียก server จริง: POST /api/auth/send-otp และ
 * /api/auth/verify-otp server สร้าง/hash/เก็บโค้ด (bcrypt + TTL 5 นาที),
 * จำกัดอัตราการส่ง และไม่คืนโค้ดดิบ เมื่อสำเร็จล้างทุก session ผ่าน `reset()`
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
  Mail,
  MessageSquare,
  RefreshCw,
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
  type DeliveryMethod,
  type IdentityValues,
  type OtpValues,
  type PasswordValues,
} from "@/lib/reset-password-schema";

// ─── Shared helpers ──────────────────────────────────────────────────────────

/** Resend cooldown so users can't hammer "Send again". */
/** (TH) คูลดาวน์การส่งใหม่ กันผู้ใช้กดรัว ๆ */
const RESEND_COOLDOWN_MS = 30 * 1000;

/** POST JSON and return the status + parsed body (never throws on non-2xx). */
/** (TH) POST JSON แล้วคืน status + body ที่ parse แล้ว (ไม่ throw เมื่อไม่ใช่ 2xx) */
async function postJson(
  url: string,
  body: unknown
): Promise<{ status: number; data: Record<string, unknown> }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { status: res.status, data };
  } catch {
    // Network error → surface as a generic 0 status.
    // เครือข่ายล้มเหลว → คืน status 0 แบบ generic
    return { status: 0, data: {} };
  }
}

/** Normalized outcome of a send-OTP request, shared by step 1 and resend. */
/** (TH) ผลลัพธ์ที่ normalize ของคำขอส่ง OTP ใช้ร่วมกันระหว่างขั้น 1 และส่งใหม่ */
type SendOutcome =
  | { ok: true; expiresAt: number }
  | { ok: false; rateLimitedMs: number | null };

/**
 * Call `POST /api/auth/send-otp` and normalize the response into a `SendOutcome`
 * (success with expiry, a rate-limit wait, or a generic failure). Used by both
 * the identity step and the OTP resend button so they map responses identically.
 *
 * (TH) เรียก `POST /api/auth/send-otp` แล้ว normalize เป็น `SendOutcome`
 * (สำเร็จพร้อมวันหมดอายุ, เวลารอ rate-limit, หรือล้มเหลวแบบ generic) ใช้ทั้งขั้น
 * ตัวตนและปุ่มส่งใหม่ เพื่อให้ map ผลเหมือนกัน
 */
async function requestSendOtp(
  method: DeliveryMethod,
  identifier: string
): Promise<SendOutcome> {
  const { status, data } = await postJson("/api/auth/send-otp", {
    method,
    identifier,
  });
  if (status === 200 && data.ok) {
    return { ok: true, expiresAt: Number(data.expiresAt) };
  }
  if (status === 429) {
    return { ok: false, rateLimitedMs: Number(data.retryAfter ?? 0) * 1000 };
  }
  return { ok: false, rateLimitedMs: null };
}

/**
 * Translate a verify-OTP failure body into user-facing copy + whether the user
 * must request a new code (expired/locked codes can't be retried).
 *
 * (TH) แปลง body ที่ตรวจ OTP ล้มเหลวเป็นข้อความสำหรับผู้ใช้ + บอกว่าต้องขอโค้ด
 * ใหม่ไหม (โค้ดที่หมดอายุ/ถูกล็อกลองซ้ำไม่ได้)
 */
function verifyErrorToState(data: Record<string, unknown>): {
  message: string;
  mustResend: boolean;
} {
  if (data.error === "locked") {
    return {
      message: "Too many incorrect attempts. Please request a new code.",
      mustResend: true,
    };
  }
  if (data.error === "expired") {
    return {
      message: "That code has expired. Request a new one.",
      mustResend: true,
    };
  }
  if (data.error === "invalid") {
    const left = Number(data.attemptsRemaining ?? 0);
    return {
      message: `Invalid verification code. ${left} attempt${
        left === 1 ? "" : "s"
      } remaining.`,
      mustResend: false,
    };
  }
  return { message: "Invalid verification code.", mustResend: false };
}

/**
 * Tick every second and return the milliseconds remaining until `target`
 * (0 once passed, 0 when `target` is null). Used for the OTP countdown,
 * the resend cooldown, and the send rate-limit window.
 *
 * (TH) เดินทุก 1 วินาทีและคืนมิลลิวินาทีที่เหลือจนถึง `target` (0 เมื่อเลย
 * กำหนดหรือ `target` เป็น null) ใช้กับนับถอยหลัง OTP, คูลดาวน์ส่งใหม่ และ
 * หน้าต่าง rate-limit
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
 * Mask the identifier for display on the OTP step — keeps the user oriented
 * ("we sent it to j•••@mail.com") without printing the full address/number.
 *
 * (TH) ปิดบัง identifier สำหรับแสดงบนขั้น OTP — ให้ผู้ใช้รู้ว่าโค้ดถูกส่งไปที่
 * ไหนคร่าว ๆ โดยไม่โชว์อีเมล/เบอร์เต็ม
 */
function maskContact(value: string): string {
  const v = value.trim();
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

/** What step 1 hands up once an OTP has been successfully sent. */
/** (TH) ข้อมูลที่ขั้น 1 ส่งขึ้นเมื่อส่ง OTP สำเร็จ */
interface SentPayload {
  method: DeliveryMethod;
  identifier: string;
  expiresAt: number;
}

// ─── Orchestrator ────────────────────────────────────────────────────────────

/** Which screen of the wizard is showing. */
/** (TH) กำลังแสดงหน้าจอไหนของวิซาร์ด */
type Step = 1 | 2 | 3 | "done";

/**
 * The wizard shell. Owns cross-step state (current step + the delivery target)
 * and renders the progress header + the active step. Individual steps own
 * their own form state and talk to the API directly.
 *
 * (TH) เปลือกของวิซาร์ด ถือ state ข้ามขั้น (ขั้นปัจจุบัน + เป้าหมายการส่ง) และ
 * render หัว progress + ขั้นปัจจุบัน แต่ละขั้นถือ state ฟอร์มของตัวเองและคุยกับ
 * API โดยตรง
 */
export function ResetPasswordForm() {
  const router = useRouter();
  // Wipes the persisted user/groups — our "invalidate all sessions" action.
  // ล้าง user/groups ที่เก็บไว้ — คือ action "ยกเลิกทุก session" ของเรา
  const resetStore = useVibeStore((s) => s.reset);

  const [step, setStep] = React.useState<Step>(1);
  // The verified delivery target, carried into the OTP step.
  // เป้าหมายการส่งที่ยืนยันแล้ว ส่งต่อเข้าขั้น OTP
  const [sent, setSent] = React.useState<SentPayload | null>(null);

  // Numeric progress for the bar (3 evenly-spaced steps; "done" = full).
  // ค่าความคืบหน้าของแถบ (3 ขั้นเท่า ๆ กัน; "done" = เต็ม)
  const progress = step === "done" ? 100 : Math.round((step / 3) * 100);

  /** Step 1 complete — an OTP was sent; advance to step 2. */
  /** (TH) ขั้น 1 เสร็จ — ส่ง OTP แล้ว ไปขั้น 2 */
  const handleSent = (payload: SentPayload) => {
    setSent(payload);
    setStep(2);
  };

  /** Step 3 complete — invalidate sessions, show success. */
  /** (TH) ขั้น 3 เสร็จ — ล้าง session, แสดงหน้าสำเร็จ */
  const handlePassword = () => {
    // Invalidate every existing session on this device after a reset.
    // ยกเลิกทุก session บนอุปกรณ์นี้หลังรีเซ็ตสำเร็จ
    resetStore();
    setStep("done");
  };

  return (
    <div className="space-y-6">
      {/* Header — title, progress bar, "back to login". */}
      {/* หัว — ชื่อ, แถบความคืบหน้า, ลิงก์กลับไปหน้าเข้าสู่ระบบ */}
      <Header step={step} progress={progress} />

      {/* Active step. */}
      {/* ขั้นที่กำลังแสดง */}
      {step === 1 && <IdentityStep onSent={handleSent} initial={sent} />}
      {step === 2 && sent && (
        <OtpStep
          method={sent.method}
          identifier={sent.identifier}
          initialExpiresAt={sent.expiresAt}
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
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
            <KeyRound className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
              Reset password
            </h1>
            <p className="text-xs text-muted-foreground">
              Secure account recovery
            </p>
          </div>
        </div>
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

// ─── Step 1 — Identity + channel ─────────────────────────────────────────────

/**
 * Identity step. Lets the user choose Email or SMS, enter the matching
 * email/phone + their national ID, then calls `POST /api/auth/send-otp`. The
 * server never reveals whether the account exists, so the only field errors
 * here are local format errors; send/rate-limit problems show as a form error.
 *
 * (TH) ขั้นตัวตน ให้ผู้ใช้เลือก Email หรือ SMS, กรอกอีเมล/เบอร์ที่ตรงกัน +
 * เลขบัตร แล้วเรียก `POST /api/auth/send-otp` server ไม่บอกว่ามีบัญชีจริงไหม
 * จึงมีแต่ error รูปแบบฝั่ง client; ปัญหาการส่ง/rate-limit แสดงเป็น error ฟอร์ม
 */
function IdentityStep({
  onSent,
  initial,
}: {
  onSent: (payload: SentPayload) => void;
  initial: SentPayload | null;
}) {
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<IdentityValues>({
    resolver: zodResolver(identitySchema),
    // Preserve prior choices when stepping back from the OTP screen.
    // คงค่าที่เลือกไว้เมื่อย้อนกลับจากหน้า OTP
    defaultValues: {
      method: initial?.method ?? "email",
      nationalId: "",
      identifier: initial?.identifier ?? "",
    },
  });
  const [submitting, setSubmitting] = React.useState(false);
  // Non-field error (send failure / rate-limit) shown above the button.
  // error ที่ไม่ใช่ของฟิลด์ (ส่งล้มเหลว / rate-limit) แสดงเหนือปุ่ม
  const [formError, setFormError] = React.useState<string | null>(null);

  const method = watch("method");
  const isEmailMethod = method === "email";

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    setSubmitting(true);
    const outcome = await requestSendOtp(values.method, values.identifier);
    setSubmitting(false);

    if (outcome.ok) {
      onSent({
        method: values.method,
        identifier: values.identifier,
        expiresAt: outcome.expiresAt,
      });
      return;
    }
    if (outcome.rateLimitedMs != null) {
      setFormError(
        `Too many requests. Please try again in ${formatMmSs(outcome.rateLimitedMs)}.`
      );
      return;
    }
    // Generic failure — keep it vague (no enumeration / provider details).
    // ล้มเหลวแบบ generic — กำกวมไว้ (ไม่ enumeration / ไม่บอกผู้ให้บริการ)
    setFormError("We couldn't send a code right now. Please try again.");
  });

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {/* Channel chooser — Email vs SMS. */}
      {/* ตัวเลือกช่อง — อีเมล vs SMS */}
      <Controller
        control={control}
        name="method"
        render={({ field }) => (
          <div>
            <Label className="mb-1.5 block">Where should we send the code?</Label>
            <div className="grid grid-cols-2 gap-2" role="radiogroup">
              <ChannelOption
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                checked={field.value === "email"}
                onSelect={() => field.onChange("email")}
              />
              <ChannelOption
                icon={<MessageSquare className="h-4 w-4" />}
                label="SMS"
                checked={field.value === "sms"}
                onSelect={() => field.onChange("sms")}
              />
            </div>
          </div>
        )}
      />

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

      {/* Email or phone — label/placeholder adapt to the chosen channel. */}
      {/* อีเมลหรือเบอร์ — label/placeholder ปรับตามช่องที่เลือก */}
      <div>
        <Label htmlFor="identifier" className="mb-1.5 block">
          {isEmailMethod ? "Email address" : "Phone number"}
        </Label>
        <Input
          id="identifier"
          type={isEmailMethod ? "email" : "tel"}
          inputMode={isEmailMethod ? "email" : "tel"}
          autoComplete={isEmailMethod ? "email" : "tel"}
          placeholder={
            isEmailMethod ? "you@vibetrip.app" : "+66 81 234 5678"
          }
          aria-invalid={!!errors.identifier}
          aria-describedby={errors.identifier ? "identifier-err" : undefined}
          {...register("identifier")}
        />
        <FieldError id="identifier-err">{errors.identifier?.message}</FieldError>
      </div>

      {/* Privacy note — explains the generic behavior. */}
      {/* หมายเหตุความเป็นส่วนตัว — อธิบายพฤติกรรม generic */}
      <p className="flex items-start gap-2 rounded-2xl border border-border/60 bg-secondary/30 p-3 text-[11px] text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
        For your security, we&apos;ll send a one-time code if these details
        match an account. You won&apos;t be told whether the account exists.
      </p>

      {/* Form-level error (send / rate-limit). */}
      {/* error ระดับฟอร์ม (ส่ง / rate-limit) */}
      <FieldError>{formError}</FieldError>

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
 * One channel chip (Email / SMS). A styled label wrapping a visually-hidden
 * radio, matching the registration form's option pattern.
 *
 * (TH) ปุ่มเลือกช่องหนึ่งอัน (Email / SMS) — label จัดสไตล์ห่อ radio ที่ซ่อน
 * ตามแพทเทิร์นของฟอร์มสมัคร
 */
function ChannelOption({
  icon,
  label,
  checked,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-2xl border p-3 text-sm font-medium transition-all",
        checked
          ? "border-accent bg-accent/10 ring-2 ring-accent/30"
          : "border-border bg-background hover:border-accent/40"
      )}
    >
      <input
        type="radio"
        name="otp-method"
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
          checked ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
        )}
      >
        {icon}
      </span>
      {label}
    </label>
  );
}

/**
 * Masked national-ID input. Stores raw digits but, when blurred, shows only
 * the last 4 (e.g. `•••••••••0123`). On focus it reveals the raw value so the
 * user can edit it normally. Digit-only, capped at 13.
 *
 * (TH) ช่องเลขบัตรแบบปิดบัง เก็บตัวเลขดิบ แต่เมื่อไม่ได้โฟกัสจะโชว์แค่ 4 ตัว
 * ท้าย เมื่อโฟกัสจะเผยค่าดิบให้แก้ไขได้ รับเฉพาะตัวเลข สูงสุด 13 หลัก
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
 * OTP step. Renders the 6 digit boxes, a live 5-minute expiry countdown, and
 * a resend button (with a cooldown + rate-limit awareness). Verifies via
 * `POST /api/auth/verify-otp` and resends via `POST /api/auth/send-otp`. All
 * error copy is intentionally generic.
 *
 * (TH) ขั้น OTP แสดงช่องตัวเลข 6 ช่อง, นับถอยหลังหมดอายุ 5 นาทีแบบสด และปุ่ม
 * ส่งใหม่ (รู้คูลดาวน์ + rate-limit) ตรวจผ่าน `verify-otp` และส่งใหม่ผ่าน
 * `send-otp` ข้อความ error เป็นแบบ generic โดยตั้งใจ
 */
function OtpStep({
  method,
  identifier,
  initialExpiresAt,
  onVerified,
  onBack,
}: {
  method: DeliveryMethod;
  identifier: string;
  initialExpiresAt: number;
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

  // Current code expiry + when it was last sent (drives the cooldown).
  // เวลาหมดอายุของโค้ดปัจจุบัน + เวลาที่ส่งล่าสุด (ขับเคลื่อนคูลดาวน์)
  const [expiresAt, setExpiresAt] = React.useState(initialExpiresAt);
  const [sentAt, setSentAt] = React.useState(() => Date.now());
  // When the server rate-limited a resend, until when (epoch ms) or null.
  // เมื่อ server จำกัดการส่งใหม่ จนถึงเมื่อไร (epoch ms) หรือ null
  const [rateLimitedUntil, setRateLimitedUntil] = React.useState<number | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);
  // True after expiry/lock — the current code is dead; a resend is required.
  // จริงหลังหมดอายุ/ถูกล็อก — โค้ดปัจจุบันตายแล้ว ต้องส่งใหม่
  const [mustResend, setMustResend] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [resending, setResending] = React.useState(false);

  const channelLabel = method === "email" ? "email" : "SMS";
  const masked = maskContact(identifier);

  // Countdowns.
  // นับถอยหลัง
  const expiryLeft = useRemaining(expiresAt);
  const cooldownLeft = useRemaining(sentAt + RESEND_COOLDOWN_MS);
  const rateLeft = useRemaining(rateLimitedUntil);

  const expired = expiryLeft <= 0;
  const resendWaitLeft = Math.max(cooldownLeft, rateLeft);
  const canResend = resendWaitLeft <= 0 && !verifying && !resending;
  const verifyDisabled = verifying || expired || mustResend;

  // Local expiry → require a resend and disable verify.
  // หมดอายุฝั่ง client → ต้องส่งใหม่และปิดปุ่มยืนยัน
  React.useEffect(() => {
    if (expired) setMustResend(true);
  }, [expired]);

  const submit = handleSubmit(async ({ code }) => {
    setServerError(null);
    setVerifying(true);
    const { status, data } = await postJson("/api/auth/verify-otp", {
      identifier,
      otp: code,
    });
    setVerifying(false);

    if (status === 200 && data.ok) {
      onVerified();
      return;
    }
    // Map the (deliberately vague) failure into user-facing copy.
    // แปลงผลล้มเหลว (ที่จงใจกำกวม) เป็นข้อความสำหรับผู้ใช้
    const { message, mustResend: needsNewCode } = verifyErrorToState(data);
    setServerError(message);
    if (needsNewCode) setMustResend(true);
    reset({ code: "" });
  });

  const handleResendClick = async () => {
    if (!canResend) return;
    setResending(true);
    setServerError(null);
    const outcome = await requestSendOtp(method, identifier);
    setResending(false);

    if (outcome.ok) {
      setExpiresAt(outcome.expiresAt);
      setSentAt(Date.now());
      setRateLimitedUntil(null);
      setMustResend(false);
      reset({ code: "" });
      return;
    }
    if (outcome.rateLimitedMs != null) {
      setRateLimitedUntil(Date.now() + outcome.rateLimitedMs);
      setServerError(
        `Too many requests. Try again in ${formatMmSs(outcome.rateLimitedMs)}.`
      );
      return;
    }
    setServerError("We couldn't resend the code. Please try again.");
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {/* Where we sent the code + via which channel. */}
      {/* บอกว่าส่งโค้ดไปที่ไหน + ผ่านช่องไหน */}
      <p className="text-sm text-muted-foreground">
        Enter the 6-digit code we sent via {channelLabel} to{" "}
        <span className="font-medium text-foreground">{masked}</span>.
      </p>

      {/* The 6 digit boxes. */}
      {/* ช่องตัวเลข 6 ช่อง */}
      <Controller
        control={control}
        name="code"
        render={({ field }) => (
          <OtpInput
            value={field.value}
            onChange={field.onChange}
            disabled={verifyDisabled}
            invalid={!!errors.code || !!serverError}
            autoFocus
            describedBy={serverError ? "otp-err" : undefined}
          />
        )}
      />

      {/* Format error (zod) or generic server error. */}
      {/* error รูปแบบ (zod) หรือ error generic จาก server */}
      <FieldError id="otp-err">{errors.code?.message ?? serverError}</FieldError>

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
          {resending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {canResend ? "Resend code" : `Resend in ${formatMmSs(resendWaitLeft)}`}
        </button>
      </div>

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
          disabled={verifyDisabled}
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
 * requirements checklist. On submit it finalizes via `onComplete` (which
 * invalidates all sessions and shows the success screen).
 *
 * (TH) ขั้นรหัสผ่าน ตั้งรหัสใหม่ + ยืนยัน พร้อมมิเตอร์ความแข็งแรงแบบสดและ
 * checklist เงื่อนไข เมื่อกดยืนยันจะปิดงานผ่าน `onComplete` (ล้างทุก session
 * และแสดงหน้าสำเร็จ)
 */
function PasswordStep({ onComplete }: { onComplete: () => void }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onChange",
  });
  const [reveal, setReveal] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const password = watch("password") ?? "";
  const strength = getPasswordStrength(password);

  const submit = handleSubmit(async () => {
    setSubmitting(true);
    // Simulated latency so the spinner is visible (no password API in scope).
    // จำลอง delay ให้เห็น spinner (ยังไม่มี API ตั้งรหัสในขอบเขตนี้)
    await new Promise((r) => setTimeout(r, 500));
    setSubmitting(false);
    onComplete();
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
