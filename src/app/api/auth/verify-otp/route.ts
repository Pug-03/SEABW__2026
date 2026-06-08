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
import { errorResponse, readJsonBody } from "@/lib/otp/http";

// bcrypt + ioredis need the Node runtime.
// bcrypt + ioredis ต้องใช้ Node runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A validated verify-OTP request body. */
/** (TH) body คำขอตรวจ OTP ที่ผ่านการตรวจแล้ว */
interface VerifyRequest {
  identifier: string;
  otp: string;
}

/**
 * Narrow a raw body into a `VerifyRequest`, or `null` when invalid: the
 * identifier must be present and `otp` exactly 6 digits.
 *
 * (TH) แปลง body ดิบเป็น `VerifyRequest` หรือ `null` เมื่อไม่ถูกต้อง: ต้องมี
 * identifier และ `otp` เป็นตัวเลข 6 หลักพอดี
 */
function parseVerifyRequest(
  body: Record<string, unknown> | null
): VerifyRequest | null {
  const identifier = body?.identifier;
  const otp = body?.otp;
  if (typeof identifier !== "string" || identifier.trim() === "") return null;
  if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) return null;
  return { identifier, otp };
}

/**
 * Handle a verify-OTP request: validate the body, delegate the bcrypt compare
 * + attempt accounting to the service, and map the outcome to a suitably vague
 * HTTP status.
 *
 * (TH) จัดการคำขอตรวจ OTP — ตรวจ body, ส่งต่อ bcrypt compare + การนับครั้งให้
 * service แล้ว map ผลเป็น HTTP status ที่กำกวมพอเหมาะ
 */
export async function POST(req: Request) {
  const parsed = parseVerifyRequest(await readJsonBody(req));
  if (!parsed) return errorResponse("invalid_request", 400);

  const result = await verifyOtp(parsed.identifier, parsed.otp);
  if (result.ok) return NextResponse.json({ ok: true });
  if (result.reason === "locked") return errorResponse("locked", 429);
  if (result.reason === "expired") return errorResponse("expired", 410);

  // Wrong code — include attempts remaining (not an enumeration vector).
  // โค้ดผิด — แนบจำนวนครั้งที่เหลือ (ไม่ใช่ช่องทาง enumeration)
  return NextResponse.json(
    { ok: false, error: "invalid", attemptsRemaining: result.attemptsRemaining },
    { status: 401 }
  );
}
