/**
 * @file Tiny HTTP helpers shared by the OTP API routes — JSON body parsing and
 * a uniform error-response shape. Keeping these here removes the parse/error
 * boilerplate that was duplicated across `send-otp` and `verify-otp`.
 *
 * (TH) ตัวช่วย HTTP เล็ก ๆ ที่ route OTP ใช้ร่วมกัน — parse body JSON และรูป
 * แบบ error response ที่เป็นมาตรฐานเดียวกัน ช่วยลด boilerplate ที่เคยซ้ำกันใน
 * `send-otp` และ `verify-otp`
 */

import { NextResponse } from "next/server";

/**
 * Parse a request's JSON body into a plain object, or return `null` when the
 * body is missing or malformed (the caller treats that as an invalid request).
 *
 * (TH) parse body JSON ของคำขอเป็น object ธรรมดา หรือคืน `null` เมื่อ body
 * หายไปหรือผิดรูป (ผู้เรียกถือเป็นคำขอที่ไม่ถูกต้อง)
 */
export async function readJsonBody(
  req: Request
): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return (body ?? {}) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Build a uniform `{ ok: false, error }` JSON response. When `retryAfter`
 * (seconds) is given it's added to the body AND sent as a `Retry-After` header.
 *
 * (TH) สร้าง JSON response รูปแบบเดียวกัน `{ ok: false, error }` ถ้ามี
 * `retryAfter` (วินาที) จะแนบทั้งใน body และส่งเป็นเฮดเดอร์ `Retry-After`
 */
export function errorResponse(
  error: string,
  status: number,
  retryAfter?: number
): NextResponse {
  if (retryAfter != null) {
    return NextResponse.json(
      { ok: false, error, retryAfter },
      { status, headers: { "Retry-After": String(retryAfter) } }
    );
  }
  return NextResponse.json({ ok: false, error }, { status });
}
