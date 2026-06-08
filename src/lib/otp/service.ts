/**
 * @file Core OTP business logic shared by the API routes. Generates codes,
 * hashes them with bcrypt, enforces the send rate-limit and verify-attempt
 * cap, and never exposes the raw code outside `issueOtp` (where it's handed
 * straight to the delivery layer and then forgotten).
 *
 * Security policy implemented here:
 *   - 6-digit numeric OTP, bcrypt-hashed before storage.
 *   - 5-minute expiry (TTL on the store record).
 *   - Max 3 sends per identifier per 15 minutes.
 *   - Max 5 verify attempts per code, then the code is invalidated.
 *   - Generic, non-enumerating outcomes — callers translate these into vague
 *     client messages.
 *
 * (TH) ตรรกะหลักของ OTP ที่ API route ใช้ร่วมกัน สร้างโค้ด, hash ด้วย bcrypt,
 * บังคับ rate-limit การส่งและเพดานครั้งการยืนยัน และไม่เปิดเผยโค้ดดิบนอก
 * `issueOtp` (ซึ่งส่งต่อให้ชั้น delivery ทันทีแล้วลืม)
 * นโยบายความปลอดภัย: OTP ตัวเลข 6 หลัก hash ก่อนเก็บ, หมดอายุ 5 นาที, ส่งได้
 * สูงสุด 3 ครั้ง/identifier/15 นาที, ยืนยันผิดได้สูงสุด 5 ครั้งต่อโค้ดแล้ว
 * โค้ดถูกยกเลิก, ผลลัพธ์แบบ generic ไม่บอกใบ้การมีอยู่ของบัญชี
 */

import bcrypt from "bcryptjs";
import {
  saveOtp,
  loadOtp,
  updateOtp,
  clearOtp,
  incrementSendCount,
  sendWindowTtl,
  type OtpRecord,
} from "./store";
import { sendOtpMessage } from "./delivery";
import type { DeliveryMethod } from "@/lib/reset-password-schema";

// ─── Policy constants ────────────────────────────────────────────────────────

/** Code lifetime in seconds (5 minutes). */
/** (TH) อายุโค้ดเป็นวินาที (5 นาที) */
export const OTP_TTL_SECONDS = 5 * 60;
/** Max sends per identifier per window. */
/** (TH) จำนวนส่งสูงสุดต่อ identifier ต่อหน้าต่าง */
export const MAX_SENDS = 3;
/** Send rate-limit window in seconds (15 minutes). */
/** (TH) หน้าต่าง rate-limit การส่งเป็นวินาที (15 นาที) */
export const SEND_WINDOW_SECONDS = 15 * 60;
/** Max failed verify attempts before a code is burned. */
/** (TH) จำนวนยืนยันผิดสูงสุดก่อนเผาโค้ดทิ้ง */
export const MAX_VERIFY_ATTEMPTS = 5;
/** bcrypt cost factor. */
/** (TH) ค่า cost factor ของ bcrypt */
const BCRYPT_ROUNDS = 10;

// ─── Identifier normalization ────────────────────────────────────────────────

/**
 * Canonicalize an identifier so the same target maps to one storage key
 * regardless of formatting (email lowercased; phone reduced to `+digits`).
 *
 * (TH) ทำให้ identifier เป็นรูปแบบมาตรฐาน เพื่อให้เป้าหมายเดียวกัน map ไปคีย์
 * เดียว (อีเมลเป็นพิมพ์เล็ก; เบอร์เหลือ `+ตัวเลข`)
 */
export function normalizeIdentifier(
  method: DeliveryMethod,
  identifier: string
): string {
  const v = identifier.trim();
  if (method === "email") return v.toLowerCase();
  // Keep a single leading "+" then digits only.
  // คงเครื่องหมาย "+" นำหน้าตัวเดียวแล้วตามด้วยตัวเลขเท่านั้น
  const hasPlus = v.startsWith("+");
  const digits = v.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

// ─── Result types ────────────────────────────────────────────────────────────

/** Outcome of `issueOtp`. */
/** (TH) ผลของ `issueOtp` */
export type IssueResult =
  | { ok: true; expiresAt: number }
  | { ok: false; reason: "rate_limited"; retryAfter: number }
  | { ok: false; reason: "delivery_failed" };

/** Outcome of `verifyOtp`. */
/** (TH) ผลของ `verifyOtp` */
export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "invalid"; attemptsRemaining: number }
  | { ok: false; reason: "expired" }
  | { ok: false; reason: "locked" };

// ─── Operations ──────────────────────────────────────────────────────────────

/** Cryptographically-random zero-padded 6-digit code. */
/** (TH) โค้ด 6 หลักจากการสุ่มแบบ cryptographic เติมศูนย์ให้ครบ */
function generateCode(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] % 1_000_000).toString().padStart(6, "0");
}

/**
 * Issue and deliver a fresh OTP for `(method, identifier)`. Enforces the send
 * rate-limit first, then stores the bcrypt hash with a 5-minute TTL and hands
 * the raw code to the delivery layer. The raw code never leaves this function.
 *
 * (TH) ออกและส่ง OTP ใหม่สำหรับ `(method, identifier)` บังคับ rate-limit การ
 * ส่งก่อน แล้วเก็บ bcrypt hash พร้อม TTL 5 นาที และส่งโค้ดดิบให้ชั้น delivery
 * โค้ดดิบจะไม่ออกนอกฟังก์ชันนี้
 */
export async function issueOtp(
  method: DeliveryMethod,
  identifier: string
): Promise<IssueResult> {
  const key = normalizeIdentifier(method, identifier);

  // 1) Rate-limit: max MAX_SENDS sends per SEND_WINDOW_SECONDS.
  // 1) rate-limit: ส่งได้สูงสุด MAX_SENDS ครั้งต่อ SEND_WINDOW_SECONDS
  const sends = await incrementSendCount(key, SEND_WINDOW_SECONDS);
  if (sends > MAX_SENDS) {
    const retryAfter = await sendWindowTtl(key);
    return { ok: false, reason: "rate_limited", retryAfter };
  }

  // 2) Generate + hash + store with a 5-minute TTL.
  // 2) สร้าง + hash + เก็บพร้อม TTL 5 นาที
  const code = generateCode();
  const hash = await bcrypt.hash(code, BCRYPT_ROUNDS);
  const expiresAt = Date.now() + OTP_TTL_SECONDS * 1000;
  const record: OtpRecord = { hash, attempts: 0, expiresAt };
  await saveOtp(key, record, OTP_TTL_SECONDS);

  // 3) Deliver. On failure, surface a generic reason (no provider details).
  // 3) ส่ง ถ้าล้มเหลวคืนเหตุผลแบบ generic (ไม่บอกรายละเอียดผู้ให้บริการ)
  try {
    await sendOtpMessage(method, key, code);
  } catch {
    // Drop the stored code so a failed send can't be guessed against later.
    // ลบโค้ดที่เก็บไว้ เพื่อไม่ให้การส่งที่ล้มเหลวถูกเดาภายหลัง
    await clearOtp(key);
    return { ok: false, reason: "delivery_failed" };
  }

  return { ok: true, expiresAt };
}

/**
 * Verify a submitted code against the stored hash for `identifier`. Handles
 * expiry (no record), the attempt cap (burns the code at MAX_VERIFY_ATTEMPTS),
 * and success (consumes the code). Tries both normalized forms so the caller
 * doesn't need to know which channel issued the code.
 *
 * (TH) ตรวจโค้ดที่ส่งมากับ hash ที่เก็บไว้ของ `identifier` จัดการการหมดอายุ
 * (ไม่มี record), เพดานครั้ง (เผาโค้ดเมื่อถึง MAX_VERIFY_ATTEMPTS) และความ
 * สำเร็จ (ใช้โค้ดแล้วทิ้ง) ลองทั้งสองรูปแบบ normalize เพื่อให้ผู้เรียกไม่ต้อง
 * รู้ว่าโค้ดออกจากช่องไหน
 */
export async function verifyOtp(
  identifier: string,
  code: string
): Promise<VerifyResult> {
  // The code may have been issued via email or sms — both normalize the same
  // for email, but phone differs, so try the phone form too.
  // โค้ดอาจถูกออกผ่าน email หรือ sms — ลองทั้งสองรูปแบบ
  const candidates = Array.from(
    new Set([
      normalizeIdentifier("email", identifier),
      normalizeIdentifier("sms", identifier),
    ])
  );

  for (const key of candidates) {
    const record = await loadOtp(key);
    if (!record) continue;

    // Attempt cap reached → burn the code and lock this request.
    // ถึงเพดานครั้ง → เผาโค้ดและล็อกคำขอนี้
    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      await clearOtp(key);
      return { ok: false, reason: "locked" };
    }

    const match = await bcrypt.compare(code, record.hash);
    if (match) {
      // Success consumes the code (one OTP, one use).
      // สำเร็จแล้วใช้โค้ดทิ้ง (หนึ่ง OTP ต่อหนึ่งการใช้)
      await clearOtp(key);
      return { ok: true };
    }

    // Wrong code → bump attempts (without extending TTL).
    // โค้ดผิด → เพิ่มครั้ง (โดยไม่ต่ออายุ TTL)
    const attempts = record.attempts + 1;
    if (attempts >= MAX_VERIFY_ATTEMPTS) {
      await clearOtp(key);
      return { ok: false, reason: "locked" };
    }
    await updateOtp(key, { ...record, attempts });
    return {
      ok: false,
      reason: "invalid",
      attemptsRemaining: MAX_VERIFY_ATTEMPTS - attempts,
    };
  }

  // No live code for this identifier → treat as expired/invalid generically.
  // ไม่มีโค้ดที่ยังใช้ได้สำหรับ identifier นี้ → ถือว่าหมดอายุ/ไม่ถูกต้องแบบ generic
  return { ok: false, reason: "expired" };
}
