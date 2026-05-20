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

// ─── Public API ──────────────────────────────────────────────────────────────

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

interface RegistrationFormProps {
  location: GeoCoords | null;
  locationStatus: string;
  onLocationRetry: () => void;
  onSubmit: (user: User) => void;
}

type ErrorMap = Partial<Record<keyof RegistrationValues, string>>;

const INSURANCE_PRESETS: { id: string; label: string }[] = [
  { id: "axa", label: "AXA Travel" },
  { id: "allianz", label: "Allianz" },
  { id: "chubb", label: "Chubb" },
  { id: "world_nomads", label: "World Nomads" },
  { id: "tip", label: "TIP Insurance" },
  { id: "custom", label: "Other / Custom" },
  { id: "none", label: "Skip for now" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function RegistrationForm({
  location,
  locationStatus,
  onLocationRetry,
  onSubmit,
}: RegistrationFormProps) {
  const [step, setStep] = React.useState<1 | 2>(1);
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<ErrorMap>({});

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

  const validateStep2 = (): ErrorMap => {
    const e: ErrorMap = {};
    if (!values.password) e.password = "Required";
    else if (values.password.length < 8)
      e.password = "At least 8 characters";
    if (values.confirmPassword !== values.password)
      e.confirmPassword = "Passwords do not match";

    if (values.insuranceProvider === "custom") {
      if (!values.insuranceProviderCustom.trim())
        e.insuranceProviderCustom = "Enter the provider name";
    }
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

  const goNext = () => {
    const found = validateStep1();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setStep(2);
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setStep(1);
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
    await new Promise((r) => setTimeout(r, 400));

    const identityDocument: IdentityDocument =
      values.idType === "id_card"
        ? {
            type: "id_card",
            number: values.idCardNumber.replace(/\D/g, ""),
          }
        : { type: "passport", number: values.passportNumber.trim() };

    let insurance: InsuranceDetails | undefined;
    if (
      values.insuranceProvider &&
      values.insuranceProvider !== "none"
    ) {
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
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <StepIndicator step={step} />

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

      <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        {step === 2 ? (
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
          <span aria-hidden className="hidden sm:block" />
        )}

        {step === 1 ? (
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
          <Button
            type="submit"
            variant="accent"
            size="lg"
            disabled={submitting}
            className="sm:w-auto"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
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

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 }) {
  const items = [
    { n: 1, label: "Personal info" },
    { n: 2, label: "Security & insurance" },
  ];
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-secondary/30 px-4 py-3 text-xs">
      <span className="font-medium uppercase tracking-wider text-muted-foreground">
        Step {step} of 2
      </span>
      <div className="flex items-center gap-2">
        {items.map((it, idx) => {
          const done = step > it.n;
          const active = step === it.n;
          return (
            <React.Fragment key={it.n}>
              <div className="flex items-center gap-2">
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

// ─── Step 1: Personal info ───────────────────────────────────────────────────

interface StepProps {
  values: RegistrationValues;
  errors: ErrorMap;
  set: <K extends keyof RegistrationValues>(
    key: K,
    val: RegistrationValues[K]
  ) => void;
}

interface Step1Props extends StepProps {
  location: GeoCoords | null;
  locationStatus: string;
  onLocationRetry: () => void;
}

function Step1({
  values,
  errors,
  set,
  location,
  locationStatus,
  onLocationRetry,
}: Step1Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-between">
        <AvatarUpload
          value={values.avatarDataUrl}
          onChange={(d) => set("avatarDataUrl", d)}
        />

        <div className="flex w-full max-w-xs items-start gap-2 rounded-2xl border border-border/60 bg-secondary/40 p-3 text-xs">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div className="flex-1">
            <div className="font-medium text-foreground">Location access</div>
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

      <FieldGrid>
        <Field
          label="First name"
          error={errors.firstName}
          value={values.firstName}
          onChange={(v) => set("firstName", v)}
          autoComplete="given-name"
        />
        <Field
          label="Last name"
          error={errors.lastName}
          value={values.lastName}
          onChange={(v) => set("lastName", v)}
          autoComplete="family-name"
        />
        <Field
          label="Nickname"
          error={errors.nickname}
          value={values.nickname}
          onChange={(v) => set("nickname", v)}
          autoComplete="nickname"
        />
        <Field
          label="Phone number"
          error={errors.phone}
          value={values.phone}
          onChange={(v) => set("phone", v)}
          type="tel"
          autoComplete="tel"
          placeholder="+66 81 234 5678"
        />
        <Field
          label="Email"
          error={errors.email}
          value={values.email}
          onChange={(v) => set("email", v)}
          type="email"
          autoComplete="email"
          full
        />
        <Field
          label="Home address"
          error={errors.homeAddress}
          value={values.homeAddress}
          onChange={(v) => set("homeAddress", v)}
          autoComplete="street-address"
          full
        />
      </FieldGrid>

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

// ─── Step 2: Security & insurance ────────────────────────────────────────────

function Step2({ values, errors, set }: StepProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border/60 bg-secondary/30 p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Lock className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold tracking-tight">
            Security
          </span>
        </div>
        <FieldGrid>
          <Field
            label="Password"
            error={errors.password}
            value={values.password}
            onChange={(v) => set("password", v)}
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
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

      <section className="rounded-3xl border border-border/60 bg-secondary/30 p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-semibold tracking-tight">
            Travel insurance
          </span>
          <span className="ml-auto text-[11px] text-muted-foreground">
            Required for SOS card
          </span>
        </div>
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

// ─── Identity document field ─────────────────────────────────────────────────

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
    <section className="rounded-3xl border border-border/60 bg-secondary/30 p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-accent" />
        <span className="text-sm font-semibold tracking-tight">
          Identity verification
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground">
          For tourist identity verification
        </span>
      </div>

      <fieldset className="grid grid-cols-2 gap-2" aria-label="Document type">
        <DocTypeOption
          icon={<CreditCard className="h-4 w-4" />}
          label="Thai ID Card"
          description="13-digit national ID"
          checked={idType === "id_card"}
          onSelect={() => onChangeType("id_card")}
        />
        <DocTypeOption
          icon={<Globe2 className="h-4 w-4" />}
          label="Passport"
          description="International document"
          checked={idType === "passport"}
          onSelect={() => onChangeType("passport")}
        />
      </fieldset>

      <div className="mt-3">
        {idType === "id_card" ? (
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
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-all",
        checked
          ? "border-accent bg-accent/10 ring-2 ring-accent/30"
          : "border-border bg-background hover:border-accent/40"
      )}
    >
      <input
        type="radio"
        name="id-type"
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
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
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-[11px] text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}

// ─── Insurance selector ──────────────────────────────────────────────────────

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
  const skipped = provider === "none";
  const isCustom = provider === "custom";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {INSURANCE_PRESETS.map((p) => {
          const active = provider === p.id;
          return (
            <label
              key={p.id}
              className={cn(
                "cursor-pointer rounded-2xl border px-3 py-2.5 text-sm transition-all",
                active
                  ? "border-accent bg-accent/10 ring-2 ring-accent/30"
                  : "border-border bg-background hover:border-accent/40"
              )}
            >
              <input
                type="radio"
                name="insurance-provider"
                checked={active}
                onChange={() => onProvider(p.id)}
                className="sr-only"
              />
              <span className="flex items-center justify-between gap-2">
                <span className="truncate font-medium">{p.label}</span>
                {active && <Check className="h-3.5 w-3.5 text-accent" />}
              </span>
            </label>
          );
        })}
      </div>

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

      {!skipped && (
        <FieldGrid>
          <Field
            label="Policy number"
            value={policy}
            onChange={onPolicy}
            error={errors.insurancePolicyNumber}
            placeholder="POL-XXXXXXX"
          />
          <Field
            label="Emergency contact"
            value={contact}
            onChange={onContact}
            error={errors.insuranceEmergencyContact}
            placeholder="+66 87 000 0000"
          />
        </FieldGrid>
      )}

      {skipped && (
        <p className="text-[11px] text-muted-foreground">
          You can add insurance later from your profile. Your SOS card will show
          a "no insurance on file" warning.
        </p>
      )}
    </div>
  );
}

// ─── Shared field primitives ─────────────────────────────────────────────────

function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  full?: boolean;
  help?: string;
}

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
  const id = React.useId();
  const errId = `${id}-err`;
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Label htmlFor={id} className="mb-1.5 block">
        {label}
      </Label>
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
        <div
          id={errId}
          className="mt-1 flex items-center gap-1 text-xs text-destructive"
        >
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      ) : help ? (
        <div className="mt-1 text-[11px] text-muted-foreground">{help}</div>
      ) : null}
    </div>
  );
}
