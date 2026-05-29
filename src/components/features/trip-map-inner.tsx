/**
 * @file Leaflet-based map rendered inside `<TripMap>`. Separated from
 * the outer card so `next/dynamic({ ssr: false })` can lazy-load the
 * heavy `react-leaflet` and `leaflet` bundles only when the user
 * actually views the map.
 *
 * Renders four kinds of overlays:
 *   - Origin marker (the user's geolocation, purple dot).
 *   - Destination marker (the trip target, orange dot).
 *   - A dashed Polyline connecting origin → destination.
 *   - POI markers (hospitals/police/gas) randomly distributed around
 *     the destination for demo purposes — see `poiMarkers` below.
 *
 * (TH) แผนที่ Leaflet ที่อยู่ภายใน `<TripMap>` แยกออกมาเพื่อให้
 * `next/dynamic({ ssr: false })` โหลด react-leaflet/leaflet แบบ lazy
 * เฉพาะตอนแสดงแผนที่จริง ๆ
 * วาด overlay 4 แบบ: หมุดตำแหน่งผู้ใช้, หมุดจุดหมาย, เส้นปะเชื่อมระหว่าง 2
 * จุด, และหมุด POI (โรงพยาบาล/ตำรวจ/ปั๊ม) กระจายรอบจุดหมายแบบ mock
 */

"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SOS_FACILITIES } from "@/lib/mock-data";
import type { Destination, GeoCoords } from "@/lib/types";

// ─── Icon setup ──────────────────────────────────────────────────────────────
// Fix Leaflet's default icon paths — webpack breaks them, so we
// point them at the CDN copies that ship with leaflet 1.9.4.
// แก้ path icon default ของ Leaflet ที่ webpack ทำพังโดยชี้ไปยัง CDN
// ของ leaflet 1.9.4 แทน
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)["_getIconUrl"];
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/**
 * Build a colored circle div-icon for Leaflet. Smaller and crisper
 * than the default PNG markers, and color-codable per category.
 *
 * (TH) สร้าง div-icon วงกลมสีตามที่กำหนดให้ Leaflet ใช้ — เล็ก คม และ
 * ระบายสีตามหมวดได้
 */
const makeIcon = (color: string) =>
  L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

// Color map per POI category.
// แผนที่สีของหมวด POI
const POI_COLORS: Record<string, string> = {
  Hospital: "#ef4444",
  Police: "#3b82f6",
  Gas: "#22c55e",
};
// Brand colors for origin/destination markers.
// สีสำหรับหมุด origin/destination
const ORIGIN_COLOR = "#8b5cf6";
const DEST_COLOR = "#f97316";

// ─── Bounds-fitter helper ────────────────────────────────────────────────────

/**
 * Adjust the map viewport so all the given points are visible. Used
 * once the origin + destination points are known so the user sees
 * both pins without having to pan/zoom manually.
 *
 * (TH) ปรับ viewport ของแผนที่ให้เห็นจุดทุกจุดที่ส่งมา — เรียกหลังจาก
 * รู้พิกัด origin + destination เพื่อให้ผู้ใช้เห็นทั้งสองจุดทันที
 */
function FitBounds({ points }: { points: [number, number][] }) {
  // Access the underlying Leaflet map instance.
  // ดึง instance ของ Leaflet map
  const map = useMap();
  React.useEffect(() => {
    if (points.length >= 2) {
      // Two or more points → fit bounds with comfortable padding.
      // จุดตั้งแต่ 2 จุด → fit bounds พร้อม padding สบายตา
      map.fitBounds(points, { padding: [40, 40] });
    } else if (points.length === 1) {
      // Single point → center on it at zoom 12.
      // จุดเดียว → ตั้ง view ไปที่จุดนั้นที่ zoom 12
      map.setView(points[0], 12);
    }
  }, [map, points]);
  return null;
}

// ─── Public types ────────────────────────────────────────────────────────────

/** POI filter values — also re-used by the parent `<TripMap>`. */
/** (TH) ค่า filter ของ POI — ใช้ร่วมกับ `<TripMap>` ด้วย */
export type PoiFilter = "all" | "Hospital" | "Police" | "Gas";

interface TripMapInnerProps {
  origin: GeoCoords | null;
  destination: Destination;
  poiFilter: PoiFilter;
}

// ─── Map component ───────────────────────────────────────────────────────────

/**
 * The actual map. Tile layer is OSM. POI markers are placed in a
 * radial pattern around the destination (NOT real geocoded positions
 * — see comment near `poiMarkers`).
 *
 * (TH) ตัวแผนที่จริง — ใช้ tile ของ OSM, หมุด POI วางเป็นวงรอบจุดหมาย
 * แบบ mock (ไม่ใช่พิกัดจริง)
 */
export default function TripMapInner({ origin, destination, poiFilter }: TripMapInnerProps) {
  // Tuple form of destination/origin for Leaflet APIs.
  // แปลง destination/origin เป็น tuple ให้ตรงกับ API ของ Leaflet
  const destPos: [number, number] = [destination.coords.lat, destination.coords.lng];
  const originPos: [number, number] | null = origin
    ? [origin.lat, origin.lng]
    : null;

  // Combined points list for `FitBounds`. Memoized on the raw lat/lng
  // numbers to avoid re-running when the array identity changes but
  // values are the same.
  // รวมจุดสำหรับ FitBounds — memo ตามเลข lat/lng เพื่อกัน re-run เมื่อ
  // identity เปลี่ยนแต่ค่าเหมือนเดิม
  const allPoints = React.useMemo<[number, number][]>(
    () => [...(originPos ? [originPos] : []), destPos],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [originPos?.[0], originPos?.[1], destPos[0], destPos[1]]
  );

  // Filter the static SOS facility list to the chosen POI category.
  // กรองรายการ SOS ตามหมวด POI ที่เลือก
  const visibleFacilities = SOS_FACILITIES.filter(
    (f) => poiFilter === "all" || f.type === poiFilter
  );

  // Spread POI markers in a circle around the destination — purely
  // visual since we don't have real lat/lng for each facility. Radius
  // grows slightly every third marker to avoid stacking.
  // วางหมุด POI เป็นวงกลมรอบจุดหมาย (เพื่อโชว์เฉย ๆ เพราะไม่มีพิกัดจริง
  // ของแต่ละสถานที่) รัศมีเพิ่มทีละนิดทุก 3 อันเพื่อกันการซ้อนทับ
  const poiMarkers = visibleFacilities.map((f, i) => {
    const angle = (i / visibleFacilities.length) * 2 * Math.PI;
    const r = 0.02 + (i % 3) * 0.008;
    return {
      ...f,
      pos: [
        destination.coords.lat + r * Math.sin(angle),
        destination.coords.lng + r * Math.cos(angle),
      ] as [number, number],
    };
  });

  return (
    // Leaflet map root.
    // root ของ Leaflet map
    <MapContainer
      center={destPos}
      zoom={11}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
    >
      {/* OSM tile layer with required attribution. */}
      {/* tile layer ของ OSM (ต้องใส่ attribution) */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Auto-fit viewport once we know which points to show. */}
      {/* fit viewport อัตโนมัติเมื่อรู้จุดที่ต้องโชว์ */}
      <FitBounds points={allPoints} />

      {originPos && (
        /* Origin marker — only when geolocation is known. */
        /* หมุด origin — แสดงเฉพาะเมื่อรู้ตำแหน่งผู้ใช้ */
        <Marker position={originPos} icon={makeIcon(ORIGIN_COLOR)}>
          {/* Popup for the origin pin. */}
          {/* popup ของหมุดผู้ใช้ */}
          <Popup>📍 Your location</Popup>
        </Marker>
      )}

      {/* Destination marker — always rendered. */}
      {/* หมุดจุดหมาย — แสดงเสมอ */}
      <Marker position={destPos} icon={makeIcon(DEST_COLOR)}>
        {/* Popup with title + region. */}
        {/* popup แสดงชื่อ + region */}
        <Popup>
          <strong>{destination.title}</strong>
          <br />
          {destination.region}
        </Popup>
      </Marker>

      {originPos && (
        /* Dashed route line from origin → destination. */
        /* เส้นปะจาก origin → destination */
        <Polyline
          positions={[originPos, destPos]}
          pathOptions={{ color: "#8b5cf6", weight: 3, dashArray: "8 6", opacity: 0.8 }}
        />
      )}

      {/* POI markers — each with name, distance, and tap-to-call number. */}
      {/* หมุด POI — ทุกอันมีชื่อ, ระยะ, และเบอร์โทรกดได้ */}
      {poiMarkers.map((f) => (
        <Marker key={`${f.type}-${f.name}`} position={f.pos} icon={makeIcon(POI_COLORS[f.type])}>
          {/* Popup with facility details. */}
          {/* popup รายละเอียดสถานที่ */}
          <Popup>
            <strong>{f.name}</strong>
            <br />
            {f.type} · {f.distanceKm} km · <a href={`tel:${f.phone.replace(/\s/g, "")}`}>{f.phone}</a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
