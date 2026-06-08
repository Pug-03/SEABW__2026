/**
 * @file `POST /api/auth/verify-otp` — verify a submitted password-reset OTP.
 *
 * Body: `{ identifier: string, otp: string }`
 *
 * Responses (intentionally vague to avoid leaking account/code state):
 *   200 `{ ok: true }`
 *   400 `{ ok: false, error: "invalid_request" }`
 *   401 `{ ok: false, error: "invalid", attemptsRemaining }`
 *   410 `{ ok: false, error: "expired" }`        (no/expired code)
 *   429 `{ ok: false, error: "locked" }`         (attempt cap reached)
 *
 * Verification is a bcrypt compare against the server-stored hash; the raw
 * code is never stored, logged, or returned. After `MAX_VERIFY_ATTEMPTS`
 * failures the code is invalidated (see `@/lib/otp/service`).
 *
 * (TH) `POST /api/auth/verify-otp` — ตรวจ OTP ที่ส่งมา รับ body
 * `{ identifier, otp }` คำตอบจงใจกำกวมเพื่อไม่รั่วสถานะบัญชี/โค้ด ตรวจด้วย
 * bcrypt compare กับ hash ที่เก็บฝั่ง server ไม่เก็บ/ไม่ log/ไม่คืนโค้ดดิบ และ
 * เมื่อผิดครบจำนวนจะยกเลิกโค้ด
 */

import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp/service";

// bcrypt + ioredis need the Node runtime.
// bcrypt + ioredis ต้องใช้ Node runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Handle a verify-OTP request. Validates the body, delegates the bcrypt
 * compare + attempt accounting to the service, and maps the outcome to a
 * suitably vague HTTP status.
 *
 * (TH) จัดการคำขอตรวจ OTP — ตรวจ body, ส่งต่อ bcrypt compare + การนับครั้ง
 * ให้ service แล้ว map ผลเป็น HTTP status ที่กำกวมพอเหมาะ
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 }
    );
  }

  const { identifier, otp } = (body ?? {}) as {
    identifier?: unknown;
    otp?: unknown;
  };

  // Shape/format check — identifier present, otp is 6 digits.
  // ตรวจรูปแบบ — มี identifier และ otp เป็นตัวเลข 6 หลัก
  if (
    typeof identifier !== "string" ||
    identifier.trim() === "" ||
    typeof otp !== "string" ||
    !/^\d{6}$/.test(otp)
  ) {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 }
    );
  }

  const result = await verifyOtp(identifier, otp);

  if (result.ok) {
    return NextResponse.json({ ok: true });
  }

  if (result.reason === "locked") {
    return NextResponse.json(
      { ok: false, error: "locked" },
      { status: 429 }
    );
  }

  if (result.reason === "expired") {
    return NextResponse.json(
      { ok: false, error: "expired" },
      { status: 410 }
    );
  }

  // Wrong code — include attempts remaining (not an enumeration vector).
  // โค้ดผิด — แนบจำนวนครั้งที่เหลือ (ไม่ใช่ช่องทาง enumeration)
  return NextResponse.json(
    {
      ok: false,
      error: "invalid",
      attemptsRemaining: result.attemptsRemaining,
    },
    { status: 401 }
  );
}
