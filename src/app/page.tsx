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
import { useGeolocation } from "@/hooks/use-geolocation";
import { useVibeStore } from "@/lib/store";
import type { User } from "@/lib/types";
import { generateId } from "@/lib/utils";

type Step = "auth" | "preferences" | "profile";

export default function AuthPage() {
  const router = useRouter();
  const geo = useGeolocation(true);
  const user = useVibeStore((s) => s.user);
  const setUser = useVibeStore((s) => s.setUser);
  const updateUser = useVibeStore((s) => s.updateUser);
  const togglePreference = useVibeStore((s) => s.togglePreference);

  const [step, setStep] = React.useState<Step>(user ? "profile" : "auth");
  const [mode, setMode] = React.useState<"register" | "login">("register");

  React.useEffect(() => {
    if (geo.coords && user && !user.location) {
      updateUser({ location: geo.coords });
    }
  }, [geo.coords, user, updateUser]);

  const handleRegister = (u: User) => {
    setUser({ ...u, location: geo.coords ?? u.location });
    setStep("preferences");
  };

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

  const inviteCode = React.useMemo(
    () => (user ? user.id.slice(-6).toUpperCase() : "------"),
    [user]
  );
  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/trip?invite=${inviteCode}`
      : `https://vibetrip.app/trip?invite=${inviteCode}`;

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      <section className="flex flex-1 items-start justify-center py-6 sm:items-center sm:py-10">
        <div className="w-full">
          {step === "auth" && (
            <div className="mx-auto w-full max-w-3xl space-y-8">
              <HeroIntro />
              <div className="rounded-[28px] border border-border/60 bg-card/70 p-6 shadow-xl backdrop-blur-2xl sm:p-8">
                <Tabs
                  value={mode}
                  onValueChange={(v) => setMode(v as "register" | "login")}
                >
                  <TabsList className="mx-auto w-full max-w-sm">
                    <TabsTrigger value="register" className="flex-1">
                      Create account
                    </TabsTrigger>
                    <TabsTrigger value="login" className="flex-1">
                      Sign in
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="register">
                    <RegistrationForm
                      location={geo.coords}
                      locationStatus={geo.status}
                      onLocationRetry={geo.request}
                      onSubmit={handleRegister}
                    />
                  </TabsContent>
                  <TabsContent value="login">
                    <LoginForm onSubmit={handleLogin} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}

          {step === "preferences" && user && (
            <div className="mx-auto w-full max-w-4xl space-y-6 rounded-[28px] border border-border/60 bg-card/70 p-6 shadow-xl backdrop-blur-2xl sm:p-10">
              <div className="text-center">
                <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                  How do you vibe?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick the kinds of trips you love — multi-select. {"We'll"} use
                  these to power AI recommendations.
                </p>
              </div>

              <PreferenceGrid
                selected={user.preferences}
                onToggle={togglePreference}
              />

              <div className="flex flex-col-reverse items-stretch justify-between gap-3 pt-2 sm:flex-row sm:items-center">
                <p className="text-xs text-muted-foreground">
                  Selected:{" "}
                  <span className="font-medium text-foreground">
                    {user.preferences.length}
                  </span>{" "}
                  / 8
                </p>
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
            <div className="mx-auto w-full max-w-3xl rounded-[28px] border border-border/60 bg-card/70 p-6 shadow-xl backdrop-blur-2xl sm:p-10">
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

      <footer className="pt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} VibeTrip · Plan, split, vibe.
      </footer>
    </main>
  );
}

function HeroIntro() {
  return (
    <div className="text-center">
      <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
        <Sparkles className="h-3 w-3" /> AI-powered group travel
      </div>
      <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
        Plan trips that <span className="text-accent">actually happen</span>.
      </h1>
      <p className="mx-auto mt-3 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
        VibeTrip aligns your crew on dates, splits the bill, and books stays
        that match your vibe — all in one calm, minimal app.
      </p>
      <ul className="mx-auto mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
        <li>· Geolocation-aware suggestions</li>
        <li>· Bento preferences → AI recommendations</li>
        <li>· One-scan QR bill splits</li>
      </ul>
    </div>
  );
}
