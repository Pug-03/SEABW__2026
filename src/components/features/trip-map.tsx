/**
 * @file `<TripMap>` — wrapper card around the heavy Leaflet map (which
 * lives in `./trip-map-inner.tsx`). This file holds the POI filter
 * chip UI and dynamically imports the inner map with SSR disabled
 * (Leaflet relies on `window`).
 *
 * (TH) การ์ดห่อแผนที่ Leaflet — แผนที่จริงอยู่ใน `./trip-map-inner.tsx`
 * ไฟล์นี้ดูแลแค่ปุ่ม filter POI และ dynamic import ของแผนที่ (ปิด SSR
 * เพราะ Leaflet ต้องใช้ window)
 */

"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Fuel, Hospital, Map as MapIcon, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Destination, GeoCoords } from "@/lib/types";
import type { PoiFilter } from "./trip-map-inner";

// Dynamic import — `ssr: false` keeps Leaflet out of the server bundle.
// dynamic import — ตั้ง ssr: false เพื่อกัน Leaflet ติด server bundle
const TripMapInner = dynamic(() => import("./trip-map-inner"), {
  ssr: false,
  loading: () => (
    // Placeholder while the inner map chunk is loading.
    // placeholder ระหว่างโหลดแผนที่
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

/** Props — origin (geolocation) and destination card the map focuses on. */
/** (TH) Props — origin (geolocation) + จุดหมายที่แผนที่โฟกัส */
interface TripMapProps {
  origin: GeoCoords | null;
  destination: Destination;
}

/**
 * Filter chip definitions — `value` matches `PoiFilter` from the
 * inner map. Edit this to add/remove POI categories.
 *
 * (TH) นิยาม chip filter — `value` ต้องตรงกับ `PoiFilter` ของแผนที่ภายใน
 * แก้ที่นี่เพื่อเพิ่ม/ลดหมวด POI
 */
const FILTERS: { label: string; value: PoiFilter; icon: React.ElementType; color: string }[] = [
  { label: "All POI", value: "all", icon: MapIcon, color: "text-muted-foreground" },
  { label: "Hospitals", value: "Hospital", icon: Hospital, color: "text-rose-500" },
  { label: "Police", value: "Police", icon: Shield, color: "text-blue-500" },
  { label: "Gas", value: "Gas", icon: Fuel, color: "text-emerald-500" },
];

/**
 * The outer map card. Holds the chosen POI filter in local state and
 * forwards it to the inner map.
 *
 * (TH) การ์ดแผนที่ภายนอก เก็บค่า filter POI และส่งให้แผนที่ภายใน
 */
export function TripMap({ origin, destination }: TripMapProps) {
  const [filter, setFilter] = React.useState<PoiFilter>("all");

  return (
    // Card with overflow-hidden so the rounded corners clip the map.
    // การ์ด overflow-hidden เพื่อให้มุมโค้ง clip แผนที่ได้
    <Card className="overflow-hidden">
      {/* Card header — title on the left, filter chips on the right. */}
      {/* header — ชื่อซ้าย, chip filter ขวา */}
      <CardHeader className="pb-3">
        {/* Header row. */}
        {/* แถวหัว */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Title with map icon. */}
          {/* ชื่อพร้อมไอคอนแผนที่ */}
          <CardTitle className="flex items-center gap-2 text-base">
            {/* Map icon. */}
            {/* ไอคอนแผนที่ */}
            <MapIcon className="h-4 w-4 text-accent" /> Navigation Map
          </CardTitle>
          {/* Filter chips row. */}
          {/* แถว chip filter */}
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => {
              const Icon = f.icon;
              return (
                // One filter chip.
                // chip filter หนึ่งอัน
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
                    filter === f.value
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border bg-secondary text-muted-foreground hover:bg-secondary/70"
                  )}
                >
                  {/* Category icon — color follows the chip's active state. */}
                  {/* ไอคอนหมวด — สีเปลี่ยนตามสถานะ active */}
                  <Icon className={cn("h-3 w-3", filter === f.value ? "text-accent" : f.color)} />
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>
      {/* Card body — no padding so the map fills edge-to-edge. */}
      {/* body — ไม่มี padding เพื่อให้แผนที่ชนขอบการ์ด */}
      <CardContent className="p-0">
        {/* Map container — fixed height (taller on sm+). */}
        {/* container แผนที่ — ความสูงคงที่ (สูงขึ้นบน sm) */}
        <div className="h-72 w-full overflow-hidden sm:h-96">
          {/* The dynamically loaded Leaflet map. */}
          {/* แผนที่ Leaflet ที่โหลดแบบ dynamic */}
          <TripMapInner origin={origin} destination={destination} poiFilter={filter} />
        </div>
        {!origin && (
          /* Helper line when the user hasn't granted geolocation. */
          /* บรรทัด help เมื่อยังไม่ได้ allow geolocation */
          <p className="px-4 py-2 text-center text-xs text-muted-foreground">
            Enable location to see your route and distance
          </p>
        )}
      </CardContent>
    </Card>
  );
}
