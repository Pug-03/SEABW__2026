"use client";

import * as React from "react";
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AvatarUpload } from "@/components/common/avatar-upload";
import type { GeoCoords, InsuranceDetails, User } from "@/lib/types";
import { generateId } from "@/lib/utils";

export interface RegistrationValues {
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  phone: string;
  homeAddress: string;
  password: string;
  confirmPassword: string;
  avatarDataUrl?: string;
  insurance: InsuranceDetails;
}

interface RegistrationFormProps {
  location: GeoCoords | null;
  locationStatus: string;
  onLocationRetry: () => void;
  onSubmit: (user: User) => void;
}

type Errors = Partial<Record<keyof RegistrationValues, string>> & {
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceEmergencyContact?: string;
};

export function RegistrationForm({
  location,
  locationStatus,
  onLocationRetry,
  onSubmit,
}: RegistrationFormProps) {
  const [values, setValues] = React.useState<RegistrationValues>({
    firstName: "",
    lastName: "",
    nickname: "",
    email: "",
    phone: "",
    homeAddress: "",
    password: "",
    confirmPassword: "",
    avatarDataUrl: undefined,
    insurance: { provider: "", policyNumber: "", emergencyContact: "" },
  });
  const [errors, setErrors] = React.useState<Errors>({});
  const [submitting, setSubmitting] = React.useState(false);

  const set = <K extends keyof RegistrationValues>(
    key: K,
    val: RegistrationValues[K]
  ) => setValues((v) => ({ ...v, [key]: val }));

  const validate = (): Errors => {
    const e: Errors = {};
    if (!values.firstName.trim()) e.firstName = "Required";
    if (!values.lastName.trim()) e.lastName = "Required";
    if (!values.nickname.trim()) e.nickname = "Required";
    if (!values.email.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      e.email = "Invalid email";
    if (!values.phone.trim()) e.phone = "Required";
    else if (!/^[0-9+\-\s()]{7,}$/.test(values.phone))
      e.phone = "Invalid phone number";
    if (!values.homeAddress.trim()) e.homeAddress = "Required";
    if (!values.password) e.password = "Required";
    else if (values.password.length < 8) e.password = "At least 8 characters";
    if (values.confirmPassword !== values.password)
      e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));

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
      insurance: values.insurance.provider
        ? values.insurance
        : undefined,
      createdAt: new Date().toISOString(),
    };
    onSubmit(user);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
        <Field
          label="Password"
          error={errors.password}
          value={values.password}
          onChange={(v) => set("password", v)}
          type="password"
          autoComplete="new-password"
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

      <div className="rounded-3xl border border-border/60 bg-secondary/30 p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-semibold tracking-tight">
            Travel insurance (optional but recommended)
          </span>
        </div>
        <FieldGrid>
          <Field
            label="Insurance provider"
            value={values.insurance.provider}
            onChange={(v) =>
              set("insurance", { ...values.insurance, provider: v })
            }
            placeholder="e.g. AXA Travel"
          />
          <Field
            label="Policy number"
            value={values.insurance.policyNumber}
            onChange={(v) =>
              set("insurance", { ...values.insurance, policyNumber: v })
            }
            placeholder="POL-XXXXXXX"
          />
          <Field
            label="Emergency contact"
            value={values.insurance.emergencyContact}
            onChange={(v) =>
              set("insurance", { ...values.insurance, emergencyContact: v })
            }
            placeholder="+66 87 000 0000"
            full
          />
        </FieldGrid>
      </div>

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
            Continue to preferences <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}

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
  full?: boolean;
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  autoComplete,
  full,
}: FieldProps) {
  const id = React.useId();
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
        aria-invalid={!!error}
      />
      {error && (
        <div className="mt-1 flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  );
}
