/**
 * @file `<RegistrationForm>` — the 2-step registration wizard used on
 * `/register`. Step 1 collects identity (name, contact, address, avatar,
 * national ID OR passport) and step 2 collects security (password) plus
 * optional travel insurance. On submit it composes a `User` object and
 * hands it to the parent via `onSubmit`.
 *
 * File layout:
 *   1. Public types and small constants.
 *   2. The main `RegistrationForm` component (state, validation, submit).
 *   3. `StepIndicator` — header progress component.
 *   4. `Step1` / `Step2` — the two pages of the wizard.
 *   5. `IdentityDocumentField` + `DocTypeOption` — ID card / passport picker.
 *   6. `InsuranceSelector` — preset chooser + dependent fields.
 *   7. Reusable `FieldGrid` and `Field` primitives.
 *
 * (TH) ฟอร์มสมัครสมาชิก 2 ขั้นตอนของหน้า `/register` ขั้น 1 กรอกข้อมูล
 * ส่วนตัว (ชื่อ, ติดต่อ, ที่อยู่, รูป, บัตรปชช./พาสปอร์ต) ขั้น 2 ตั้งรหัสผ่าน
 * และข้อมูลประกัน (ไม่บังคับ) เมื่อกดยืนยันจะประกอบเป็น `User` ส่งกลับ
 * ผ่าน `onSubmit`
 */

"use client";

import * as React from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Globe2,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AvatarUpload } from "@/components/common/avatar-upload";
import { cn, generateId } from "@/lib/utils";
import type {
  GeoCoords,
  IdentityDocument,
  InsuranceDetails,
  User,
} from "@/lib/types";

// ─── 1. Public API ───────────────────────────────────────────────────────────

/**
 * Flat shape of the form's raw values — everything the user types is
 * tracked here verbatim, before normalization/validation. The submit
 * handler reshapes these into the cleaner `User` / `IdentityDocument` /
 * `InsuranceDetails` domain types.
 *
 * (TH) ค่าดิบของฟอร์ม — สิ่งที่ผู้ใช้พิมพ์ทั้งหมดจะอยู่ในนี้ก่อนถูก
 * normalize/validate ฟังก์ชัน submit จะเรียบเรียงเป็น `User` พร้อม
 * `IdentityDocument` / `InsuranceDetails` อีกที
 */
export interface RegistrationValues {
  firstName: string;
  lastName: string;
  nickname: string;
  phone: string;
  email: string;
  homeAddress: string;
  avatarDataUrl?: string;
  idType: "id_card" | "passport";
  idCardNumber: string;
  passportNumber: string;
  password: string;
  confirmPassword: string;
  insuranceProvider: string;
  insuranceProviderCustom: string;
  insurancePolicyNumber: string;
  insuranceEmergencyContact: string;
}

/**
 * Props for `<RegistrationForm>`. The form reaches out to `useGeolocation`
 * via the parent (so the same hook can be reused on `/welcome`); the
 * caller wires up location status/retry from there.
 *
 * (TH) Props: ฟอร์มไม่ได้เรียก `useGeolocation` เอง — parent จะใช้ฮุก
 * อันเดียวกันแล้วส่ง state มาให้ เพื่อให้ใช้ซ้ำกับ `/welcome` ได้ง่าย
 */
interface RegistrationFormProps {
  location: GeoCoords | null;
  locationStatus: string;
  onLocationRetry: () => void;
  onSubmit: (user: User) => void;
}

/** Map of per-field validation error messages (keys are form field names). */
/** (TH) แผนที่ error ของแต่ละ field — key คือชื่อ field, value คือข้อความ error */
type ErrorMap = Partial<Record<keyof RegistrationValues, string>>;

/**
 * Preset insurance providers shown as radio chips. `"custom"` reveals
 * a free-text provider field; `"none"` lets the user skip insurance
 * entirely (a warning will then appear on the SOS card).
 *
 * (TH) รายชื่อบริษัทประกันแบบ preset แสดงเป็นปุ่ม radio
 * - `"custom"` จะเปิดช่องกรอกชื่อบริษัทเอง
 * - `"none"` ข้ามการกรอกประกัน (จะมี warning บน SOS card)
 */
const INSURANCE_PRESETS: { id: string; label: string }[] = [
  { id: "axa", label: "AXA Travel" },
  { id: "allianz", label: "Allianz" },
  { id: "chubb", label: "Chubb" },
  { id: "world_nomads", label: "World Nomads" },
  { id: "tip", label: "TIP Insurance" },
  { id: "custom", label: "Other / Custom" },
  { id: "none", label: "Skip for now" },
];

// ─── 2. Main component ───────────────────────────────────────────────────────

/**
 * The 2-step registration wizard. Holds all form state locally and only
 * bubbles a finished `User` upstream when validation passes.
 *
 * (TH) ฟอร์มสมัคร 2 ขั้นตอน ถือ state ของฟอร์มทั้งหมดไว้ในตัวเอง และ
 * จะส่ง `User` ที่ผ่าน validation ขึ้น parent เมื่อสมัครเสร็จเท่านั้น
 */
export function RegistrationForm({
  location,
  locationStatus,
  onLocationRetry,
  onSubmit,
}: RegistrationFormProps) {
  // Wizard step — start at 1, advance to 2 after step-1 validation passes.
  // ขั้นตอน wizard — เริ่มที่ 1, ไปขั้น 2 เมื่อ validation ขั้น 1 ผ่าน
  const [step, setStep] = React.useState<1 | 2>(1);
  // True only while the (fake) submit promise is in-flight.
  // true เฉพาะระหว่างส่งจริง (จำลอง)
  const [submitting, setSubmitting] = React.useState(false);
  // Per-field validation errors; populated by `validateStepN()`.
  // error ต่อ field ที่ populate โดย `validateStepN()`
  const [errors, setErrors] = React.useState<ErrorMap>({});

  // All raw form values in one place — see `RegistrationValues`.
  // ค่า raw ของฟอร์มทั้งหมด — ดูชนิดได้ที่ `RegistrationValues`
  const [values, setValues] = React.useState<RegistrationValues>({
    firstName: "",
    lastName: "",
    nickname: "",
    phone: "",
    email: "",
    homeAddress: "",
    avatarDataUrl: undefined,
    idType: "id_card",
    idCardNumber: "",
    passportNumber: "",
    password: "",
    confirmPassword: "",
    insuranceProvider: "axa",
    insuranceProviderCustom: "",
    insurancePolicyNumber: "",
    insuranceEmergencyContact: "",
  });

  /**
   * Update one field and clear its error if any. Type-safe key access
   * via the generic `K extends keyof RegistrationValues`.
   *
   * (TH) อัปเดต field เดียวและล้าง error ของ field นั้นถ้ามี ใช้ generic
   * `K extends keyof RegistrationValues` เพื่อความ type-safe
   */
  const set = <K extends keyof RegistrationValues>(
    key: K,
    val: RegistrationValues[K]
  ) => {
    setValues((v) => ({ ...v, [key]: val }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  /**
   * Validate the step-1 fields and return a fresh ErrorMap. Pure —
   * the caller decides what to do with the result.
   *
   * (TH) validate ทุก field ของขั้น 1 แล้วคืน ErrorMap ใหม่ — ตัว validate
   * เองเป็น pure function caller เป็นคนตัดสินใจว่าจะใช้ผลอย่างไร
   */
  const validateStep1 = (): ErrorMap => {
    const e: ErrorMap = {};
    if (!values.firstName.trim()) e.firstName = "Required";
    if (!values.lastName.trim()) e.lastName = "Required";
    if (!values.nickname.trim()) e.nickname = "Required";
    if (!values.phone.trim()) e.phone = "Required";
    else if (!/^[0-9+\-\s()]{7,}$/.test(values.phone))
      e.phone = "Invalid phone number";
    if (!values.email.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      e.email = "Invalid email";
    if (!values.homeAddress.trim()) e.homeAddress = "Required";
    // ID validation branches on `idType` — only the relevant field is checked.
    // validate ID — แยกเงื่อนไขตาม idType ตรวจเฉพาะ field ที่เกี่ยวข้อง
    if (values.idType === "id_card") {
      const digits = values.idCardNumber.replace(/\D/g, "");
      if (!digits) e.idCardNumber = "Required";
      else if (digits.length !== 13)
        e.idCardNumber = "Thai ID must be exactly 13 digits";
    } else {
      const v = values.passportNumber.trim();
      if (!v) e.passportNumber = "Required";
      else if (!/^[A-Za-z0-9]{6,20}$/.test(v))
        e.passportNumber =
          "Passport must be 6–20 alphanumeric characters (letters & numbers only)";
    }
    return e;
  };

  /**
   * Validate the step-2 fields. Insurance sub-fields are only required
   * when the user has chosen a real provider (not "none").
   *
   * (TH) validate ขั้น 2 — sub-field ของประกันจะบังคับเฉพาะเมื่อเลือก
   * บริษัทจริง (ไม่ใช่ "none")
   */
  const validateStep2 = (): ErrorMap => {
    const e: ErrorMap = {};
    if (!values.password) e.password = "Required";
    else if (values.password.length < 8)
      e.password = "At least 8 characters";
    if (values.confirmPassword !== values.password)
      e.confirmPassword = "Passwords do not match";

    // Custom provider requires a name.
    // ถ้าเลือกบริษัทเอง ต้องกรอกชื่อบริษัท
    if (values.insuranceProvider === "custom") {
      if (!values.insuranceProviderCustom.trim())
        e.insuranceProviderCustom = "Enter the provider name";
    }
    // Skip ⇒ no sub-fields needed; otherwise policy + emergency contact required.
    // ถ้าข้าม ไม่ต้องกรอก sub-field; ถ้าไม่ข้ามต้องกรอกเลขกรมธรรม์และผู้ติดต่อ
    if (
      values.insuranceProvider !== "none" &&
      values.insuranceProvider !== ""
    ) {
      if (!values.insurancePolicyNumber.trim())
        e.insurancePolicyNumber = "Required";
      if (!values.insuranceEmergencyContact.trim())
        e.insuranceEmergencyContact = "Required";
    }
    return e;
  };

  /**
   * Advance from step 1 → step 2 (only if step-1 is valid). Scrolls to
   * the top so the user sees the new fields from the start.
   *
   * (TH) ไปขั้น 2 (ต้องผ่าน validation ขั้น 1 ก่อน) แล้ว scroll ขึ้นบนสุด
   * เพื่อให้ผู้ใช้เห็นฟอร์มจากด้านบน
   */
  const goNext = () => {
    const found = validateStep1();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setStep(2);
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Step back to step 1 (no validation needed — values are preserved).
   *
   * (TH) กลับไปขั้น 1 — ไม่ต้อง validate ใหม่ ค่าเดิมยังอยู่ครบ
   */
  const goBack = () => {
    setStep(1);
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Final submit handler — validates both steps, composes the `User`
   * object, and hands it to the parent. If step-1 has errors we jump
   * back to step 1 first so the user can see them.
   *
   * (TH) ฟังก์ชัน submit สุดท้าย — validate ทั้งสองขั้น, ประกอบเป็น `User`
   * แล้วส่งกลับ parent ถ้าขั้น 1 ยังมี error จะ jump กลับไปขั้น 1 ก่อน
   */
  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const step1Errors = validateStep1();
    const step2Errors = validateStep2();
    const merged = { ...step1Errors, ...step2Errors };
    setErrors(merged);
    if (Object.keys(step1Errors).length > 0) {
      setStep(1);
      return;
    }
    if (Object.keys(step2Errors).length > 0) return;

    setSubmitting(true);
    // Fake network latency so the spinner is visible.
    // จำลอง delay เครือข่ายเพื่อให้ผู้ใช้เห็น spinner
    await new Promise((r) => setTimeout(r, 400));

    // Build the typed identity document from the raw fields.
    // ประกอบ identity document ที่มี type จากค่าดิบในฟอร์ม
    const identityDocument: IdentityDocument =
      values.idType === "id_card"
        ? {
            type: "id_card",
            number: values.idCardNumber.replace(/\D/g, ""),
          }
        : { type: "passport", number: values.passportNumber.trim() };

    // Build insurance details only when the user picked a real provider.
    // ใส่ insurance details เฉพาะเมื่อเลือกบริษัทจริง (ไม่ใช่ none/ว่าง)
    let insurance: InsuranceDetails | undefined;
    if (
      values.insuranceProvider &&
      values.insuranceProvider !== "none"
    ) {
      // Resolve provider label: free-text vs preset.
      // ดึงชื่อบริษัทประกัน: ของกรอกเอง vs preset
      const providerLabel =
        values.insuranceProvider === "custom"
          ? values.insuranceProviderCustom.trim()
          : INSURANCE_PRESETS.find((p) => p.id === values.insuranceProvider)
              ?.label ?? "";
      if (providerLabel) {
        insurance = {
          provider: providerLabel,
          policyNumber: values.insurancePolicyNumber.trim(),
          emergencyContact: values.insuranceEmergencyContact.trim(),
        };
      }
    }

    // Final `User` payload sent up to the page.
    // payload `User` สุดท้ายที่ส่งให้ page
    const user: User = {
      id: generateId("usr"),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      nickname: values.nickname.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      homeAddress: values.homeAddress.trim(),
      avatarDataUrl: values.avatarDataUrl,
      preferences: [],
      location: location ?? undefined,
      identityDocument,
      insurance,
      createdAt: new Date().toISOString(),
    };
    onSubmit(user);
  };

  return (
    // <form> — wraps both steps, handles Enter to submit.
    // <form> — ห่อทั้งสองขั้น รองรับ Enter เพื่อ submit
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Step indicator row at the top. */}
      {/* แถวแสดงขั้นตอนปัจจุบันด้านบน */}
      <StepIndicator step={step} />

      {/* Conditional render — Step1 or Step2 depending on `step`. */}
      {/* แสดง Step1 หรือ Step2 ตามค่า `step` */}
      {step === 1 ? (
        <Step1
          values={values}
          errors={errors}
          set={set}
          location={location}
          locationStatus={locationStatus}
          onLocationRetry={onLocationRetry}
        />
      ) : (
        <Step2 values={values} errors={errors} set={set} />
      )}

      {/* Footer button row — back/next, plus final submit on step 2. */}
      {/* แถวปุ่มด้านล่าง — back/next และ submit สุดท้ายในขั้น 2 */}
      <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        {step === 2 ? (
          /* Back button — only on step 2. */
          /* ปุ่ม Back — มีเฉพาะตอนอยู่ขั้น 2 */
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={goBack}
            className="sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        ) : (
          /* Invisible spacer keeps the Next button right-aligned on step 1. */
          /* ตัวเว้นว่างเพื่อให้ปุ่ม Next ชิดขวาตอนอยู่ขั้น 1 */
          <span aria-hidden className="hidden sm:block" />
        )}

        {step === 1 ? (
          /* Next button — advances to step 2 if step-1 validation passes. */
          /* ปุ่ม Next — ไปขั้น 2 ถ้า validation ขั้น 1 ผ่าน */
          <Button
            type="button"
            variant="accent"
            size="lg"
            onClick={goNext}
            className="sm:w-auto"
          >
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          /* Final submit button — disables and shows spinner during fake call. */
          /* ปุ่ม submit สุดท้าย — disable และโชว์ spinner ระหว่างเรียก */
          <Button
            type="submit"
            variant="accent"
            size="lg"
            disabled={submitting}
            className="sm:w-auto"
          >
            {submitting ? (
              // Spinner shown while submitting.
              // spinner ระหว่างกำลังสมัคร
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              // Idle CTA content.
              // เนื้อหาปุ่มตอนปกติ
              <>
                <Sparkles className="h-4 w-4" /> Create account
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
}

// ─── 3. Step indicator ───────────────────────────────────────────────────────

/**
 * Visual progress bar at the top of the wizard. Shows current step,
 * completed step (with a checkmark), and connector lines.
 *
 * (TH) แถบแสดงความคืบหน้าด้านบน wizard บอกขั้นปัจจุบัน, ขั้นที่เสร็จแล้ว
 * (เครื่องหมายถูก) และเส้นต่อระหว่างขั้น
 */
function StepIndicator({ step }: { step: 1 | 2 }) {
  // The two steps shown left to right.
  // ทั้งสองขั้นเรียงจากซ้ายไปขวา
  const items = [
    { n: 1, label: "Personal info" },
    { n: 2, label: "Security & insurance" },
  ];
  return (
    // Indicator container — pill row with subtle background.
    // ตัวห่อ indicator — แถวทรงแคปซูลมีพื้นจาง ๆ
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-secondary/30 px-4 py-3 text-xs">
      {/* "Step N of 2" label on the left. */}
      {/* ข้อความ "Step N of 2" ด้านซ้าย */}
      <span className="font-medium uppercase tracking-wider text-muted-foreground">
        Step {step} of 2
      </span>
      {/* Dots + labels on the right. */}
      {/* จุด + ข้อความ ด้านขวา */}
      <div className="flex items-center gap-2">
        {items.map((it, idx) => {
          // Resolve done/active status for this dot.
          // คำนวณว่า dot นี้ done/active หรือไม่
          const done = step > it.n;
          const active = step === it.n;
          return (
            // Fragment groups the dot + connector for one step.
            // Fragment รวม dot + เส้นต่อของขั้นเดียวกัน
            <React.Fragment key={it.n}>
              {/* Dot + label cluster. */}
              {/* กลุ่ม dot + label */}
              <div className="flex items-center gap-2">
                {/* The numbered/check circle. */}
                {/* วงกลมเลขขั้น/เครื่องหมายถูก */}
                <span
                  className={cn(
                    "grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold transition-colors",
                    done && "bg-emerald-500 text-white",
                    active &&
                      "bg-accent text-accent-foreground ring-2 ring-accent/30",
                    !done && !active && "bg-secondary text-muted-foreground"
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : it.n}
                </span>
                {/* Step label (hidden on small screens). */}
                {/* ข้อความขั้น (ซ่อนบนจอเล็ก) */}
                <span
                  className={cn(
                    "hidden text-xs font-medium sm:inline-block",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {it.label}
                </span>
              </div>
              {idx < items.length - 1 && (
                /* Connector line — turns green once previous step is done. */
                /* เส้นต่อระหว่างขั้น — กลายเป็นสีเขียวเมื่อขั้นก่อนหน้าเสร็จ */
                <span
                  className={cn(
                    "h-px w-8 sm:w-12",
                    done ? "bg-emerald-500" : "bg-border"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── 4. Steps ────────────────────────────────────────────────────────────────

/**
 * Shared props passed down to both `Step1` and `Step2` — current
 * values, error map, and the type-safe setter.
 *
 * (TH) Props ที่ส่งให้ทั้ง `Step1` และ `Step2` — ค่าปัจจุบัน, error map,
 * และฟังก์ชัน setter ที่ type-safe
 */
interface StepProps {
  values: RegistrationValues;
  errors: ErrorMap;
  set: <K extends keyof RegistrationValues>(
    key: K,
    val: RegistrationValues[K]
  ) => void;
}

/** Step 1 needs geolocation context for the location helper card. */
/** (TH) Step1 ต้องการ context geolocation สำหรับการ์ดข้อมูลตำแหน่ง */
interface Step1Props extends StepProps {
  location: GeoCoords | null;
  locationStatus: string;
  onLocationRetry: () => void;
}

/**
 * Step 1 — personal info. Avatar uploader + location card on top,
 * then a 2-col grid of personal fields, then the identity document
 * picker.
 *
 * (TH) ขั้น 1 — ข้อมูลส่วนตัว เริ่มด้วย avatar upload + การ์ดตำแหน่ง,
 * แล้วตามด้วยตารางช่องกรอก 2 คอลัมน์, จบด้วยตัวเลือกเอกสารยืนยันตัวตน
 */
function Step1({
  values,
  errors,
  set,
  location,
  locationStatus,
  onLocationRetry,
}: Step1Props) {
  return (
    // Step 1 vertical container.
    // ตัวห่อแนวตั้งของขั้น 1
    <div className="space-y-6">
      {/* Top row — avatar uploader + location helper card. */}
      {/* แถวบน — ตัวอัปโหลด avatar + การ์ดข้อมูลตำแหน่ง */}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* Avatar picker (writes back to values.avatarDataUrl). */}
        {/* ตัวเลือก avatar (เซตค่าให้ values.avatarDataUrl) */}
        <AvatarUpload
          value={values.avatarDataUrl}
          onChange={(d) => set("avatarDataUrl", d)}
        />

        {/* Location helper card — shows current status + retry CTA. */}
        {/* การ์ดข้อมูลตำแหน่ง — บอกสถานะปัจจุบัน + ปุ่มขอใหม่ */}
        <div className="flex w-full max-w-xs items-start gap-2 rounded-2xl border border-border/60 bg-secondary/40 p-3 text-xs">
          {/* Pin icon on the left. */}
          {/* ไอคอนหมุดด้านซ้าย */}
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          {/* Card body — title + dynamic status line. */}
          {/* เนื้อการ์ด — ชื่อ + บรรทัดสถานะ */}
          <div className="flex-1">
            {/* Title */}
            {/* ชื่อ */}
            <div className="font-medium text-foreground">Location access</div>
            {/* Status line — branches on `locationStatus`. */}
            {/* บรรทัดสถานะ — เปลี่ยนตาม `locationStatus` */}
            <div className="text-muted-foreground">
              {locationStatus === "loading" && "Requesting permission…"}
              {locationStatus === "granted" && location && (
                <>
                  {location.lat.toFixed(3)}°, {location.lng.toFixed(3)}°
                </>
              )}
              {(locationStatus === "denied" ||
                locationStatus === "error" ||
                locationStatus === "idle") && (
                /* Retry CTA — clicks ask the browser for permission again. */
                /* ปุ่ม retry — กดจะขอ permission อีกครั้ง */
                <button
                  type="button"
                  onClick={onLocationRetry}
                  className="text-accent hover:underline"
                >
                  Enable to personalize trips
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Personal information field grid (2 cols on sm+). */}
      {/* ตารางช่องกรอกข้อมูลส่วนตัว (2 คอลัมน์ตั้งแต่จอ sm) */}
      <FieldGrid>
        {/* First name */}
        {/* ชื่อจริง */}
        <Field
          label="First name"
          error={errors.firstName}
          value={values.firstName}
          onChange={(v) => set("firstName", v)}
          autoComplete="given-name"
        />
        {/* Last name */}
        {/* นามสกุล */}
        <Field
          label="Last name"
          error={errors.lastName}
          value={values.lastName}
          onChange={(v) => set("lastName", v)}
          autoComplete="family-name"
        />
        {/* Nickname (used as the @handle and as a greeting). */}
        {/* nickname (ใช้เป็น @handle และคำทักทาย) */}
        <Field
          label="Nickname"
          error={errors.nickname}
          value={values.nickname}
          onChange={(v) => set("nickname", v)}
          autoComplete="nickname"
        />
        {/* Phone number (regex-validated for digits and a few separators). */}
        {/* เบอร์โทร (regex อนุญาตเลขและสัญลักษณ์คั่นพื้นฐาน) */}
        <Field
          label="Phone number"
          error={errors.phone}
          value={values.phone}
          onChange={(v) => set("phone", v)}
          type="tel"
          autoComplete="tel"
          placeholder="+66 81 234 5678"
        />
        {/* Email — spans both columns. */}
        {/* อีเมล — กินสองคอลัมน์ */}
        <Field
          label="Email"
          error={errors.email}
          value={values.email}
          onChange={(v) => set("email", v)}
          type="email"
          autoComplete="email"
          full
        />
        {/* Home address — spans both columns. */}
        {/* ที่อยู่ — กินสองคอลัมน์ */}
        <Field
          label="Home address"
          error={errors.homeAddress}
          value={values.homeAddress}
          onChange={(v) => set("homeAddress", v)}
          autoComplete="street-address"
          full
        />
      </FieldGrid>

      {/* Identity document section (ID card vs passport). */}
      {/* ส่วนเอกสารยืนยันตัวตน (บัตรปชช. หรือพาสปอร์ต) */}
      <IdentityDocumentField
        idType={values.idType}
        idCardNumber={values.idCardNumber}
        passportNumber={values.passportNumber}
        idCardError={errors.idCardNumber}
        passportError={errors.passportNumber}
        onChangeType={(t) => set("idType", t)}
        onChangeIdCard={(v) => set("idCardNumber", v)}
        onChangePassport={(v) => set("passportNumber", v)}
      />
    </div>
  );
}

/**
 * Step 2 — security (password) and insurance. Two grouped sections,
 * each in its own card.
 *
 * (TH) ขั้น 2 — ความปลอดภัย (password) และข้อมูลประกัน แบ่งเป็น 2
 * section ใส่ในการ์ดแยกกัน
 */
function Step2({ values, errors, set }: StepProps) {
  return (
    // Step 2 vertical container.
    // ตัวห่อแนวตั้งของขั้น 2
    <div className="space-y-6">
      {/* Security section card. */}
      {/* การ์ด section ความปลอดภัย */}
      <section className="rounded-3xl border border-border/60 bg-secondary/30 p-4 sm:p-5">
        {/* Section header row. */}
        {/* แถวหัว section */}
        <div className="mb-3 flex items-center gap-2">
          {/* Lock icon */}
          {/* ไอคอนกุญแจ */}
          <Lock className="h-4 w-4 text-accent" />
          {/* "Security" caption */}
          {/* คำว่า "Security" */}
          <span className="text-sm font-semibold tracking-tight">
            Security
          </span>
        </div>
        {/* Password + confirm grid. */}
        {/* ตาราง password + confirm */}
        <FieldGrid>
          {/* Password field (≥8 chars). */}
          {/* ช่องรหัสผ่าน (≥8 ตัวอักษร) */}
          <Field
            label="Password"
            error={errors.password}
            value={values.password}
            onChange={(v) => set("password", v)}
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
          {/* Confirm-password field (must equal password). */}
          {/* ช่องยืนยันรหัสผ่าน (ต้องตรงกับ password) */}
          <Field
            label="Confirm password"
            error={errors.confirmPassword}
            value={values.confirmPassword}
            onChange={(v) => set("confirmPassword", v)}
            type="password"
            autoComplete="new-password"
          />
        </FieldGrid>
      </section>

      {/* Insurance section card. */}
      {/* การ์ด section ประกัน */}
      <section className="rounded-3xl border border-border/60 bg-secondary/30 p-4 sm:p-5">
        {/* Section header row with right-aligned hint. */}
        {/* แถวหัว section พร้อมข้อความช่วยทางขวา */}
        <div className="mb-3 flex items-center gap-2">
          {/* Shield-check icon. */}
          {/* ไอคอนโล่ */}
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          {/* "Travel insurance" caption. */}
          {/* คำว่า "Travel insurance" */}
          <span className="text-sm font-semibold tracking-tight">
            Travel insurance
          </span>
          {/* Right-aligned helper note. */}
          {/* note ช่วยเหลือชิดขวา */}
          <span className="ml-auto text-[11px] text-muted-foreground">
            Required for SOS card
          </span>
        </div>
        {/* Insurance selector + dependent fields. */}
        {/* ตัวเลือกบริษัทประกัน + field ที่ขึ้นกับการเลือก */}
        <InsuranceSelector
          provider={values.insuranceProvider}
          custom={values.insuranceProviderCustom}
          policy={values.insurancePolicyNumber}
          contact={values.insuranceEmergencyContact}
          errors={errors}
          onProvider={(id) => set("insuranceProvider", id)}
          onCustom={(v) => set("insuranceProviderCustom", v)}
          onPolicy={(v) => set("insurancePolicyNumber", v)}
          onContact={(v) => set("insuranceEmergencyContact", v)}
        />
      </section>
    </div>
  );
}

// ─── 5. Identity document field ──────────────────────────────────────────────

interface IdentityDocumentFieldProps {
  idType: "id_card" | "passport";
  idCardNumber: string;
  passportNumber: string;
  idCardError?: string;
  passportError?: string;
  onChangeType: (t: "id_card" | "passport") => void;
  onChangeIdCard: (v: string) => void;
  onChangePassport: (v: string) => void;
}

/**
 * Identity document section — radio chooser for "Thai ID card" vs
 * "Passport", and a context-dependent input below. The number input
 * normalizes its value (digits-only / alphanumeric uppercase) before
 * forwarding to the parent.
 *
 * (TH) section เอกสารยืนยันตัวตน — เลือกระหว่าง "บัตรปชช." หรือ
 * "พาสปอร์ต" แล้วโชว์ช่องกรอกตามที่เลือก ค่าจะถูก normalize (ตัวเลข
 * เท่านั้น/ตัวอักษรตัวพิมพ์ใหญ่) ก่อนส่งกลับ parent
 */
function IdentityDocumentField({
  idType,
  idCardNumber,
  passportNumber,
  idCardError,
  passportError,
  onChangeType,
  onChangeIdCard,
  onChangePassport,
}: IdentityDocumentFieldProps) {
  return (
    // Section card wrapper.
    // การ์ดห่อ section
    <section className="rounded-3xl border border-border/60 bg-secondary/30 p-4 sm:p-5">
      {/* Section header row. */}
      {/* แถวหัว section */}
      <div className="mb-3 flex items-center gap-2">
        {/* Credit-card icon (also represents national ID). */}
        {/* ไอคอนบัตร (สื่อถึงบัตรปชช.) */}
        <CreditCard className="h-4 w-4 text-accent" />
        {/* Section title. */}
        {/* ชื่อ section */}
        <span className="text-sm font-semibold tracking-tight">
          Identity verification
        </span>
        {/* Right-aligned hint. */}
        {/* คำอธิบายชิดขวา */}
        <span className="ml-auto text-[11px] text-muted-foreground">
          For tourist identity verification
        </span>
      </div>

      {/* Radio-style options: ID card vs Passport. */}
      {/* ตัวเลือกแบบ radio: บัตรปชช. หรือ พาสปอร์ต */}
      <fieldset className="grid grid-cols-2 gap-2" aria-label="Document type">
        {/* Thai ID card option. */}
        {/* ตัวเลือก: บัตรปชช.ไทย */}
        <DocTypeOption
          icon={<CreditCard className="h-4 w-4" />}
          label="Thai ID Card"
          description="13-digit national ID"
          checked={idType === "id_card"}
          onSelect={() => onChangeType("id_card")}
        />
        {/* Passport option. */}
        {/* ตัวเลือก: พาสปอร์ต */}
        <DocTypeOption
          icon={<Globe2 className="h-4 w-4" />}
          label="Passport"
          description="International document"
          checked={idType === "passport"}
          onSelect={() => onChangeType("passport")}
        />
      </fieldset>

      {/* The actual document number input, depending on chosen type. */}
      {/* ช่องกรอกเลขเอกสาร ขึ้นกับชนิดที่เลือกข้างบน */}
      <div className="mt-3">
        {idType === "id_card" ? (
          /* Thai ID — 13 digits only, normalized as the user types. */
          /* บัตรปชช. — 13 หลัก กรองเฉพาะตัวเลขขณะพิมพ์ */
          <Field
            label="Thai National ID number"
            value={idCardNumber}
            onChange={(v) => onChangeIdCard(v.replace(/\D/g, "").slice(0, 13))}
            error={idCardError}
            inputMode="numeric"
            autoComplete="off"
            placeholder="1 2345 67890 12 3"
            full
            help="13 digits, no spaces or dashes — we'll handle formatting."
          />
        ) : (
          /* Passport — uppercase alphanumeric, 6–20 chars. */
          /* พาสปอร์ต — ตัวอักษรและตัวเลขเป็นพิมพ์ใหญ่ 6–20 ตัว */
          <Field
            label="Passport number"
            value={passportNumber}
            onChange={(v) =>
              onChangePassport(v.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 20))
            }
            error={passportError}
            autoComplete="off"
            placeholder="e.g. AA1234567"
            full
            help="6–20 letters & numbers (international format)."
          />
        )}
      </div>
    </section>
  );
}

/**
 * One picker option inside the ID/passport radio. Renders an `<input
 * type="radio">` visually replaced by a styled label.
 *
 * (TH) ตัวเลือกหนึ่งในชุด radio ID/passport — ซ่อน `<input type="radio">`
 * และวาดเป็น label ตามดีไซน์เอง
 */
function DocTypeOption({
  icon,
  label,
  description,
  checked,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    // Whole label is the click target.
    // ทั้ง label เป็น click target
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-all",
        checked
          ? "border-accent bg-accent/10 ring-2 ring-accent/30"
          : "border-border bg-background hover:border-accent/40"
      )}
    >
      {/* Visually-hidden radio input (still focusable & keyboard accessible). */}
      {/* radio input ที่ซ่อนด้วย sr-only แต่ focus/keyboard ยังใช้งานได้ */}
      <input
        type="radio"
        name="id-type"
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      {/* Icon tile on the left. */}
      {/* กล่อง icon ด้านซ้าย */}
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
          checked
            ? "bg-accent text-accent-foreground"
            : "bg-secondary text-muted-foreground"
        )}
      >
        {icon}
      </span>
      {/* Text block — label + description. */}
      {/* ส่วนข้อความ — label + description */}
      <span className="min-w-0">
        {/* Option title. */}
        {/* ชื่อตัวเลือก */}
        <span className="block text-sm font-medium">{label}</span>
        {/* Option subtitle. */}
        {/* คำอธิบายตัวเลือก */}
        <span className="block text-[11px] text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}

// ─── 6. Insurance selector ───────────────────────────────────────────────────

interface InsuranceSelectorProps {
  provider: string;
  custom: string;
  policy: string;
  contact: string;
  errors: ErrorMap;
  onProvider: (id: string) => void;
  onCustom: (v: string) => void;
  onPolicy: (v: string) => void;
  onContact: (v: string) => void;
}

/**
 * Insurance section body — preset radio chips and conditional inputs:
 *   - "custom" reveals a free-text provider field.
 *   - "none" hides the policy/contact fields entirely.
 *
 * (TH) เนื้อหา section ประกัน — ปุ่ม radio ของ preset และ field เพิ่มเติม
 * ตามที่เลือก: "custom" จะโชว์ช่องกรอกชื่อบริษัทเอง, "none" จะซ่อน field
 * เลขกรมธรรม์/ผู้ติดต่อทั้งหมด
 */
function InsuranceSelector({
  provider,
  custom,
  policy,
  contact,
  errors,
  onProvider,
  onCustom,
  onPolicy,
  onContact,
}: InsuranceSelectorProps) {
  // Convenience booleans derived from the chosen provider.
  // ตัวแปร boolean สำหรับอ่านง่าย คำนวณจาก provider ที่เลือก
  const skipped = provider === "none";
  const isCustom = provider === "custom";

  return (
    // Vertical container for the selector + its dependent fields.
    // ตัวห่อแนวตั้งของ selector + field ที่ขึ้นกับมัน
    <div className="space-y-3">
      {/* Provider chip grid — 2 cols on mobile, 3 cols on sm+. */}
      {/* ตาราง chip ของบริษัท — 2 คอลัมน์บนมือถือ, 3 คอลัมน์ตั้งแต่จอ sm */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {INSURANCE_PRESETS.map((p) => {
          // Is this chip the currently selected one?
          // chip นี้ถูกเลือกอยู่หรือไม่?
          const active = provider === p.id;
          return (
            // Whole label = click target wrapping a visually-hidden radio.
            // ทั้ง label = click target ห่อ radio ที่ถูกซ่อน
            <label
              key={p.id}
              className={cn(
                "cursor-pointer rounded-2xl border px-3 py-2.5 text-sm transition-all",
                active
                  ? "border-accent bg-accent/10 ring-2 ring-accent/30"
                  : "border-border bg-background hover:border-accent/40"
              )}
            >
              {/* Hidden radio input. */}
              {/* radio input ที่ซ่อน */}
              <input
                type="radio"
                name="insurance-provider"
                checked={active}
                onChange={() => onProvider(p.id)}
                className="sr-only"
              />
              {/* Chip content: label + optional checkmark. */}
              {/* เนื้อ chip: ชื่อ + เครื่องหมายถูก (ถ้าเลือก) */}
              <span className="flex items-center justify-between gap-2">
                {/* Provider label (truncated if long). */}
                {/* ชื่อบริษัท (ตัดท้ายถ้ายาว) */}
                <span className="truncate font-medium">{p.label}</span>
                {active && <Check className="h-3.5 w-3.5 text-accent" />}
              </span>
            </label>
          );
        })}
      </div>

      {/* Free-text provider field — only when "custom" is chosen. */}
      {/* ช่องกรอกชื่อบริษัทเอง — แสดงเฉพาะเมื่อเลือก "custom" */}
      {isCustom && (
        <Field
          label="Provider name"
          value={custom}
          onChange={onCustom}
          error={errors.insuranceProviderCustom}
          placeholder="e.g. Bangkok Bank Travel Care"
          full
        />
      )}

      {/* Policy + contact fields — hidden when the user skips insurance. */}
      {/* ช่องเลขกรมธรรม์ + ผู้ติดต่อ — ซ่อนเมื่อผู้ใช้ข้ามประกัน */}
      {!skipped && (
        <FieldGrid>
          {/* Policy number. */}
          {/* เลขกรมธรรม์ */}
          <Field
            label="Policy number"
            value={policy}
            onChange={onPolicy}
            error={errors.insurancePolicyNumber}
            placeholder="POL-XXXXXXX"
          />
          {/* Emergency contact (phone). */}
          {/* ผู้ติดต่อฉุกเฉิน (เบอร์โทร) */}
          <Field
            label="Emergency contact"
            value={contact}
            onChange={onContact}
            error={errors.insuranceEmergencyContact}
            placeholder="+66 87 000 0000"
          />
        </FieldGrid>
      )}

      {/* Skipped-state hint — explains the SOS card warning. */}
      {/* ข้อความเมื่อข้ามประกัน — บอกว่า SOS card จะมี warning */}
      {skipped && (
        <p className="text-[11px] text-muted-foreground">
          You can add insurance later from your profile. Your SOS card will show
          a &quot;no insurance on file&quot; warning.
        </p>
      )}
    </div>
  );
}

// ─── 7. Shared field primitives ──────────────────────────────────────────────

/**
 * 2-column grid wrapper for paired form fields. On mobile it collapses
 * to a single column. Used multiple times to avoid repeating the
 * `grid grid-cols-...` classes.
 *
 * (TH) ตัวห่อตาราง 2 คอลัมน์สำหรับฟอร์ม บนมือถือยุบเหลือคอลัมน์เดียว
 * เก็บ class นี้รวมไว้ที่เดียวเพื่อไม่ต้องเขียนซ้ำ
 */
function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    // The actual 2-col grid container.
    // กริด 2 คอลัมน์จริง ๆ
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
  );
}

/**
 * Props for the generic `<Field>` primitive — pairs a label with an
 * input and renders either a field-level error or a help text below.
 *
 * (TH) Props ของคอมโพเนนต์ `<Field>` รวม label + input และจัดการ error
 * หรือข้อความช่วยใต้ช่อง
 */
interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  /** When true, the field spans both columns of `FieldGrid`. */
  /** (TH) ถ้า true field จะกินสองคอลัมน์ใน `FieldGrid` */
  full?: boolean;
  /** Help text shown under the field when there's no error. */
  /** (TH) ข้อความช่วยใต้ field เมื่อไม่มี error */
  help?: string;
}

/**
 * Reusable label + input + help/error primitive. Uses `React.useId()`
 * so the label/input/error get unique IDs for `htmlFor` /
 * `aria-describedby` wiring.
 *
 * (TH) คอมโพเนนต์ label + input + help/error ที่ใช้ซ้ำได้ ใช้
 * `React.useId()` เพื่อสร้าง id เฉพาะสำหรับเชื่อม `htmlFor` /
 * `aria-describedby`
 */
function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  full,
  help,
}: FieldProps) {
  // Stable unique ID for this field instance.
  // id เฉพาะของ field นี้ (เสถียรข้าม render)
  const id = React.useId();
  const errId = `${id}-err`;
  return (
    // Field wrapper — optionally spans both columns.
    // ตัวห่อ field — กินสองคอลัมน์ถ้าตั้ง full
    <div className={full ? "sm:col-span-2" : ""}>
      {/* Field label, linked to the input via htmlFor. */}
      {/* label ที่เชื่อมกับ input ผ่าน htmlFor */}
      <Label htmlFor={id} className="mb-1.5 block">
        {label}
      </Label>
      {/* The actual input — receives all branching props. */}
      {/* input จริง — รับ props จาก parent ทั้งหมด */}
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={!!error}
        aria-describedby={error ? errId : undefined}
      />
      {error ? (
        /* Error row — destructive color + alert icon. */
        /* แถว error — สี destructive + ไอคอนเตือน */
        <div
          id={errId}
          className="mt-1 flex items-center gap-1 text-xs text-destructive"
        >
          {/* Alert icon */}
          {/* ไอคอนเตือน */}
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      ) : help ? (
        /* Help text — muted hint shown when there's no error. */
        /* ข้อความช่วย — สีจาง แสดงเมื่อไม่มี error */
        <div className="mt-1 text-[11px] text-muted-foreground">{help}</div>
      ) : null}
    </div>
  );
}
