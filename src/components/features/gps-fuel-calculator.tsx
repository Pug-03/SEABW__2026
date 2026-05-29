/**
 * @file `<GpsFuelCalculator>` — quick distance/ETA/fuel-cost estimator
 * for a chosen destination. Uses the haversine distance from
 * `origin` (the user's geolocation) to the destination coordinates,
 * then derives liters and cost from configurable vehicle assumptions.
 * "Open in Maps" deep-links to Google Maps directions.
 *
 * (TH) วิดเจ็ตประเมินระยะ/เวลา/ค่าน้ำมันไปยังจุดหมายที่เลือก ใช้
 * haversine จาก `origin` (geolocation ผู้ใช้) ไปยังพิกัดปลายทาง แล้ว
 * คำนวณลิตรและบาทจากค่ารถที่ปรับได้ ปุ่ม "Open in Maps" เปิด Google Maps
 * พร้อมเส้นทางเตรียมไว้
 */

"use client";

import * as React from "react";
import { Clock, Fuel, Gauge, Navigation, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Destination, GeoCoords } from "@/lib/types";
import { formatCurrency, haversineDistanceKm } from "@/lib/utils";
import {
  AVG_KM_PER_LITER as DEFAULT_KM_PER_L,
  FUEL_RATE_THB_PER_LITER,
} from "@/lib/mock-data";

/**
 * Props for `<GpsFuelCalculator>`. `origin` may be `null` when the
 * user has not granted geolocation — the widget then renders the
 * inputs but shows "—" for the derived values.
 *
 * (TH) Props: `origin` อาจเป็น null ถ้าผู้ใช้ยังไม่ allow geolocation —
 * widget จะยังแสดง input แต่ค่าผลลัพธ์จะเป็น "—"
 */
interface GpsFuelCalculatorProps {
  origin: GeoCoords | null;
  destination: Destination;
}

// Default cruising speed (km/h) for ETA estimates.
// ความเร็วเฉลี่ยตั้งต้น (กม./ชม.) สำหรับคำนวณ ETA
const DEFAULT_AVG_KMH = 80;

/**
 * The widget itself. Holds three adjustable assumptions (km/L, ฿/L,
 * avg km/h) so the user can tune to their own car.
 *
 * (TH) ตัว widget — มีค่าปรับ 3 ตัว (km/L, บาท/L, ค่าเฉลี่ย km/h) ให้
 * ผู้ใช้ปรับตามรถตัวเอง
 */
export function GpsFuelCalculator({
  origin,
  destination,
}: GpsFuelCalculatorProps) {
  // Adjustable vehicle assumptions.
  // ค่ารถที่ปรับได้
  const [kmPerLiter, setKmPerLiter] = React.useState(DEFAULT_KM_PER_L);
  const [fuelRate, setFuelRate] = React.useState(FUEL_RATE_THB_PER_LITER);
  const [avgKmh, setAvgKmh] = React.useState(DEFAULT_AVG_KMH);

  // Derived values — null when geolocation isn't available yet.
  // ค่าที่คำนวณ — null ถ้ายังไม่มี geolocation
  const distanceKm = origin
    ? Math.round(haversineDistanceKm(origin, destination.coords))
    : null;
  const liters = distanceKm ? distanceKm / kmPerLiter : 0;
  const fuelCost = liters * fuelRate;
  const etaHours = distanceKm ? distanceKm / avgKmh : 0;
  // Split hours/minutes for human-readable display.
  // แยกชั่วโมง/นาทีเพื่อแสดงผลให้คนอ่านง่าย
  const etaH = Math.floor(etaHours);
  const etaM = Math.round((etaHours - etaH) * 60);

  return (
    // Card wrapper.
    // ตัวห่อการ์ด
    <Card>
      {/* Card header. */}
      {/* header */}
      <CardHeader className="pb-2">
        {/* Title with navigation icon. */}
        {/* ชื่อพร้อมไอคอน navigation */}
        <CardTitle className="flex items-center gap-2 text-base">
          {/* Navigation icon. */}
          {/* ไอคอน navigation */}
          <Navigation className="h-4 w-4 text-accent" /> GPS & Fuel
        </CardTitle>
      </CardHeader>
      {/* Card body. */}
      {/* body */}
      <CardContent className="space-y-3">
        {!origin && (
          /* Hint when the user hasn't granted location. */
          /* hint ตอนยังไม่ได้ allow geolocation */
          <p className="text-xs text-muted-foreground">
            Enable location to estimate distance & fuel.
          </p>
        )}
        {/* Three-up stat row: distance / ETA / fuel cost. */}
        {/* แถวสรุป 3 ค่า: distance / ETA / ค่าน้ำมัน */}
        <div className="grid grid-cols-3 gap-2">
          {/* Distance stat. */}
          {/* ค่า distance */}
          <Stat
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Distance"
            value={distanceKm != null ? `${distanceKm} km` : "—"}
          />
          {/* ETA stat. */}
          {/* ค่า ETA */}
          <Stat
            icon={<Clock className="h-3.5 w-3.5" />}
            label="ETA"
            value={distanceKm != null ? `${etaH}h ${etaM}m` : "—"}
          />
          {/* Fuel cost stat. */}
          {/* ค่าน้ำมัน */}
          <Stat
            icon={<Fuel className="h-3.5 w-3.5" />}
            label="Fuel cost"
            value={distanceKm != null ? formatCurrency(fuelCost) : "—"}
          />
        </div>

        {/* Collapsible "vehicle assumptions" tweak panel. */}
        {/* panel ปรับค่ารถที่ขยายได้ */}
        <details className="rounded-xl border border-border/60 bg-secondary/30 p-3">
          {/* Summary (clickable line that toggles open). */}
          {/* บรรทัด summary ที่กดเพื่อเปิด/ปิด */}
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
            {/* Gauge icon. */}
            {/* ไอคอน gauge */}
            <Gauge className="mr-1 inline h-3 w-3" /> Adjust vehicle assumptions
          </summary>
          {/* Three-up inputs: km/L, ฿/L, avg km/h. */}
          {/* input 3 ช่อง: km/L, บาท/L, ค่าเฉลี่ย km/h */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {/* km/L field. */}
            {/* ช่อง km/L */}
            <div>
              <Label className="text-[10px]">km / L</Label>
              <Input
                type="number"
                value={kmPerLiter}
                onChange={(e) => setKmPerLiter(Number(e.target.value) || 0)}
                className="h-9"
              />
            </div>
            {/* ฿/L field. */}
            {/* ช่องบาท/L */}
            <div>
              <Label className="text-[10px]">฿ / L</Label>
              <Input
                type="number"
                value={fuelRate}
                onChange={(e) => setFuelRate(Number(e.target.value) || 0)}
                className="h-9"
              />
            </div>
            {/* Avg km/h field — minimum 1 to avoid divide-by-zero. */}
            {/* ช่อง avg km/h — ขั้นต่ำ 1 เพื่อกันการหารด้วยศูนย์ */}
            <div>
              <Label className="text-[10px]">avg km/h</Label>
              <Input
                type="number"
                value={avgKmh}
                onChange={(e) =>
                  setAvgKmh(Math.max(1, Number(e.target.value) || 1))
                }
                className="h-9"
              />
            </div>
          </div>
        </details>

        {/* "Open in Maps" deep link — `asChild` makes the Button render an <a>. */}
        {/* ลิงก์ "Open in Maps" — `asChild` ทำให้ Button render เป็น <a> */}
        <Button variant="glass" size="sm" className="w-full" asChild>
          <a
            href={`https://www.google.com/maps/dir/${origin ? `${origin.lat},${origin.lng}` : ""}/${destination.coords.lat},${destination.coords.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            {/* Navigation icon. */}
            {/* ไอคอน navigation */}
            <Navigation className="h-3.5 w-3.5" /> Open in Maps
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Single stat tile inside the three-up summary row. Centered icon +
 * uppercase label + bold value.
 *
 * (TH) tile สรุปค่าตัวเดียวในแถวสรุป 3 ช่อง — icon กึ่งกลาง + label
 * ตัวพิมพ์ใหญ่ + ค่าตัวหนา
 */
function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    // Stat tile wrapper.
    // ตัวห่อ tile
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-2.5 text-center">
      {/* Icon + label cluster. */}
      {/* กลุ่ม icon + label */}
      <div className="mx-auto mb-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      {/* Numeric/text value. */}
      {/* ค่าตัวเลข/ข้อความ */}
      <div className="text-sm font-semibold tracking-tight">{value}</div>
    </div>
  );
}
