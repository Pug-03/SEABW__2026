/**
 * @file Tiny pure-function utility helpers used across the app.
 *
 * Nothing in here touches React, the network, or storage — only push code
 * into this file if it's trivially testable and has no side effects.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Earth's mean radius in kilometers, used by `haversineDistanceKm`.
const EARTH_RADIUS_KM = 6371;

/**
 * Combine Tailwind utility classes with conditional logic and resolve
 * conflicting classes safely (later classes win, per Tailwind precedence).
 *
 * Example: `cn("p-2", isActive && "bg-blue-500", "p-4")` → `"bg-blue-500 p-4"`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as a localized currency string (defaults to THB).
 * Fractional digits are dropped because the app deals in whole baht.
 *
 * @param amount - Numeric value to format.
 * @param currency - ISO-4217 currency code. Defaults to "THB".
 */
export function formatCurrency(amount: number, currency: string = "THB"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a `Date` as a short clock time (e.g. "09:30") using the
 * user's locale settings.
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Generate a short, collision-resistant client-side ID.
 *
 * This is NOT cryptographically secure — it's only used for demo data,
 * optimistic UI keys, and Zustand store entries that never sync to a
 * real backend. Replace with `crypto.randomUUID()` if persisting to a
 * shared database.
 *
 * @param prefix - Short namespace prefix (e.g. "msg", "exp"). Defaults to "id".
 * @returns A string like `"msg_a1b2c3d4"`.
 */
export function generateId(prefix: string = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Great-circle distance between two lat/lng points using the
 * haversine formula. Returns kilometers.
 *
 * Accurate to within ~0.5% for typical travel distances — fine for
 * fuel/cost estimates, not for navigation.
 */
export function haversineDistanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  // Convert decimal degrees to radians.
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;

  // Differences and absolute latitudes both go through toRad once.
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  // Haversine `a` term — half the chord length squared on a unit sphere.
  const chord =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  // Multiply by 2·R·asin(√a) to recover the arc length.
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(chord));
}
