/**
 * @file `POST /api/auth/send-otp` — issue and deliver a password-reset OTP.
 *
 * Body: `{ method: "email" | "sms", identifier: string }`
 *
 * Responses (the raw OTP is NEVER returned):
 *   200 `{ ok: true, channel, expiresAt }`
 *   400 `{ ok: false, error: "invalid_request" }`
 *   429 `{ ok: false, error: "rate_limited", retryAfter }`  (+ Retry-After)
 *   502 `{ ok: false, error: "delivery_failed" }`
 *
 * Security: generates a 6-digit code, bcrypt-hashes it server-side with a
 * 5-minute TTL, and enforces max 3 sends per identifier per 15 minutes — all
 * handled in `@/lib/otp/service`.
 *
 * (TH) `POST /api/auth/send-otp` — ออกและส่ง OTP สำหรับรีเซ็ตรหัสผ่าน
 * รับ body `{ method, identifier }` ไม่คืน OTP ดิบเด็ดขาด สร้างโค้ด 6 หลัก
 * hash ด้วย bcrypt ฝั่ง server อายุ 5 นาที และจำกัดส่งสูงสุด 3 ครั้ง/15 นาที
 */

import { NextResponse } from "next/server";
import { issueOtp } from "@/lib/otp/service";
import { isEmail, isPhone } from "@/lib/reset-password-schema";

// bcrypt + ioredis + the mail/SMS SDKs need the Node runtime, not edge.
// bcrypt + ioredis + SDK อีเมล/SMS ต้องใช้ Node runtime ไม่ใช่ edge
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Handle a send-OTP request. Validates the body shape and the identifier
 * format for the chosen channel, then delegates issuing + delivery to the
 * service and maps its result to an HTTP response.
 *
 * (TH) จัดการคำขอส่ง OTP — ตรวจรูปร่าง body และรูปแบบ identifier ตามช่องที่
 * เลือก แล้วส่งต่อการออก+ส่งให้ service และ map ผลเป็น HTTP response
 */
export async function POST(req: Request) {
  // Parse JSON defensively — a malformed body is just an invalid request.
  // parse JSON อย่างระวัง — body ที่ผิดรูปถือเป็น invalid request
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 }
    );
  }

  const { method, identifier } = (body ?? {}) as {
    method?: unknown;
    identifier?: unknown;
  };

  // Validate channel + identifier together (format must match the channel).
  // ตรวจช่อง + identifier ไปพร้อมกัน (รูปแบบต้องตรงกับช่อง)
  if (
    (method !== "email" && method !== "sms") ||
    typeof identifier !== "string" ||
    (method === "email" && !isEmail(identifier)) ||
    (method === "sms" && !isPhone(identifier))
  ) {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 }
    );
  }

  const result = await issueOtp(method, identifier);

  if (result.ok) {
    return NextResponse.json({
      ok: true,
      channel: method,
      expiresAt: result.expiresAt,
    });
  }

  if (result.reason === "rate_limited") {
    return NextResponse.json(
      { ok: false, error: "rate_limited", retryAfter: result.retryAfter },
      { status: 429, headers: { "Retry-After": String(result.retryAfter) } }
    );
  }

  // Delivery failure — generic, no provider details leaked.
  // ส่งล้มเหลว — generic ไม่เผยรายละเอียดผู้ให้บริการ
  return NextResponse.json(
    { ok: false, error: "delivery_failed" },
    { status: 502 }
  );
}
