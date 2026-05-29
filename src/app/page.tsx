/**
 * @file Auth landing page (`/`). Three-step flow:
 *   1. `auth` — Hero + tabs for "Create account" vs "Sign in".
 *   2. `preferences` — Bento preference grid (skipped for sign-in users
 *      who already had preferences in the demo profile).
 *   3. `profile` — `<ProfileCreation>` welcome card with invite QR.
 *
 * (TH) หน้า auth (`/`) แบบ 3 ขั้นตอน:
 *   1. `auth` — Hero + tab สมัคร/เข้าสู่ระบบ
 *   2. `preferences` — bento เลือก preference
 *   3. `profile` — การ์ดต้อนรับพร้อม QR เชิญ
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { RegistrationForm } from "@/components/auth/registration-form";
import { LoginForm } from "@/components/auth/login-form";
import { PreferenceGrid } from "@/components/auth/preference-grid";
import { ProfileCreation } from "@/components/auth/profile-creation";
import { Splash } from "@/components/common/splash";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useStoreHydrated } from "@/hooks/use-store-hydrated";
import { useVibeStore } from "@/lib/store";
import type { User } from "@/lib/types";
import { generateId } from "@/lib/utils";

/** The three steps of the auth flow. */
/** (TH) ขั้นตอนของ flow auth */
type Step = "auth" | "preferences" | "profile";

/**
 * The auth page component. Orchestrates step transitions, syncs
 * geolocation into the user when available, and jumps straight to
 * the profile step if the user is already signed in (after hydration).
 *
 * (TH) คอมโพเนนต์หน้า auth — ดูแลการสลับ step, sync ตำแหน่งเข้าผู้ใช้,
 * และข้ามตรงไป step โปรไฟล์ถ้ามี user อยู่แล้วหลัง hydrate
 */
export default function AuthPage() {
  const router = useRouter();
  const hydrated = useStoreHydrated();
  // Eagerly request geolocation so the registration step can use it.
  // ขอ geolocation ตั้งแต่เริ่ม เพื่อให้ฟอร์มสมัครใช้ได้ทันที
  const geo = useGeolocation(true);
  // Store accessors.
  // accessor ของ store
  const user = useVibeStore((s) => s.user);
  const setUser = useVibeStore((s) => s.setUser);
  const updateUser = useVibeStore((s) => s.updateUser);
  const togglePreference = useVibeStore((s) => s.togglePreference);

  // Local flow state.
  // state ของ flow
  const [step, setStep] = React.useState<Step>("auth");
  const [mode, setMode] = React.useState<"register" | "login">("register");

  // Once hydration finishes and we see a user, jump to the profile step.
  // เมื่อ hydrate เสร็จและพบว่ามี user ให้ข้ามตรงไป step โปรไฟล์
  React.useEffect(() => {
    if (hydrated && user) setStep("profile");
  }, [hydrated, user]);

  // When geolocation arrives, attach it to the user if missing.
  // เมื่อได้ตำแหน่ง ให้ผูกเข้า user ถ้ายังไม่มี
  React.useEffect(() => {
    if (geo.coords && user && !user.location) {
      updateUser({ location: geo.coords });
    }
  }, [geo.coords, user, updateUser]);

  /**
   * Handle a completed registration. Persists the user (with geo if
   * any), then advances to the preferences picker.
   *
   * (TH) handle ตอนสมัครเสร็จ — บันทึก user (พร้อม geo ถ้ามี) แล้วไป
   * ขั้น preferences
   */
  const handleRegister = (u: User) => {
    setUser({ ...u, location: geo.coords ?? u.location });
    setStep("preferences");
  };

  /**
   * Handle a sign-in attempt. Since there's no real auth, we build a
   * demo user from whatever identifier was typed and jump straight to
   * profile (skipping preferences — demo already has some).
   *
   * (TH) handle การ sign-in — ไม่มี auth จริง สร้าง demo user จาก
   * identifier ที่กรอกแล้วข้ามไป step โปรไฟล์เลย
   */
  const handleLogin = (identifier: string) => {
    const demo: User = {
      id: generateId("usr"),
      firstName: "Demo",
      lastName: "Traveller",
      nickname: "demo",
      email: identifier.includes("@") ? identifier : "demo@vibetrip.app",
      phone: identifier.includes("@") ? "+66 81 234 5678" : identifier,
      homeAddress: "Bangkok, Thailand",
      preferences: ["beach", "foodie"],
      location: geo.coords ?? undefined,
      createdAt: new Date().toISOString(),
    };
    setUser(demo);
    setStep("profile");
  };

  // Build the shareable invite code/url for the welcome step.
  // ประกอบ invite code/url สำหรับ step โปรไฟล์
  const inviteCode = React.useMemo(
    () => (user ? user.id.slice(-6).toUpperCase() : "------"),
    [user]
  );
  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/trip?invite=${inviteCode}`
      : `https://vibetrip.app/trip?invite=${inviteCode}`;

  // Show a Splash until persisted state has loaded — prevents flash.
  // โชว์ Splash จนกว่า store จะ hydrate — กัน flash
  if (!hydrated) return <Splash />;

  return (
    // Main page column.
    // คอลัมน์หน้าหลัก
    <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col overflow-x-hidden px-4 py-6 sm:px-6 sm:py-10">
      {/* Top bar — logo + theme toggle. */}
      {/* แถบบน — โลโก้ + ปุ่มสลับธีม */}
      <header className="flex items-center justify-between">
        {/* Brand logo. */}
        {/* โลโก้แบรนด์ */}
        <Logo />
        {/* Right cluster — currently just the theme toggle. */}
        {/* กลุ่มขวา — ตอนนี้มีแค่ theme toggle */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {/* Centered content area. */}
      {/* ส่วนเนื้อหากึ่งกลาง */}
      <section className="flex flex-1 items-start justify-center py-6 sm:items-center sm:py-10">
        {/* Width container. */}
        {/* container กำหนดความกว้าง */}
        <div className="w-full">
          {step === "auth" && (
            /* Step 1 — Hero + tabs for Register/Login. */
            /* ขั้น 1 — Hero + tab สมัคร/เข้าสู่ระบบ */
            <div className="mx-auto w-full max-w-3xl space-y-8">
              {/* Hero header. */}
              {/* hero header */}
              <HeroIntro />
              {/* Tabs card. */}
              {/* การ์ดแท็บ */}
              <div className="rounded-[28px] border border-border/60 bg-card/70 p-6 shadow-xl backdrop-blur-2xl sm:p-8">
                {/* Tabs root. */}
                {/* root แท็บ */}
                <Tabs
                  value={mode}
                  onValueChange={(v) => setMode(v as "register" | "login")}
                >
                  {/* Tab triggers. */}
                  {/* trigger แท็บ */}
                  <TabsList className="mx-auto w-full max-w-sm">
                    <TabsTrigger value="register" className="flex-1">
                      Create account
                    </TabsTrigger>
                    <TabsTrigger value="login" className="flex-1">
                      Sign in
                    </TabsTrigger>
                  </TabsList>
                  {/* Register tab body. */}
                  {/* เนื้อหาแท็บสมัคร */}
                  <TabsContent value="register">
                    <RegistrationForm
                      location={geo.coords}
                      locationStatus={geo.status}
                      onLocationRetry={geo.request}
                      onSubmit={handleRegister}
                    />
                  </TabsContent>
                  {/* Login tab body. */}
                  {/* เนื้อหาแท็บเข้าสู่ระบบ */}
                  <TabsContent value="login">
                    <LoginForm onSubmit={handleLogin} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}

          {step === "preferences" && user && (
            /* Step 2 — Preference picker card. */
            /* ขั้น 2 — การ์ดเลือก preference */
            <div className="mx-auto w-full max-w-4xl space-y-6 rounded-[28px] border border-border/60 bg-card/70 p-4 shadow-xl backdrop-blur-2xl sm:p-8">
              {/* Heading + helper copy. */}
              {/* หัวข้อ + คำอธิบาย */}
              <div className="text-center">
                {/* Heading. */}
                {/* หัวข้อ */}
                <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                  How do you vibe?
                </h2>
                {/* Helper copy. */}
                {/* คำอธิบาย */}
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick the kinds of trips you love — multi-select. {"We'll"} use
                  these to power AI recommendations.
                </p>
              </div>

              {/* The bento preference grid. */}
              {/* bento preference grid */}
              <PreferenceGrid
                selected={user.preferences}
                onToggle={togglePreference}
              />

              {/* Footer — selection counter + Continue button. */}
              {/* footer — ตัวนับเลือก + ปุ่ม Continue */}
              <div className="flex flex-col-reverse items-stretch justify-between gap-3 pt-2 sm:flex-row sm:items-center">
                {/* "Selected: N / 8" caption. */}
                {/* "Selected: N / 8" */}
                <p className="text-xs text-muted-foreground">
                  Selected:{" "}
                  <span className="font-medium text-foreground">
                    {user.preferences.length}
                  </span>{" "}
                  / 8
                </p>
                {/* Continue button (disabled until at least one chosen). */}
                {/* ปุ่ม Continue (disable จนกว่าจะเลือกอย่างน้อย 1) */}
                <Button
                  variant="accent"
                  size="lg"
                  onClick={() => setStep("profile")}
                  disabled={user.preferences.length === 0}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === "profile" && user && (
            /* Step 3 — Welcome card (delegated to `<ProfileCreation>`). */
            /* ขั้น 3 — การ์ดต้อนรับ (ใช้ `<ProfileCreation>`) */
            <div className="mx-auto w-full max-w-3xl rounded-[28px] border border-border/60 bg-card/70 p-3 shadow-xl backdrop-blur-2xl sm:p-6 md:p-10">
              <ProfileCreation
                user={user}
                inviteUrl={inviteUrl}
                inviteCode={inviteCode}
                onContinue={() => router.push("/dashboard")}
              />
            </div>
          )}
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

/**
 * Hero block shown above the auth tabs. Pure presentational — no state.
 *
 * (TH) ส่วน hero ที่อยู่เหนือแท็บ auth — เป็น presentational ล้วน
 */
function HeroIntro() {
  return (
    // Center-aligned hero container.
    // container hero จัดกึ่งกลาง
    <div className="text-center">
      {/* "AI-powered" badge. */}
      {/* badge "AI-powered" */}
      <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
        {/* Sparkle icon. */}
        {/* ไอคอนประกาย */}
        <Sparkles className="h-3 w-3" /> AI-powered group travel
      </div>
      {/* Big headline. */}
      {/* หัวเรื่องใหญ่ */}
      <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
        Plan trips that <span className="text-accent">actually happen</span>.
      </h1>
      {/* Sub-headline. */}
      {/* ข้อความรอง */}
      <p className="mx-auto mt-3 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
        VibeTrip aligns your crew on dates, splits the bill, and books stays
        that match your vibe — all in one calm, minimal app.
      </p>
      {/* Feature bullets. */}
      {/* รายการฟีเจอร์ */}
      <ul className="mx-auto mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
        <li>· Geolocation-aware suggestions</li>
        <li>· Bento preferences → AI recommendations</li>
        <li>· One-scan QR bill splits</li>
      </ul>
    </div>
  );
}
