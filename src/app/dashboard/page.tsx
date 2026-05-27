"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Compass, MessageSquare, Sparkles, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { SmartSearch } from "@/components/dashboard/smart-search";
import { SearchResults } from "@/components/dashboard/search-results";
import { SeasonalCarousel } from "@/components/dashboard/seasonal-carousel";
import { ProfileModal } from "@/components/dashboard/profile-modal";
import { SettingsModal } from "@/components/dashboard/settings-modal";
import { WeatherWidget } from "@/components/features/weather-widget";
import { GpsFuelCalculator } from "@/components/features/gps-fuel-calculator";
import { AIRecommendationsCard } from "@/components/features/ai-recommendations";
import { BillSplitter } from "@/components/features/bill-splitter";
import { DestinationDetail } from "@/components/features/destination-detail";
import { AccommodationDetail } from "@/components/features/accommodation-detail";
import { AttractionsSection } from "@/components/features/attractions-section";
import { HotelBrowser } from "@/components/features/hotel-browser";
import { Splash } from "@/components/common/splash";
import { useVibeStore } from "@/lib/store";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useStoreHydrated } from "@/hooks/use-store-hydrated";
import { ACCOMMODATIONS, DESTINATIONS } from "@/lib/mock-data";

export default function DashboardPage() {
  const router = useRouter();
  const hydrated = useStoreHydrated();
  const user = useVibeStore((s) => s.user);
  const groups = useVibeStore((s) => s.groups);
  const updateUser = useVibeStore((s) => s.updateUser);
  const geo = useGeolocation(false);

  const [profileOpen, setProfileOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [pickedDestId, setPickedDestId] = React.useState<string>(
    DESTINATIONS[0].id
  );
  const [destDetailId, setDestDetailId] = React.useState<string | null>(null);
  const [accomDetailId, setAccomDetailId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const resultsRef = React.useRef<HTMLDivElement>(null);

  const pickedDest =
    DESTINATIONS.find((d) => d.id === pickedDestId) ?? DESTINATIONS[0];

  const handleSearchSubmit = (q: string) => {
    setSearchQuery(q);
    if (q) {
      // Defer to next frame so the results section is mounted before scrolling.
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  };

  const handleSearchClear = () => setSearchQuery("");

  const handlePickResult = (id: string) => {
    setPickedDestId(id);
    setSearchQuery("");
  };

  React.useEffect(() => {
    if (hydrated && !user) router.replace("/");
  }, [hydrated, user, router]);

  if (!hydrated) return <Splash />;
  if (!user) return null;

  const remainingBudget = groups.length
    ? Math.max(
        0,
        groups[0].budget -
          groups[0].expenses.reduce((s, e) => s + e.amount, 0)
      )
    : 0;

  return (
    <main className="min-h-screen pb-16">
      <TopNavbar
        user={user}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <section className="pt-8 text-center sm:pt-12">
          <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            <Sparkles className="h-3 w-3" /> Good {timeOfDay()}, {user.nickname}
          </div>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            Where do you want to <span className="text-accent">vibe</span> next?
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-balance text-sm text-muted-foreground sm:text-base">
            Search by destination or mood, then turn it into a trip with your
            crew in one tap.
          </p>
          <div className="mt-6">
            <SmartSearch
              initialQuery={searchQuery}
              onSubmit={handleSearchSubmit}
              onClear={handleSearchClear}
              onPickSuggestion={setPickedDestId}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Button variant="accent" onClick={() => router.push("/trip")}>
              <MessageSquare className="h-4 w-4" />
              {groups.length ? "Open trip hub" : "Start a trip"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="glass" onClick={geo.request}>
              <MapPin className="h-4 w-4" />
              {geo.coords
                ? `${geo.coords.lat.toFixed(2)}°, ${geo.coords.lng.toFixed(2)}°`
                : "Enable location"}
            </Button>
          </div>
        </section>

        {searchQuery.trim() ? (
          <section ref={resultsRef} className="mt-10">
            <SearchResults
              query={searchQuery}
              onPick={handlePickResult}
              onClear={handleSearchClear}
            />
          </section>
        ) : (
          <section className="mt-12">
            <SeasonalCarousel
              onSelect={setPickedDestId}
              onViewDetail={setDestDetailId}
            />
          </section>
        )}

        <section className="mt-10 rounded-3xl border border-border/60 bg-card/50 p-5 backdrop-blur-xl">
          <HotelBrowser />
        </section>

        <section className="mt-6 rounded-3xl border border-border/60 bg-card/50 p-5 backdrop-blur-xl">
          <AttractionsSection />
        </section>

        <section className="mt-6">
          <BillSplitter />
        </section>

        <section className="mt-6 grid items-start gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-3xl border border-border/60 bg-card/70 p-5 backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <Badge variant="ai" className="mb-1.5">
                    <Compass className="h-3 w-3" /> Focus
                  </Badge>
                  <h3 className="text-xl font-semibold tracking-tight">
                    {pickedDest.title}, {pickedDest.region}
                  </h3>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pickedDest.imageUrl}
                  alt=""
                  className="h-16 w-24 rounded-xl object-cover"
                />
              </div>

              <AIRecommendationsCard
                destination={pickedDest}
                preferences={user.preferences}
                remainingBudget={remainingBudget}
                origin={geo.coords ?? user.location ?? null}
                nickname={user.nickname}
                homeAddress={user.homeAddress}
              />
            </div>
          </div>

          <div className="space-y-4">
            <WeatherWidget destination={pickedDest} />
            <GpsFuelCalculator origin={geo.coords ?? user.location ?? null} destination={pickedDest} />
          </div>
        </section>
      </div>

      <ProfileModal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={user}
        onUpdate={updateUser}
      />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <DestinationDetail
        destination={DESTINATIONS.find((d) => d.id === destDetailId) ?? null}
        open={!!destDetailId}
        onOpenChange={(v) => !v && setDestDetailId(null)}
        onSelectStay={(id) => setAccomDetailId(id)}
      />
      <AccommodationDetail
        accommodation={ACCOMMODATIONS.find((a) => a.id === accomDetailId) ?? null}
        open={!!accomDetailId}
        onOpenChange={(v) => !v && setAccomDetailId(null)}
        origin={geo.coords}
      />
    </main>
  );
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 5) return "night";
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
