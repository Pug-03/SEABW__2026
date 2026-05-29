/**
 * @file `/trip` — the trip hub page. Two layouts share the same data:
 *   - Desktop: sidebar (groups) + chat column with a scrollable bottom
 *     panel of planning widgets, plus an optional right-rail expense
 *     manager.
 *   - Mobile: bottom-tab nav (Chat / Plan / Map / More) backed by a
 *     `<MobileDrawer>` for the sidebar and expense sheet.
 *
 * Seeds the Phuket demo trip once on first visit (when the user has
 * zero groups), and bounces to `/` for unauthenticated visits.
 *
 * (TH) หน้า trip hub — มี 2 layout จากข้อมูลชุดเดียวกัน:
 *  - Desktop: sidebar (กลุ่ม) + คอลัมน์แชท + แผงวิดเจ็ตด้านล่าง + แผง
 *    expense ด้านขวา (optional)
 *  - Mobile: tab ล่าง (Chat / Plan / Map / More) ใช้ `<MobileDrawer>`
 *    สำหรับ sidebar และ expense
 *  เซ็ตกลุ่มทริปภูเก็ตเป็น demo ครั้งแรกที่เข้า (เมื่อยังไม่มีกลุ่ม) และ
 *  redirect ไป `/` ถ้ายังไม่ได้ login
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Ellipsis,
  LayoutDashboard,
  Map as MapIcon,
  Menu,
  MessageCircle,
  SquarePen,
  Wand2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { GroupSidebar } from "@/components/trip/group-sidebar";
import { ChatInterface } from "@/components/trip/chat-interface";
import { ExpenseManager } from "@/components/trip/expense-manager";
import { AIItinerary } from "@/components/features/ai-itinerary";
import { AIRecommendationsCard } from "@/components/features/ai-recommendations";
import { WeatherWidget } from "@/components/features/weather-widget";
import { GpsFuelCalculator } from "@/components/features/gps-fuel-calculator";
import { PackingChecklist } from "@/components/features/packing-checklist";
import { SosWidget } from "@/components/features/sos-widget";
import { PhotoWall } from "@/components/features/photo-wall";
import { TripMap } from "@/components/features/trip-map";
import { Splash } from "@/components/common/splash";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useVibeStore } from "@/lib/store";
import { useStoreHydrated } from "@/hooks/use-store-hydrated";
import { DESTINATIONS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// ─── Page ────────────────────────────────────────────────────────────────────

/**
 * Trip hub page component. Owns all UI state for both layouts —
 * sidebar collapse, mobile drawer/tab, expense panel visibility, and
 * the "create first trip" dialog.
 *
 * (TH) คอมโพเนนต์หน้า trip hub — เก็บ state UI ของทั้งสอง layout: บีบ
 * sidebar, drawer/tab มือถือ, การแสดง expense, และ dialog สร้างทริปแรก
 */
export default function TripPage() {
  const router = useRouter();
  const hydrated = useStoreHydrated();
  // Store accessors.
  // accessor ของ store
  const user = useVibeStore((s) => s.user);
  const groups = useVibeStore((s) => s.groups);
  const activeGroupId = useVibeStore((s) => s.activeGroupId);
  const createGroup = useVibeStore((s) => s.createGroup);
  const createDemoGroup = useVibeStore((s) => s.createDemoGroup);
  const demoSeeded = useVibeStore((s) => s.demoSeeded);
  const setGroupDestination = useVibeStore((s) => s.setGroupDestination);
  // Deferred geolocation — only fires when a widget calls `request`.
  // geolocation แบบ defer — เรียกเฉพาะเมื่อมี widget ขอ
  const geo = useGeolocation(false);

  // Local UI state.
  // state ของ UI
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileSidebar, setMobileSidebar] = React.useState(false);
  const [expenseOpen, setExpenseOpen] = React.useState(false);
  const [showFirstTrip, setShowFirstTrip] = React.useState(false);
  const [firstTripName, setFirstTripName] = React.useState("");
  const [mobileTab, setMobileTab] = React.useState<"chat" | "plan" | "map" | "more">("chat");

  // Redirect unauthenticated users to `/`.
  // ถ้ายังไม่ login ให้ redirect กลับ `/`
  React.useEffect(() => {
    if (hydrated && !user) router.replace("/");
  }, [hydrated, user, router]);

  // Seed the Phuket demo group on first visit (once per account).
  // เซ็ตกลุ่มภูเก็ต demo ตอนเข้าครั้งแรก (ครั้งเดียวต่อ account)
  React.useEffect(() => {
    if (hydrated && user && groups.length === 0 && !demoSeeded) {
      createDemoGroup(user);
    }
  }, [hydrated, user, groups.length, demoSeeded, createDemoGroup]);

  // Auto-close the mobile drawer if the viewport grows to desktop —
  // otherwise it'd be a frozen overlay nobody can dismiss.
  // ปิด drawer มือถืออัตโนมัติเมื่อขยายหน้าจอเป็น desktop — ไม่งั้น
  // overlay จะค้างอยู่กดไม่ได้
  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileSidebar(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Resolve the active group (or first available, or null).
  // หากลุ่ม active (หรือกลุ่มแรก หรือ null ถ้าไม่มีเลย)
  const active = groups.find((g) => g.id === activeGroupId) ?? groups[0] ?? null;

  // Resolve the focus destination — either the group's pin or the
  // first known destination.
  // หา destination ที่ focus — หมุดของกลุ่ม หรือ destination แรก
  const destination = React.useMemo(() => {
    if (active?.destinationId) {
      return (
        DESTINATIONS.find((d) => d.id === active.destinationId) ??
        DESTINATIONS[0]
      );
    }
    return DESTINATIONS[0];
  }, [active?.destinationId]);

  // Remaining budget = budget − sum(expenses), floored at 0.
  // งบที่เหลือ = งบ − รวมรายจ่าย, ขั้นต่ำ 0
  const remainingBudget = active
    ? Math.max(
        0,
        (active.budget ?? 0) -
          (active.expenses ?? []).reduce((s, e) => s + (e.amount ?? 0), 0)
      )
    : 0;

  // Hydration / auth gates.
  // เช็ค hydration / auth ก่อน render
  if (!hydrated) return <Splash />;
  if (!user) return null;

  // Combined origin: live geo wins, then stored user.location, else null.
  // origin รวม: live geo > user.location > null
  const origin = geo.coords ?? user.location ?? null;

  return (
    // Fullscreen flex row — sidebar on the left, content on the right.
    // flex row เต็มจอ — sidebar ซ้าย, content ขวา
    <main className="flex h-screen min-h-0 w-full overflow-hidden">
      {/* Desktop sidebar — visible from lg upward (tablets use the drawer). */}
      {/* sidebar เดสก์ท็อป — โผล่ตั้งแต่ lg ขึ้นไป (tablet ใช้ drawer แทน) */}
      <div className="hidden lg:flex">
        <GroupSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />
      </div>

      {/* Mobile drawer holding the sidebar. */}
      {/* drawer มือถือใส่ sidebar */}
      <MobileDrawer
        open={mobileSidebar}
        onClose={() => setMobileSidebar(false)}
        side="left"
        ariaLabel="Trip groups"
      >
        <GroupSidebar
          collapsed={false}
          onToggleCollapse={() => setMobileSidebar(false)}
        />
      </MobileDrawer>

      {/* Right-of-sidebar content section. */}
      {/* ส่วนเนื้อหาทางขวาของ sidebar */}
      <section className="flex min-h-0 flex-1 flex-col">
        {/* Mobile/tablet top bar — menu + group name + dashboard shortcut. */}
        {/* แถบบนของมือถือ/แท็บเล็ต — menu + ชื่อกลุ่ม + shortcut ไป dashboard */}
        <div className="flex items-center gap-2 border-b border-border/60 bg-card/60 px-3 py-2 backdrop-blur-xl lg:hidden">
          {/* Open drawer button. */}
          {/* ปุ่มเปิด drawer */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSidebar(true)}
            aria-label="Open trips"
          >
            <Menu className="h-4 w-4" />
          </Button>
          {/* Current group name or fallback. */}
          {/* ชื่อกลุ่มปัจจุบัน หรือ fallback */}
          <span className="truncate text-sm font-medium">
            {active ? active.name : "Trips"}
          </span>
          {/* Right cluster — dashboard escape. */}
          {/* กลุ่มขวา — กลับ dashboard */}
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard")}
              aria-label="Dashboard"
            >
              <LayoutDashboard className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {active ? (
          <>
            {/* Desktop layout — chat (main) + widget rail (right) + optional expense rail. */}
            {/* layout เดสก์ท็อป — chat (หลัก) + widget rail (ขวา) + expense rail (เลือก) */}
            {/*                                                                                */}
            {/* WHY THE EXTRA STRUCTURE: an earlier version stacked the chat above the widget */}
            {/* grid inside a single `flex-col overflow-y-auto` container. Because the widget */}
            {/* grid is content-sized and very tall, the chat's `flex-1` collapsed to 0 and   */}
            {/* the chat became invisible on desktop. Splitting them into two siblings with   */}
            {/* their own scroll contexts keeps the chat at full height.                      */}
            {/* (TH) โครงนี้แยก chat + widget เป็นสองคอลัมน์เพื่อให้ chat มีความสูงจริงเสมอ —   */}
            {/* การ stack ในคอลัมน์เดียวเดิมทำให้ chat ถูกบีบหายไปเพราะ widget สูงมาก          */}
            <div className="hidden min-h-0 flex-1 overflow-hidden lg:flex">
              {/* Main chat column — owns the full available height. */}
              {/* คอลัมน์ chat หลัก — กินความสูงทั้งหมดที่เหลือ */}
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <ChatInterface
                  group={active}
                  user={user}
                  expenseOpen={expenseOpen}
                  onToggleExpense={() => setExpenseOpen((v) => !v)}
                />
              </div>

              {/* Widget rail — scrolls independently. Hidden when expense is open  */}
              {/* unless we're on 2xl where everything fits at once.                */}
              {/* widget rail — scroll แยก, ซ่อนเมื่อ expense เปิด (ยกเว้น 2xl ที่กว้างพอ) */}
              <aside
                className={cn(
                  "h-full w-80 shrink-0 overflow-y-auto border-l border-border/60 bg-background/60 backdrop-blur-xl xl:w-[360px]",
                  expenseOpen ? "hidden 2xl:block" : "block"
                )}
                aria-label="Trip planning"
              >
                {/* Vertical stack of planning widgets. */}
                {/* แผงวิดเจ็ตวางเรียงแนวตั้ง */}
                <div className="space-y-4 p-4">
                  {/* AI itinerary. */}
                  {/* AI itinerary */}
                  <AIItinerary
                    initialDestinationId={destination.id}
                    members={(active.members ?? []).map((m) => ({ id: m.id, name: m.name }))}
                    budget={active.budget || remainingBudget}
                    preferences={user.preferences ?? []}
                  />
                  {/* Weather. */}
                  {/* weather */}
                  <WeatherWidget destination={destination} />
                  {/* SOS widget. */}
                  {/* widget SOS */}
                  <SosWidget user={user} />
                  {/* GPS fuel calculator. */}
                  {/* GPS fuel */}
                  <GpsFuelCalculator origin={origin} destination={destination} />
                  {/* Packing checklist. */}
                  {/* checklist สัมภาระ */}
                  <PackingChecklist preferences={user.preferences ?? []} />
                  {/* Destination picker. */}
                  {/* ตัวเลือก destination */}
                  <DestinationPicker activeId={destination.id} onPick={(id) => setGroupDestination(active.id, id)} />
                  {/* AI recommendations. */}
                  {/* AI recs */}
                  <AIRecommendationsCard destination={destination} preferences={user.preferences ?? []} remainingBudget={remainingBudget} origin={origin} />
                  {/* Map. */}
                  {/* แผนที่ */}
                  <TripMap origin={origin} destination={destination} />
                  {/* Photo wall. */}
                  {/* photo wall */}
                  <PhotoWall groupId={active.id} />
                </div>
              </aside>

              {expenseOpen && (
                /* Right expense rail (desktop). */
                /* expense rail ฝั่งขวา (เดสก์ท็อป) */
                <div className="h-full">
                  <ExpenseManager group={active} user={user} onClose={() => setExpenseOpen(false)} />
                </div>
              )}
            </div>

            {/* Mobile/tablet layout — tab content + bottom nav (used below lg). */}
            {/* layout มือถือ/แท็บเล็ต — tab content + nav ล่าง (ใช้ตั้งแต่ < lg ลงไป) */}
            <div className="flex min-h-0 flex-1 flex-col lg:hidden">
              {/* Relative container so absolute children have a known height. */}
              {/* container relative เพื่อให้ child absolute มีความสูงที่ชัดเจน */}
              <div className="relative min-h-0 flex-1">
                {mobileTab === "chat" && (
                  /* Chat tab. */
                  /* แท็บ Chat */
                  <div className="absolute inset-0 flex flex-col">
                    <ChatInterface
                      group={active}
                      user={user}
                      expenseOpen={expenseOpen}
                      onToggleExpense={() => setExpenseOpen((v) => !v)}
                    />
                  </div>
                )}
                {mobileTab === "plan" && (
                  /* Plan tab — itinerary + weather + GPS + destination picker. */
                  /* แท็บ Plan — itinerary + weather + GPS + destination picker */
                  <div className="absolute inset-0 overflow-x-hidden overflow-y-auto">
                    <div className="w-full space-y-3 p-3">
                      {/* AI itinerary. */}
                      {/* AI itinerary */}
                      <AIItinerary
                        initialDestinationId={destination.id}
                        members={(active.members ?? []).map((m) => ({ id: m.id, name: m.name }))}
                        budget={active.budget || remainingBudget}
                        preferences={user.preferences ?? []}
                      />
                      {/* Weather. */}
                      {/* weather */}
                      <WeatherWidget destination={destination} />
                      {/* GPS fuel calculator. */}
                      {/* GPS fuel */}
                      <GpsFuelCalculator origin={origin} destination={destination} />
                      {/* Destination picker. */}
                      {/* ตัวเลือก destination */}
                      <DestinationPicker activeId={destination.id} onPick={(id) => setGroupDestination(active.id, id)} />
                    </div>
                  </div>
                )}
                {mobileTab === "map" && (
                  /* Map tab. */
                  /* แท็บ Map */
                  <div className="absolute inset-0 overflow-y-auto">
                    <div className="p-3">
                      <TripMap origin={origin} destination={destination} />
                    </div>
                  </div>
                )}
                {mobileTab === "more" && (
                  /* More tab — packing/SOS/AI/photos stack. */
                  /* แท็บ More — packing/SOS/AI/photos */
                  <div className="absolute inset-0 overflow-x-hidden overflow-y-auto">
                    <div className="w-full space-y-3 p-3">
                      {/* Packing list. */}
                      {/* packing list */}
                      <PackingChecklist preferences={user.preferences ?? []} />
                      {/* SOS widget. */}
                      {/* widget SOS */}
                      <SosWidget user={user} />
                      {/* AI recommendations. */}
                      {/* AI recs */}
                      <AIRecommendationsCard destination={destination} preferences={user.preferences ?? []} remainingBudget={remainingBudget} origin={origin} />
                      {/* Photo wall. */}
                      {/* photo wall */}
                      <PhotoWall groupId={active.id} />
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom tab nav. */}
              {/* nav แท็บล่าง */}
              <nav className="flex shrink-0 border-t border-border/60 bg-card/80 backdrop-blur-xl">
                {(
                  [
                    { id: "chat", label: "Chat", icon: MessageCircle },
                    { id: "plan", label: "Plan", icon: Wand2 },
                    { id: "map", label: "Map", icon: MapIcon },
                    { id: "more", label: "More", icon: Ellipsis },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  /* One mobile tab button. */
                  /* ปุ่ม tab มือถือ 1 ปุ่ม */
                  <button
                    key={id}
                    onClick={() => setMobileTab(id)}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                      mobileTab === id
                        ? "text-accent"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {/* Tab icon (thicker stroke when active). */}
                    {/* icon ของ tab (เส้นหนาขึ้นเมื่อ active) */}
                    <Icon className={cn("h-5 w-5", mobileTab === id && "stroke-[2.5]")} />
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Mobile expense drawer (right side). */}
            {/* drawer expense มือถือ (ฝั่งขวา) */}
            <MobileDrawer
              open={expenseOpen && !!active}
              onClose={() => setExpenseOpen(false)}
              side="right"
              ariaLabel="Expense manager"
              mdHidden
            >
              {active && (
                <ExpenseManager group={active} user={user} onClose={() => setExpenseOpen(false)} />
              )}
            </MobileDrawer>
          </>
        ) : (
          /* Empty state when there are no groups. */
          /* state ว่างเมื่อยังไม่มีกลุ่ม */
          <EmptyState onCreate={() => setShowFirstTrip(true)} />
        )}
      </section>

      {/* First-trip naming dialog (only after the EmptyState CTA). */}
      {/* dialog ตั้งชื่อทริปแรก (โผล่หลังกด CTA ใน EmptyState) */}
      <Dialog open={showFirstTrip} onOpenChange={setShowFirstTrip}>
        {/* Dialog content. */}
        {/* content ของ dialog */}
        <DialogContent className="max-w-sm">
          {/* Header. */}
          {/* header */}
          <DialogHeader>
            <DialogTitle>Name your first trip</DialogTitle>
            <DialogDescription>
              You can invite friends after — by code or QR.
            </DialogDescription>
          </DialogHeader>
          {/* Name input. */}
          {/* input ชื่อ */}
          <Input
            value={firstTripName}
            onChange={(e) => setFirstTripName(e.target.value)}
            placeholder="e.g. Phuket Sunset Crew"
            autoFocus
          />
          {/* Create button — defaults to "My first trip" if blank. */}
          {/* ปุ่ม Create — fallback "My first trip" ถ้าเว้นว่าง */}
          <Button
            variant="accent"
            onClick={() => {
              const name = firstTripName.trim() || "My first trip";
              createGroup(name);
              setShowFirstTrip(false);
              setFirstTripName("");
            }}
          >
            Create trip
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}

// ─── MobileDrawer ────────────────────────────────────────────────────────────

/**
 * Props for `<MobileDrawer>`. `side` chooses left or right anchor;
 * `mdHidden` adds an additional `md:hidden` class for the expense
 * drawer (which is always desktop-rail in md+).
 *
 * (TH) Props ของ MobileDrawer — `side` บอกซ้าย/ขวา, `mdHidden` ใส่
 * คลาส md:hidden เพิ่ม (สำหรับ expense drawer ที่จอใหญ่ใช้ rail แทน)
 */
interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  side: "left" | "right";
  ariaLabel: string;
  mdHidden?: boolean;
  children: React.ReactNode;
}

/**
 * A lightweight slide-in drawer for mobile — backdrop click closes,
 * Esc closes, and the body's `overflow` is locked while open. Avoids
 * nesting Radix Dialog inside Radix Dialog (which has its own
 * focus-trap drama).
 *
 * (TH) Drawer slide-in สำหรับมือถือ — คลิก backdrop หรือ Esc เพื่อปิด
 * และล็อก body overflow ระหว่างเปิด เลี่ยงการ nest Radix Dialog ซ้อนกัน
 * (มีปัญหา focus-trap)
 */
function MobileDrawer({
  open,
  onClose,
  side,
  ariaLabel,
  mdHidden,
  children,
}: MobileDrawerProps) {
  // Stash the latest onClose in a ref so the effect only depends on
  // `open` (otherwise we'd reattach the keydown listener on every parent render).
  // เก็บ onClose ล่าสุดไว้ใน ref เพื่อให้ effect depend แค่ `open`
  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // While the drawer is open: wire up Esc-to-close and lock body scroll.
  // ระหว่างเปิด: เพิ่ม Esc-to-close และล็อก scroll ของ body
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    // Drawer root — fixed inset for fullscreen overlay; hidden on lg+
    // because lg uses the desktop sidebar/expense-rail instead.
    // drawer root — fixed inset ครอบทั้งจอ; ซ่อนตั้งแต่ lg ขึ้นไป
    // (เพราะ lg ใช้ sidebar/expense rail ของเดสก์ท็อปแทน)
    <div
      role="dialog"
      aria-label={ariaLabel}
      aria-hidden={!open}
      className={cn(
        "fixed inset-0 z-50 lg:hidden",
        mdHidden && "lg:hidden",
        !open && "pointer-events-none"
      )}
    >
      {/* Backdrop button — click anywhere outside the panel to close. */}
      {/* backdrop — กดข้างนอก panel เพื่อปิด */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      {/* Sliding panel — translate-x driven by `open` + `side`. */}
      {/* panel ที่เลื่อน — translate-x ตาม `open` + `side` */}
      <div
        className={cn(
          "absolute inset-y-0 flex w-[88vw] max-w-[320px] flex-col bg-card shadow-2xl transition-transform duration-300",
          side === "left"
            ? "left-0 rounded-r-3xl"
            : "right-0 rounded-l-3xl",
          open
            ? "translate-x-0"
            : side === "left"
            ? "-translate-x-full"
            : "translate-x-full"
        )}
      >
        {/* Close (X) button in the corner. */}
        {/* ปุ่ม X มุม */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close drawer"
          className="absolute right-2 top-2 z-10"
        >
          <X className="h-4 w-4" />
        </Button>
        {/* Scrollable content. */}
        {/* เนื้อหา scroll ได้ */}
        <div className="h-full overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ─── DestinationPicker ───────────────────────────────────────────────────────

/**
 * Horizontal strip of destination tiles. Selecting one writes through
 * to the active group's `destinationId`. Caps at the first 10
 * destinations for UI density.
 *
 * (TH) แถบเลื่อนแนวนอนของ tile destination — เลือกแล้วเขียนกลับเป็น
 * `destinationId` ของกลุ่ม active จำกัด 10 ตัวแรกเพื่อ UI ที่ไม่แน่นเกินไป
 */
function DestinationPicker({
  activeId,
  onPick,
}: {
  activeId: string;
  onPick: (id: string) => void;
}) {
  return (
    // Card wrapper.
    // ตัวห่อการ์ด
    <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-4 backdrop-blur-xl">
      {/* Header — map icon + title. */}
      {/* header — icon แผนที่ + title */}
      <div className="mb-3 flex items-center gap-2">
        <MapIcon className="h-4 w-4 text-accent" />
        <div className="text-sm font-semibold">Trip destination</div>
      </div>
      {/* Horizontal scroller. */}
      {/* scroller แนวนอน */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {DESTINATIONS.slice(0, 10).map((d) => {
          const isActive = d.id === activeId;
          return (
            // One destination tile button.
            // ปุ่ม tile หนึ่งใบ
            <button
              key={d.id}
              onClick={() => onPick(d.id)}
              className={cn(
                "shrink-0 overflow-hidden rounded-2xl border text-left transition-all",
                isActive
                  ? "border-accent shadow-md ring-2 ring-accent/40"
                  : "border-border hover:border-accent/40"
              )}
            >
              {/* Thumbnail. */}
              {/* thumbnail */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={d.imageUrl}
                alt={d.title}
                className="h-16 w-28 object-cover sm:h-20 sm:w-32"
              />
              {/* Caption — title + region. */}
              {/* caption — title + region */}
              <div className="px-2 py-1 text-xs">
                <div className="truncate font-medium">{d.title}</div>
                <div className="truncate text-[10px] text-muted-foreground">
                  {d.region}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────

/**
 * Empty state shown when the user is signed in but has no groups
 * (and the demo seed already ran with `demoSeeded: true`, so it
 * won't re-seed). Clicking the CTA opens the "name your trip" dialog.
 *
 * (TH) state ว่างเมื่อ user เข้าระบบแล้วแต่ไม่มีกลุ่ม (และ demo seeded
 * แล้วจะไม่ seed ใหม่) กด CTA เพื่อเปิด dialog ตั้งชื่อทริป
 */
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    // Centered placeholder area.
    // พื้นที่ placeholder กึ่งกลาง
    <div className="grid flex-1 place-items-center p-6">
      {/* Empty-state card. */}
      {/* การ์ด empty state */}
      <div className="max-w-md rounded-3xl border border-border/60 bg-card/70 p-8 text-center backdrop-blur-xl">
        {/* Pen icon — invites "create your first". */}
        {/* ไอคอนปากกา */}
        <SquarePen className="mx-auto h-8 w-8 text-accent" />
        {/* Headline. */}
        {/* หัวเรื่อง */}
        <h2 className="mt-3 text-xl font-semibold tracking-tight">
          No trips yet
        </h2>
        {/* Helper copy. */}
        {/* คำแนะนำ */}
        <p className="mt-1 text-sm text-muted-foreground">
          Spin up your first trip group to start chatting, splitting bills, and
          generating AI itineraries.
        </p>
        {/* CTA button. */}
        {/* ปุ่ม CTA */}
        <Button variant="accent" className="mt-4 w-fit mx-auto" onClick={onCreate}>
          {/* Rotated chevron as an "arrow-right" replacement. */}
          {/* chevron หมุน 180° แทนลูกศรขวา */}
          <ChevronLeft className="rotate-180 h-4 w-4" /> Create your first trip
        </Button>
      </div>
    </div>
  );
}
