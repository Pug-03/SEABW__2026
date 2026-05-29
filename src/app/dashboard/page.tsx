/**
 * @file `/dashboard` — the main "home" page after sign-in. Wires up
 * the top navbar, smart search + results, seasonal carousel, hotel
 * browser, attractions browser, bill splitter, AI recommendations,
 * weather widget, GPS fuel calculator, and the profile/settings/
 * destination/accommodation modals.
 *
 * Redirects to `/` when the user is not signed in (after hydration).
 *
 * (TH) หน้า dashboard หลังเข้าระบบ — รวม TopNavbar, ช่องค้นหา + ผลลัพธ์,
 * carousel, browser โรงแรม/สถานที่, bill splitter, AI recommend, weather,
 * GPS fuel calculator, และ modal โปรไฟล์/settings/destination/accommodation
 * จะ redirect ไป `/` ถ้าผู้ใช้ยังไม่ได้เข้าระบบ
 */

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

/**
 * The dashboard page. Owns several pieces of UI state: which modals
 * are open, which destination is "focused" for AI recs/weather/GPS,
 * and the search query.
 *
 * (TH) หน้า dashboard — เก็บ state UI หลายตัว: modal ไหนเปิดอยู่,
 * destination ที่ "focus" สำหรับ AI/weather/GPS, และคำค้นหา
 */
export default function DashboardPage() {
  const router = useRouter();
  const hydrated = useStoreHydrated();
  // Store accessors.
  // accessor ของ store
  const user = useVibeStore((s) => s.user);
  const groups = useVibeStore((s) => s.groups);
  const updateUser = useVibeStore((s) => s.updateUser);
  // Defer geolocation request — only fire when the user clicks "Enable location".
  // ยังไม่ขอ geolocation จนกว่าผู้ใช้กดปุ่ม
  const geo = useGeolocation(false);

  // Modal open/close state.
  // state เปิด/ปิด modal
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  // Currently "focused" destination ID (drives weather/GPS/AI sections).
  // destination ที่กำลัง "focus" — ขับ widget weather/GPS/AI
  const [pickedDestId, setPickedDestId] = React.useState<string>(
    DESTINATIONS[0].id
  );
  // Destination + accommodation detail modal IDs.
  // id ของ modal รายละเอียด
  const [destDetailId, setDestDetailId] = React.useState<string | null>(null);
  const [accomDetailId, setAccomDetailId] = React.useState<string | null>(null);
  // Submitted search query (separate from the input's draft).
  // คำค้นหาที่ submit แล้ว (แยกจาก draft ของ input)
  const [searchQuery, setSearchQuery] = React.useState("");
  // Ref to the results section for auto-scroll on submit.
  // ref ของ section ผลลัพธ์เพื่อ scroll ลงเมื่อ submit
  const resultsRef = React.useRef<HTMLDivElement>(null);

  // Resolve the picked destination object (with safe fallback).
  // ดึง destination object ที่เลือก (พร้อม fallback)
  const pickedDest =
    DESTINATIONS.find((d) => d.id === pickedDestId) ?? DESTINATIONS[0];

  /**
   * On search submit, store the query and smooth-scroll the results
   * into view on the next frame (after they mount).
   *
   * (TH) ตอน submit ค้นหา — เก็บคำค้นและ scroll ไปยังผลลัพธ์ใน frame ถัดไป
   */
  const handleSearchSubmit = (q: string) => {
    setSearchQuery(q);
    if (q) {
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  };

  const handleSearchClear = () => setSearchQuery("");

  /**
   * Picking a result both focuses that destination and clears the
   * search so the rest of the dashboard re-appears.
   *
   * (TH) เลือกผลลัพธ์ — focus destination และล้างคำค้นเพื่อให้ส่วนอื่น
   * ของ dashboard กลับมาแสดง
   */
  const handlePickResult = (id: string) => {
    setPickedDestId(id);
    setSearchQuery("");
  };

  // Redirect to `/` when hydration confirms there's no user.
  // redirect ไป `/` เมื่อ hydrate เสร็จและไม่มี user
  React.useEffect(() => {
    if (hydrated && !user) router.replace("/");
  }, [hydrated, user, router]);

  // Loading + early-return guards.
  // guard ก่อน render หลัก
  if (!hydrated) return <Splash />;
  if (!user) return null;

  // Compute remaining budget of the first group (used by AI recs).
  // คำนวณงบที่เหลือของกลุ่มแรก (ใช้ใน AI recs)
  const remainingBudget = groups.length
    ? Math.max(
        0,
        groups[0].budget -
          groups[0].expenses.reduce((s, e) => s + e.amount, 0)
      )
    : 0;

  return (
    // Main page wrapper with bottom padding for safe-area on mobile.
    // wrapper หน้าหลัก เผื่อ padding ล่างสำหรับ safe-area บนมือถือ
    <main className="min-h-screen pb-16">
      {/* Top navbar (sticky). */}
      {/* navbar บน (sticky) */}
      <TopNavbar
        user={user}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Content max-width container. */}
      {/* container จำกัด max-width ของเนื้อหา */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Hero section — greeting + headline + search + quick actions. */}
        {/* section hero — ทักทาย + headline + ค้นหา + quick actions */}
        <section className="pt-8 text-center sm:pt-12">
          {/* "Good <timeOfDay>, <nickname>" pill. */}
          {/* ป้าย "Good <timeOfDay>, <nickname>" */}
          <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            <Sparkles className="h-3 w-3" /> Good {timeOfDay()}, {user.nickname}
          </div>
          {/* Big headline. */}
          {/* headline ใหญ่ */}
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            Where do you want to <span className="text-accent">vibe</span> next?
          </h1>
          {/* Sub-headline. */}
          {/* คำอธิบายรอง */}
          <p className="mx-auto mt-2 max-w-xl text-balance text-sm text-muted-foreground sm:text-base">
            Search by destination or mood, then turn it into a trip with your
            crew in one tap.
          </p>
          {/* Smart search bar. */}
          {/* แถบค้นหา */}
          <div className="mt-6">
            <SmartSearch
              initialQuery={searchQuery}
              onSubmit={handleSearchSubmit}
              onClear={handleSearchClear}
              onPickSuggestion={setPickedDestId}
            />
          </div>

          {/* Quick-action row — open trip + enable location. */}
          {/* แถว quick action — เปิด trip + ขอ location */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {/* Open/start trip button. */}
            {/* ปุ่มเปิด/เริ่ม trip */}
            <Button variant="accent" onClick={() => router.push("/trip")}>
              <MessageSquare className="h-4 w-4" />
              {groups.length ? "Open trip hub" : "Start a trip"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            {/* Location button — shows coords once granted. */}
            {/* ปุ่ม location — โชว์พิกัดเมื่อได้รับสิทธิ์ */}
            <Button variant="glass" onClick={geo.request}>
              <MapPin className="h-4 w-4" />
              {geo.coords
                ? `${geo.coords.lat.toFixed(2)}°, ${geo.coords.lng.toFixed(2)}°`
                : "Enable location"}
            </Button>
          </div>
        </section>

        {searchQuery.trim() ? (
          /* Search results section (only when a query is active). */
          /* section ผลค้นหา (เฉพาะเมื่อมี query) */
          <section ref={resultsRef} className="mt-10">
            <SearchResults
              query={searchQuery}
              onPick={handlePickResult}
              onClear={handleSearchClear}
            />
          </section>
        ) : (
          /* Carousel section (when there is no active query). */
          /* section carousel (เมื่อไม่มี query) */
          <section className="mt-12">
            <SeasonalCarousel
              onSelect={setPickedDestId}
              onViewDetail={setDestDetailId}
            />
          </section>
        )}

        {/* Hotel browser section. */}
        {/* section browser โรงแรม */}
        <section className="mt-10 rounded-3xl border border-border/60 bg-card/50 p-5 backdrop-blur-xl">
          <HotelBrowser />
        </section>

        {/* Attractions browser section. */}
        {/* section browser สถานที่ท่องเที่ยว */}
        <section className="mt-6 rounded-3xl border border-border/60 bg-card/50 p-5 backdrop-blur-xl">
          <AttractionsSection />
        </section>

        {/* Bill splitter section. */}
        {/* section bill splitter */}
        <section className="mt-6">
          <BillSplitter />
        </section>

        {/* Focus + AI recs + weather/GPS row. */}
        {/* แถว focus + AI recs + weather/GPS */}
        <section className="mt-6 grid items-start gap-4 lg:grid-cols-3">
          {/* Left 2/3 column — focus card with AI recs. */}
          {/* คอลัมน์ซ้าย 2/3 — การ์ด focus พร้อม AI recs */}
          <div className="space-y-4 lg:col-span-2">
            {/* Focus destination card. */}
            {/* การ์ด focus destination */}
            <div className="rounded-3xl border border-border/60 bg-card/70 p-5 backdrop-blur-xl">
              {/* Card header — text cluster + thumbnail. */}
              {/* header การ์ด — กลุ่มข้อความ + thumbnail */}
              <div className="mb-3 flex items-center justify-between">
                {/* Text cluster. */}
                {/* กลุ่มข้อความ */}
                <div>
                  {/* "Focus" badge. */}
                  {/* badge "Focus" */}
                  <Badge variant="ai" className="mb-1.5">
                    <Compass className="h-3 w-3" /> Focus
                  </Badge>
                  {/* Destination heading. */}
                  {/* หัวข้อ destination */}
                  <h3 className="text-xl font-semibold tracking-tight">
                    {pickedDest.title}, {pickedDest.region}
                  </h3>
                </div>
                {/* Thumbnail. */}
                {/* รูป thumbnail */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pickedDest.imageUrl}
                  alt=""
                  className="h-16 w-24 rounded-xl object-cover"
                />
              </div>

              {/* AI recommendations for the picked destination. */}
              {/* AI recommendations ของ destination นี้ */}
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

          {/* Right 1/3 column — weather + GPS fuel. */}
          {/* คอลัมน์ขวา 1/3 — weather + GPS fuel */}
          <div className="space-y-4">
            {/* Weather widget for the focus destination. */}
            {/* widget weather */}
            <WeatherWidget destination={pickedDest} />
            {/* GPS fuel calculator. */}
            {/* เครื่องคิดเลขค่าน้ำมัน */}
            <GpsFuelCalculator origin={geo.coords ?? user.location ?? null} destination={pickedDest} />
          </div>
        </section>
      </div>

      {/* Modal: profile. */}
      {/* modal: โปรไฟล์ */}
      <ProfileModal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={user}
        onUpdate={updateUser}
      />
      {/* Modal: settings. */}
      {/* modal: settings */}
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      {/* Modal: destination detail. */}
      {/* modal: รายละเอียด destination */}
      <DestinationDetail
        destination={DESTINATIONS.find((d) => d.id === destDetailId) ?? null}
        open={!!destDetailId}
        onOpenChange={(v) => !v && setDestDetailId(null)}
        onSelectStay={(id) => setAccomDetailId(id)}
      />
      {/* Modal: accommodation detail. */}
      {/* modal: รายละเอียดที่พัก */}
      <AccommodationDetail
        accommodation={ACCOMMODATIONS.find((a) => a.id === accomDetailId) ?? null}
        open={!!accomDetailId}
        onOpenChange={(v) => !v && setAccomDetailId(null)}
        origin={geo.coords}
      />
    </main>
  );
}

/**
 * Return a coarse time-of-day label ("morning" / "afternoon" /
 * "evening" / "night") used in the greeting line.
 *
 * (TH) คืน label ช่วงเวลาแบบหยาบ ๆ ("morning" / "afternoon" / "evening"
 * / "night") ใช้ในประโยคทักทาย
 */
function timeOfDay() {
  const h = new Date().getHours();
  if (h < 5) return "night";
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
