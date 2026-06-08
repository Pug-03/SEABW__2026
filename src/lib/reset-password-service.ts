/**
 * @file Mock "backend" for the Reset Password flow. In a real app every
 * function here would be a server endpoint — the security-sensitive logic
 * (OTP generation, expiry, attempt rate-limiting, account lookup) MUST live
 * server-side so a client can't bypass it. This module simulates that
 * behavior in the browser for the demo:
 *
 *   - OTPs are random 6-digit codes, logged to the console instead of sent.
 *   - OTPs expire after 5 minutes.
 *   - After 5 wrong attempts a challenge is locked for 15 minutes.
 *   - Identity verification NEVER reveals whether an account exists
 *     (generic responses only) to prevent account-enumeration attacks.
 *   - The rate-limit/lockout record is keyed by the identity (not the
 *     challenge) and persisted to localStorage, so resending a code or
 *     reloading the page can't reset the attempt counter.
 *
 * (TH) "แบ็กเอนด์" จำลองสำหรับ flow รีเซ็ตรหัสผ่าน ในระบบจริงทุกฟังก์ชันนี้
 * คือ endpoint ฝั่ง server — ตรรกะด้านความปลอดภัย (สร้าง OTP, หมดอายุ,
 * จำกัดจำนวนครั้ง, ค้นหาบัญชี) ต้องอยู่ฝั่ง server เพื่อไม่ให้ client ข้ามได้
 * โมดูลนี้จำลองพฤติกรรมนั้นในเบราว์เซอร์สำหรับเดโม:
 *   - OTP เป็นเลขสุ่ม 6 หลัก log ลง console แทนการส่งจริง
 *   - OTP หมดอายุใน 5 นาที
 *   - ใส่ผิด 5 ครั้งจะถูกล็อก 15 นาที
 *   - การยืนยันตัวตนจะไม่บอกว่ามีบัญชีจริงไหม (ตอบ generic) เพื่อกัน
 *     enumeration
 *   - บันทึก rate-limit/lockout ผูกกับตัวตน (ไม่ใช่ challenge) และเก็บใน
 *     localStorage เพื่อไม่ให้ส่งโค้ดใหม่หรือรีโหลดมารีเซ็ตตัวนับได้
 */

// ─── Tunables ────────────────────────────────────────────────────────────────

/** OTP lifetime — 5 minutes. */
/** (TH) อายุ OTP — 5 นาที */
export const OTP_TTL_MS = 5 * 60 * 1000;
/** Wrong attempts allowed before lockout. */
/** (TH) จำนวนครั้งที่ผิดได้ก่อนถูกล็อก */
export const MAX_ATTEMPTS = 5;
/** Lockout duration after exceeding `MAX_ATTEMPTS` — 15 minutes. */
/** (TH) ระยะเวลาล็อกเมื่อเกิน `MAX_ATTEMPTS` — 15 นาที */
export const LOCKOUT_MS = 15 * 60 * 1000;

/** localStorage key for the persisted per-identity rate-limit records. */
/** (TH) คีย์ localStorage สำหรับบันทึก rate-limit รายตัวตน */
const RL_STORAGE_KEY = "vibetrip-reset-ratelimit";

// ─── Types ───────────────────────────────────────────────────────────────────

/** An in-flight reset challenge (the issued OTP + its identity link). */
/** (TH) challenge รีเซ็ตที่กำลังดำเนินอยู่ (OTP ที่ออก + ลิงก์ตัวตน) */
interface Challenge {
  id: string;
  identityKey: string;
  otp: string;
  expiresAt: number;
  verified: boolean;
}

/** Persisted rate-limit record, keyed by identity. */
/** (TH) บันทึก rate-limit ที่เก็บถาวร ผูกกับตัวตน */
interface RateRecord {
  attempts: number;
  lockedUntil: number | null;
}

/** Result of `requestOtp` — intentionally generic (no account hints). */
/** (TH) ผลของ `requestOtp` — generic โดยตั้งใจ (ไม่บอกใบ้เรื่องบัญชี) */
export interface RequestOtpResult {
  challengeId: string;
  expiresAt: number;
}

/** Result of `verifyOtp`. On failure, never says why beyond the basics. */
/** (TH) ผลของ `verifyOtp` ตอนล้มเหลวจะไม่บอกเหตุผลเกินจำเป็น */
export type VerifyOtpResult =
  | { ok: true }
  | {
      ok: false;
      /** True when the challenge is currently locked out. */
      locked: boolean;
      /** Epoch ms the lock lifts (only when `locked`). */
      lockedUntil?: number;
      /** True when the code expired (resend required). */
      expired?: boolean;
      /** Attempts left before lockout (omitted when locked/expired). */
      attemptsRemaining?: number;
    };

// ─── In-memory challenge store ───────────────────────────────────────────────
// Challenges are ephemeral (cleared on reload) — only the rate-limit record
// is persisted, which is what actually needs to survive to be enforceable.
// challenge อยู่ในหน่วยความจำ (หายเมื่อรีโหลด) — มีแต่ record rate-limit ที่
// ถูกเก็บถาวร เพราะนั่นคือสิ่งที่ต้องคงอยู่จึงจะบังคับใช้ได้จริง

const challenges = new Map<string, Challenge>();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Cryptographically-random 6-digit OTP as a zero-padded string. */
/** (TH) OTP 6 หลักจากการสุ่มแบบ cryptographic เติมศูนย์หน้าให้ครบ */
function generateOtp(): string {
  // Prefer crypto for unpredictability; fall back to Math.random in SSR.
  // ใช้ crypto เพื่อความเดายาก ถ้าไม่มี (SSR) ค่อย fallback เป็น Math.random
  const cryptoObj =
    typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  let n: number;
  if (cryptoObj?.getRandomValues) {
    const buf = new Uint32Array(1);
    cryptoObj.getRandomValues(buf);
    n = buf[0] % 1_000_000;
  } else {
    n = Math.floor(Math.random() * 1_000_000);
  }
  return n.toString().padStart(6, "0");
}

/** Build the opaque identity key the rate-limit record hangs off of. */
/** (TH) สร้างคีย์ตัวตนแบบ opaque ที่ใช้ผูกกับ record rate-limit */
function identityKeyFor(nationalId: string, contact: string): string {
  return `${nationalId.trim()}|${contact.trim().toLowerCase()}`;
}

/** Read the persisted rate-limit map (browser only). */
/** (TH) อ่านแมป rate-limit ที่เก็บถาวร (เฉพาะฝั่งเบราว์เซอร์) */
function readRateMap(): Record<string, RateRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(RL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, RateRecord>) : {};
  } catch {
    return {};
  }
}

/** Persist the rate-limit map (browser only). */
/** (TH) บันทึกแมป rate-limit (เฉพาะฝั่งเบราว์เซอร์) */
function writeRateMap(map: Record<string, RateRecord>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RL_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* storage full / disabled — rate limiting silently degrades */
  }
}

/** Get this identity's rate record, resetting it if a lock has expired. */
/** (TH) ดึง record ของตัวตนนี้ และรีเซ็ตถ้าล็อกหมดเวลาแล้ว */
function getRateRecord(identityKey: string): RateRecord {
  const map = readRateMap();
  const rec = map[identityKey] ?? { attempts: 0, lockedUntil: null };
  // Auto-clear an expired lock so the user can try again after the window.
  // ล้างล็อกที่หมดเวลาอัตโนมัติ เพื่อให้ผู้ใช้ลองใหม่ได้หลังครบกำหนด
  if (rec.lockedUntil && Date.now() >= rec.lockedUntil) {
    rec.attempts = 0;
    rec.lockedUntil = null;
    map[identityKey] = rec;
    writeRateMap(map);
  }
  return rec;
}

/** Write back a single identity's rate record. */
/** (TH) เขียน record ของตัวตนเดียวกลับลง storage */
function saveRateRecord(identityKey: string, rec: RateRecord): void {
  const map = readRateMap();
  map[identityKey] = rec;
  writeRateMap(map);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Step 1 → 2. Issue an OTP for the given identity. Always succeeds with a
 * generic response regardless of whether the account exists, so an attacker
 * can't probe which national IDs are registered. The code is logged to the
 * console (mock delivery). Reuses the identity's existing lockout — sending
 * a fresh code does NOT clear an active lock or the attempt counter.
 *
 * (TH) ขั้น 1 → 2 ออก OTP สำหรับตัวตนนี้ สำเร็จเสมอด้วยคำตอบ generic ไม่ว่า
 * บัญชีจะมีจริงหรือไม่ เพื่อไม่ให้ผู้โจมตีเดาว่าเลขบัตรไหนลงทะเบียน โค้ดจะถูก
 * log ลง console (จำลองการส่ง) และจะคงล็อกเดิมของตัวตนไว้ — การส่งโค้ดใหม่
 * ไม่ล้างล็อกที่กำลังทำงานหรือตัวนับครั้ง
 */
export function requestOtp(
  nationalId: string,
  contact: string
): RequestOtpResult {
  const identityKey = identityKeyFor(nationalId, contact);
  const otp = generateOtp();
  const expiresAt = Date.now() + OTP_TTL_MS;
  const challengeId = `otp_${Math.random().toString(36).slice(2, 12)}`;

  challenges.set(challengeId, {
    id: challengeId,
    identityKey,
    otp,
    expiresAt,
    verified: false,
  });

  // MOCK DELIVERY — in production this is an SMS/email, never a console log.
  // จำลองการส่ง — ของจริงคือ SMS/อีเมล ไม่ใช่ console log
  // eslint-disable-next-line no-console
  console.log(
    `[VibeTrip mock OTP] code=${otp} (valid 5 min) → sent to account on file`
  );

  return { challengeId, expiresAt };
}

/**
 * Step 2. Verify a submitted OTP against the challenge. Enforces lockout,
 * expiry, and the attempt counter. Lockout/attempt state is shared across
 * resends via the identity-keyed rate record.
 *
 * (TH) ขั้น 2 ตรวจ OTP ที่ส่งมากับ challenge บังคับใช้ล็อก, การหมดอายุ และ
 * ตัวนับครั้ง สถานะล็อก/ครั้งจะใช้ร่วมกันข้ามการส่งโค้ดใหม่ผ่าน record ที่
 * ผูกกับตัวตน
 */
export function verifyOtp(challengeId: string, code: string): VerifyOtpResult {
  const challenge = challenges.get(challengeId);
  // No challenge → treat as a generic failure (don't leak that it's missing).
  // ไม่มี challenge → ถือเป็นล้มเหลว generic (ไม่บอกว่าไม่พบ)
  if (!challenge) {
    return { ok: false, locked: false, expired: true };
  }

  const rec = getRateRecord(challenge.identityKey);

  // Locked out? Reject before even looking at the code.
  // ถูกล็อกอยู่? ปฏิเสธก่อนดูโค้ดเลย
  if (rec.lockedUntil && Date.now() < rec.lockedUntil) {
    return { ok: false, locked: true, lockedUntil: rec.lockedUntil };
  }

  // Expired code → user must resend (counts as no attempt).
  // โค้ดหมดอายุ → ต้องส่งใหม่ (ไม่นับเป็นครั้งที่ผิด)
  if (Date.now() > challenge.expiresAt) {
    return { ok: false, locked: false, expired: true };
  }

  // Correct code → mark verified, clear the rate record.
  // โค้ดถูก → ทำเครื่องหมาย verified และล้าง record rate-limit
  if (code === challenge.otp) {
    challenge.verified = true;
    saveRateRecord(challenge.identityKey, { attempts: 0, lockedUntil: null });
    return { ok: true };
  }

  // Wrong code → increment attempts; lock once the limit is hit.
  // โค้ดผิด → เพิ่มตัวนับ; ล็อกเมื่อถึงเพดาน
  const attempts = rec.attempts + 1;
  if (attempts >= MAX_ATTEMPTS) {
    const lockedUntil = Date.now() + LOCKOUT_MS;
    saveRateRecord(challenge.identityKey, { attempts, lockedUntil });
    return { ok: false, locked: true, lockedUntil };
  }

  saveRateRecord(challenge.identityKey, { attempts, lockedUntil: null });
  return {
    ok: false,
    locked: false,
    attemptsRemaining: MAX_ATTEMPTS - attempts,
  };
}

/**
 * Inspect the current lockout for a challenge without spending an attempt —
 * used on mount so a returning/locked user immediately sees the locked UI.
 *
 * (TH) ตรวจสถานะล็อกของ challenge โดยไม่เสียครั้ง — ใช้ตอน mount เพื่อให้
 * ผู้ใช้ที่ถูกล็อกเห็นหน้า locked ทันที
 */
export function getLockState(
  challengeId: string
): { locked: boolean; lockedUntil?: number } {
  const challenge = challenges.get(challengeId);
  if (!challenge) return { locked: false };
  const rec = getRateRecord(challenge.identityKey);
  if (rec.lockedUntil && Date.now() < rec.lockedUntil) {
    return { locked: true, lockedUntil: rec.lockedUntil };
  }
  return { locked: false };
}

/**
 * Step 3. Finalize the reset. Only succeeds when the challenge exists, has
 * been verified, and hasn't expired. Consumes the challenge on success so the
 * same OTP can't be replayed. (Persisting the new password + invalidating
 * sessions is the caller's job — here we just gate it.)
 *
 * (TH) ขั้น 3 ปิดงานรีเซ็ต สำเร็จเฉพาะเมื่อ challenge มีอยู่ ผ่านการ verify
 * แล้ว และยังไม่หมดอายุ จะ "ใช้แล้วทิ้ง" challenge เมื่อสำเร็จเพื่อกันการ
 * เล่นซ้ำ OTP (การบันทึกรหัสใหม่ + ล้าง session เป็นหน้าที่ของ caller)
 */
export function resetPassword(
  challengeId: string,
  _newPassword: string
): { ok: boolean } {
  const challenge = challenges.get(challengeId);
  if (!challenge || !challenge.verified || Date.now() > challenge.expiresAt) {
    return { ok: false };
  }
  // Consume the challenge — one OTP, one reset.
  // ใช้ challenge แล้วทิ้ง — หนึ่ง OTP ต่อหนึ่งการรีเซ็ต
  challenges.delete(challengeId);
  return { ok: true };
}
