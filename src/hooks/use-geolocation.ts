/**
 * @file `useGeolocation` — thin wrapper around the browser Geolocation API
 * that exposes a React-friendly state machine (idle → loading → granted /
 * denied / error) plus a manual `request()` trigger.
 *
 * Powers: the GPS fuel calculator, "near me" attractions, the SOS widget.
 *
 * (TH) ฮุกครอบ Geolocation API ของเบราว์เซอร์ คืนค่าเป็น state machine
 * ง่าย ๆ (idle / loading / granted / denied / error) พร้อมฟังก์ชัน
 * `request()` สำหรับขอตำแหน่งใหม่แบบ manual — ใช้ในตัวคำนวณค่าน้ำมัน, สถานที่
 * ใกล้ฉัน, และวิดเจ็ต SOS ครับ
 */

"use client";

import * as React from "react";
import type { GeoCoords } from "@/lib/types";

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Internal hook state. `status` mirrors the geolocation permission lifecycle
 * so consumers can render distinct UI per phase (e.g. spinner while loading,
 * "enable location" prompt when denied).
 *
 * (TH) state ภายในของฮุก: `status` สื่อถึงสถานะการขอสิทธิ์ ทำให้ UI สามารถ
 * แสดงผลต่างกันได้ตามแต่ละช่วง เช่น spinner ตอน loading, ปุ่มขอสิทธิ์ตอน denied
 */
interface GeoState {
  coords: GeoCoords | null;
  error: string | null;
  status: "idle" | "loading" | "granted" | "denied" | "error";
}

// Geolocation request options — low-accuracy is fine for distance estimates,
// 10s timeout avoids hanging the UI, and a 1-minute cache reuses recent fixes.
// ตัวเลือกของ getCurrentPosition: ไม่ต้องการความแม่นยำสูง, timeout 10 วิ และ
// cache 1 นาที เพื่อไม่ขอ GPS ซ้ำบ่อยเกินไป
const POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 60000,
};

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Subscribe to the browser's geolocation. By default the request fires
 * once on mount; pass `autoRequest = false` to defer until the user
 * clicks something that calls `request()` manually.
 *
 * @param autoRequest - When true (default), fetch location on mount.
 *
 * (TH) ดึงตำแหน่งจาก browser ตอน mount โดยอัตโนมัติ (ค่าเริ่มต้น) — ถ้าส่ง
 * `autoRequest = false` จะรอจนกว่าผู้ใช้กด UI เรียก `request()` เอง
 */
export function useGeolocation(autoRequest: boolean = true) {
  const [state, setState] = React.useState<GeoState>({
    coords: null,
    error: null,
    status: "idle",
  });

  /**
   * Manually trigger a position fetch. Safe to call multiple times —
   * each call moves `status` back through `loading` and ends in
   * `granted` / `denied` / `error`.
   *
   * (TH) สั่งขอตำแหน่งใหม่ด้วยตัวเอง เรียกซ้ำได้ — แต่ละครั้งจะรีเซ็ต status
   * เป็น loading แล้วจบที่ granted / denied / error
   */
  const request = React.useCallback(() => {
    // Guard for non-browser environments (SSR) and ancient browsers.
    // กันกรณีรันบน SSR หรือเบราว์เซอร์เก่าที่ไม่รองรับ Geolocation API
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState({
        coords: null,
        error: "Geolocation not supported",
        status: "error",
      });
      return;
    }
    // Mark loading immediately so the UI can show a spinner.
    // ตั้ง status เป็น loading ทันทีเพื่อให้ UI แสดง spinner
    setState((s) => ({ ...s, status: "loading" }));
    navigator.geolocation.getCurrentPosition(
      // Success: store lat/lng and mark granted.
      // success: เก็บค่า lat/lng และเปลี่ยน status เป็น granted
      (pos) =>
        setState({
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          error: null,
          status: "granted",
        }),
      // Failure: distinguish "user denied" from generic errors so UI can react.
      // ล้มเหลว: แยกกรณี user denied ออกจาก error ปกติเพื่อให้ UI ตอบสนองได้
      (err) =>
        setState({
          coords: null,
          error: err.message,
          status: err.code === err.PERMISSION_DENIED ? "denied" : "error",
        }),
      POSITION_OPTIONS
    );
  }, []);

  // Auto-request on mount when consumers want eager geolocation.
  // เรียกขอตำแหน่งอัตโนมัติตอน mount เมื่อ consumer เปิด autoRequest ไว้
  React.useEffect(() => {
    if (autoRequest) request();
  }, [autoRequest, request]);

  return { ...state, request };
}
