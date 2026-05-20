"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  LayoutDashboard,
  Map as MapIcon,
  Menu,
  SquarePen,
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

export default function TripPage() {
  const router = useRouter();
  const hydrated = useStoreHydrated();
  const user = useVibeStore((s) => s.user);
  const groups = useVibeStore((s) => s.groups);
  const activeGroupId = useVibeStore((s) => s.activeGroupId);
  const createGroup = useVibeStore((s) => s.createGroup);
  const createDemoGroup = useVibeStore((s) => s.createDemoGroup);
  const demoSeeded = useVibeStore((s) => s.demoSeeded);
  const setGroupDestination = useVibeStore((s) => s.setGroupDestination);
  const geo = useGeolocation(false);

  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileSidebar, setMobileSidebar] = React.useState(false);
  const [expenseOpen, setExpenseOpen] = React.useState(false);
  const [showFirstTrip, setShowFirstTrip] = React.useState(false);
  const [firstTripName, setFirstTripName] = React.useState("");

  React.useEffect(() => {
    if (hydrated && !user) router.replace("/");
  }, [hydrated, user, router]);

  React.useEffect(() => {
    if (hydrated && user && groups.length === 0 && !demoSeeded) {
      createDemoGroup(user);
    }
  }, [hydrated, user, groups.length, demoSeeded, createDemoGroup]);

  // Close mobile drawer when viewport resizes to desktop so we never leave
  // a stuck overlay behind.
  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileSidebar(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const active = groups.find((g) => g.id === activeGroupId) ?? groups[0] ?? null;

  const destination = React.useMemo(() => {
    if (active?.destinationId) {
      return (
        DESTINATIONS.find((d) => d.id === active.destinationId) ??
        DESTINATIONS[0]
      );
    }
    return DESTINATIONS[0];
  }, [active?.destinationId]);

  const remainingBudget = active
    ? Math.max(
        0,
        (active.budget ?? 0) -
          (active.expenses ?? []).reduce((s, e) => s + (e.amount ?? 0), 0)
      )
    : 0;

  if (!hydrated) return <Splash />;
  if (!user) return null;

  const origin = geo.coords ?? user.location ?? null;

  return (
    <main className="flex h-screen min-h-0 w-full overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <GroupSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />
      </div>

      {/* Mobile sidebar — custom slide-in panel (no nested Dialog) */}
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

      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border/60 bg-card/60 px-3 py-2 backdrop-blur-xl md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSidebar(true)}
            aria-label="Open trips"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <span className="truncate text-sm font-medium">
            {active ? active.name : "Trips"}
          </span>
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
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
              <ChatInterface
                group={active}
                user={user}
                expenseOpen={expenseOpen}
                onToggleExpense={() => setExpenseOpen((v) => !v)}
              />

              <div className="grid items-start gap-4 border-t border-border/60 bg-background/60 p-4 backdrop-blur-xl sm:grid-cols-2 xl:grid-cols-3">
                <div className="sm:col-span-2 xl:col-span-2">
                  <AIItinerary
                    initialDestinationId={destination.id}
                    members={(active.members ?? []).map((m) => ({
                      id: m.id,
                      name: m.name,
                    }))}
                    budget={active.budget || remainingBudget}
                    preferences={user.preferences ?? []}
                  />
                </div>
                <div className="space-y-4">
                  <WeatherWidget destination={destination} />
                  <SosWidget user={user} />
                </div>
                <GpsFuelCalculator origin={origin} destination={destination} />
                <PackingChecklist preferences={user.preferences ?? []} />

                <div className="sm:col-span-2 xl:col-span-3">
                  <DestinationPicker
                    activeId={destination.id}
                    onPick={(id) => setGroupDestination(active.id, id)}
                  />
                </div>

                <div className="sm:col-span-2 xl:col-span-3">
                  <AIRecommendationsCard
                    destination={destination}
                    preferences={user.preferences ?? []}
                    remainingBudget={remainingBudget}
                    origin={origin}
                  />
                </div>

                <div className="sm:col-span-2 xl:col-span-3">
                  <TripMap origin={origin} destination={destination} />
                </div>

                <div className="sm:col-span-2 xl:col-span-3">
                  <PhotoWall groupId={active.id} />
                </div>
              </div>
            </div>

            {expenseOpen && (
              <div className="hidden h-full md:flex">
                <ExpenseManager
                  group={active}
                  user={user}
                  onClose={() => setExpenseOpen(false)}
                />
              </div>
            )}
          </div>
        ) : (
          <EmptyState onCreate={() => setShowFirstTrip(true)} />
        )}

        {/* Mobile expense drawer — custom slide-in (no nested Dialog) */}
        <MobileDrawer
          open={expenseOpen && !!active}
          onClose={() => setExpenseOpen(false)}
          side="right"
          ariaLabel="Expense manager"
          mdHidden
        >
          {active && (
            <ExpenseManager
              group={active}
              user={user}
              onClose={() => setExpenseOpen(false)}
            />
          )}
        </MobileDrawer>
      </section>

      {/* First-time trip creation */}
      <Dialog open={showFirstTrip} onOpenChange={setShowFirstTrip}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Name your first trip</DialogTitle>
            <DialogDescription>
              You can invite friends after — by code or QR.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={firstTripName}
            onChange={(e) => setFirstTripName(e.target.value)}
            placeholder="e.g. Phuket Sunset Crew"
            autoFocus
          />
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

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  side: "left" | "right";
  ariaLabel: string;
  mdHidden?: boolean;
  children: React.ReactNode;
}

function MobileDrawer({
  open,
  onClose,
  side,
  ariaLabel,
  mdHidden,
  children,
}: MobileDrawerProps) {
  // Keep onClose in a ref so the effect's dep array depends only on `open`,
  // preventing churn when the parent recreates the callback each render.
  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

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
    <div
      role="dialog"
      aria-label={ariaLabel}
      aria-hidden={!open}
      className={cn(
        "fixed inset-0 z-50 md:hidden",
        mdHidden && "md:hidden",
        !open && "pointer-events-none"
      )}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
      />
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
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close drawer"
          className="absolute right-2 top-2 z-10"
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="h-full overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function DestinationPicker({
  activeId,
  onPick,
}: {
  activeId: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/70 p-4 backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-2">
        <MapIcon className="h-4 w-4 text-accent" />
        <div className="text-sm font-semibold">Trip destination</div>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {DESTINATIONS.slice(0, 10).map((d) => {
          const isActive = d.id === activeId;
          return (
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={d.imageUrl}
                alt={d.title}
                className="h-20 w-32 object-cover"
              />
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

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="grid flex-1 place-items-center p-6">
      <div className="max-w-md rounded-3xl border border-border/60 bg-card/70 p-8 text-center backdrop-blur-xl">
        <SquarePen className="mx-auto h-8 w-8 text-accent" />
        <h2 className="mt-3 text-xl font-semibold tracking-tight">
          No trips yet
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Spin up your first trip group to start chatting, splitting bills, and
          generating AI itineraries.
        </p>
        <Button variant="accent" className="mt-4 w-fit mx-auto" onClick={onCreate}>
          <ChevronLeft className="rotate-180 h-4 w-4" /> Create your first trip
        </Button>
      </div>
    </div>
  );
}
