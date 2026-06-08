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
import { errorResponse, readJsonBody } from "@/lib/otp/http";
import { isEmail, isPhone, type DeliveryMethod } from "@/lib/reset-password-schema";

// bcrypt + ioredis + the mail/SMS SDKs need the Node runtime, not edge.
// bcrypt + ioredis + SDK อีเมล/SMS ต้องใช้ Node runtime ไม่ใช่ edge
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A validated send-OTP request body. */
/** (TH) body คำขอส่ง OTP ที่ผ่านการตรวจแล้ว */
interface SendRequest {
  method: DeliveryMethod;
  identifier: string;
}

/**
 * Narrow a raw body into a `SendRequest`, or `null` when invalid. The
 * identifier format must match the chosen channel (email for "email", phone
 * for "sms").
 *
 * (TH) แปลง body ดิบเป็น `SendRequest` หรือ `null` เมื่อไม่ถูกต้อง รูปแบบ
 * identifier ต้องตรงกับช่องที่เลือก (อีเมลสำหรับ "email", เบอร์สำหรับ "sms")
 */
function parseSendRequest(body: Record<string, unknown> | null): SendRequest | null {
  const method = body?.method;
  const identifier = body?.identifier;
  if (typeof identifier !== "string") return null;
  if (method === "email" && isEmail(identifier)) return { method, identifier };
  if (method === "sms" && isPhone(identifier)) return { method, identifier };
  return null;
}

/**
 * Handle a send-OTP request: validate the body, delegate issuing + delivery to
 * the service, and map its result to an HTTP response.
 *
 * (TH) จัดการคำขอส่ง OTP — ตรวจ body, ส่งต่อการออก+ส่งให้ service และ map ผล
 * เป็น HTTP response
 */
export async function POST(req: Request) {
  const parsed = parseSendRequest(await readJsonBody(req));
  if (!parsed) return errorResponse("invalid_request", 400);

  const result = await issueOtp(parsed.method, parsed.identifier);
  if (result.ok) {
    return NextResponse.json({
      ok: true,
      channel: parsed.method,
      expiresAt: result.expiresAt,
    });
  }
  if (result.reason === "rate_limited") {
    return errorResponse("rate_limited", 429, result.retryAfter);
  }
  // Delivery failure — generic, no provider details leaked.
  // ส่งล้มเหลว — generic ไม่เผยรายละเอียดผู้ให้บริการ
  return errorResponse("delivery_failed", 502);
}
