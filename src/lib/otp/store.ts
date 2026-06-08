/**
 * @file Server-side OTP storage + rate-limit counters with a 5-minute TTL.
 *
 * Two backends, selected at runtime:
 *   - Redis (via `ioredis`) when `REDIS_URL` is set — the production path.
 *     TTLs and atomic `INCR` are handled by Redis itself, so the counters
 *     stay correct across multiple serverless instances.
 *   - An in-memory `Map` fallback when `REDIS_URL` is unset — for local dev
 *     ONLY. It does NOT share state across processes/instances, so rate
 *     limiting and OTP lookups break under horizontal scaling. Never ship a
 *     production deployment without `REDIS_URL`.
 *
 * Nothing here ever stores or returns a raw OTP — only the bcrypt hash and a
 * small amount of metadata live in the store.
 *
 * (TH) ที่เก็บ OTP ฝั่งเซิร์ฟเวอร์ + ตัวนับ rate-limit อายุ 5 นาที มีสอง
 * backend เลือกตอนรันไทม์:
 *   - Redis (ผ่าน `ioredis`) เมื่อมี `REDIS_URL` — เส้นทางสำหรับ production
 *     TTL และ `INCR` แบบ atomic จัดการโดย Redis เอง ตัวนับจึงถูกต้องข้าม
 *     หลาย instance
 *   - fallback เป็น `Map` ในหน่วยความจำเมื่อไม่มี `REDIS_URL` — สำหรับ dev
 *     เท่านั้น ไม่แชร์ข้ามโปรเซส/instance อย่าใช้ใน production โดยไม่มี
 *     `REDIS_URL`
 * ไม่มีจุดใดเก็บหรือคืน OTP ดิบ — เก็บเฉพาะ bcrypt hash กับ metadata เล็กน้อย
 */

import type { Redis } from "ioredis";

/** What we persist per identifier alongside the hashed OTP. */
/** (TH) ข้อมูลที่เก็บต่อ identifier คู่กับ OTP ที่ถูก hash */
export interface OtpRecord {
  /** bcrypt hash of the 6-digit code — never the code itself. */
  /** (TH) bcrypt hash ของโค้ด 6 หลัก — ไม่ใช่ตัวโค้ด */
  hash: string;
  /** Failed verification attempts so far. */
  /** (TH) จำนวนครั้งที่ยืนยันผิดจนถึงตอนนี้ */
  attempts: number;
  /** Epoch ms when the code expires (mirror of the store TTL). */
  /** (TH) เวลา (epoch ms) ที่โค้ดหมดอายุ (สะท้อน TTL ของ store) */
  expiresAt: number;
}

// ─── Key helpers ─────────────────────────────────────────────────────────────

/** Redis key for the stored OTP record of `identifier`. */
/** (TH) คีย์ Redis สำหรับ record OTP ของ `identifier` */
const otpKey = (identifier: string) => `otp:code:${identifier}`;
/** Redis key for the send-attempt counter of `identifier`. */
/** (TH) คีย์ Redis สำหรับตัวนับการส่งของ `identifier` */
const sendKey = (identifier: string) => `otp:send:${identifier}`;

// ─── Redis backend (lazy) ────────────────────────────────────────────────────

// Cached client so we open exactly one connection per process.
// cache client เพื่อเปิดการเชื่อมต่อเดียวต่อโปรเซส
let redisClient: Redis | null = null;
let redisInitTried = false;

/**
 * Resolve the Redis client, or `null` when `REDIS_URL` is unset (dev mode).
 * The `ioredis` module is imported dynamically so it isn't bundled/loaded
 * when running without Redis.
 *
 * (TH) คืน Redis client หรือ `null` เมื่อไม่มี `REDIS_URL` (โหมด dev) โมดูล
 * `ioredis` ถูก import แบบ dynamic จึงไม่ถูกโหลดเมื่อรันโดยไม่มี Redis
 */
async function getRedis(): Promise<Redis | null> {
  if (!process.env.REDIS_URL) return null;
  if (redisClient) return redisClient;
  if (redisInitTried) return redisClient;
  redisInitTried = true;
  const { default: Redis } = await import("ioredis");
  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    lazyConnect: false,
  });
  return redisClient;
}

// ─── In-memory backend (dev fallback) ────────────────────────────────────────
// The maps are pinned to `globalThis` so they survive HMR AND are shared across
// the separate per-route module bundles Next.js builds — otherwise `send-otp`
// and `verify-otp` would each get their own empty Map. This still does NOT span
// multiple processes/serverless instances; that's what `REDIS_URL` is for.
// แมปถูกผูกกับ `globalThis` เพื่อให้อยู่รอด HMR และแชร์ข้าม bundle ราย route ที่
// Next สร้างแยกกัน มิฉะนั้น `send-otp` กับ `verify-otp` จะได้ Map ว่างของใครของ
// มัน อย่างไรก็ตามยังไม่ข้ามหลายโปรเซส/instance — นั่นคือเหตุผลที่ต้องมี
// `REDIS_URL`

/** Shape of the global dev-store singleton. */
/** (TH) รูปร่างของ singleton dev-store แบบ global */
interface MemoryStore {
  otp: Map<string, { record: OtpRecord; expiresAt: number }>;
  send: Map<string, { count: number; expiresAt: number }>;
}

const globalForOtp = globalThis as typeof globalThis & {
  __vibetripOtpStore?: MemoryStore;
};

const memory: MemoryStore =
  globalForOtp.__vibetripOtpStore ??
  (globalForOtp.__vibetripOtpStore = { otp: new Map(), send: new Map() });

const memoryOtp = memory.otp;
const memorySend = memory.send;

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Store (or overwrite) the OTP record for `identifier` with a TTL.
 *
 * (TH) เก็บ (หรือเขียนทับ) record OTP ของ `identifier` พร้อม TTL
 */
export async function saveOtp(
  identifier: string,
  record: OtpRecord,
  ttlSeconds: number
): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    await redis.set(otpKey(identifier), JSON.stringify(record), "EX", ttlSeconds);
    return;
  }
  memoryOtp.set(otpKey(identifier), {
    record,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Load the OTP record for `identifier`, or `null` if missing/expired.
 *
 * (TH) อ่าน record OTP ของ `identifier` หรือ `null` ถ้าไม่มี/หมดอายุ
 */
export async function loadOtp(identifier: string): Promise<OtpRecord | null> {
  const redis = await getRedis();
  if (redis) {
    const raw = await redis.get(otpKey(identifier));
    return raw ? (JSON.parse(raw) as OtpRecord) : null;
  }
  const entry = memoryOtp.get(otpKey(identifier));
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    memoryOtp.delete(otpKey(identifier));
    return null;
  }
  return entry.record;
}

/**
 * Persist an updated record (e.g. bumped attempt count) WITHOUT extending
 * the original expiry — the code's 5-minute lifetime must stay fixed.
 *
 * (TH) บันทึก record ที่อัปเดต (เช่นเพิ่มจำนวนครั้ง) โดยไม่ต่ออายุเดิม —
 * อายุ 5 นาทีของโค้ดต้องคงที่
 */
export async function updateOtp(
  identifier: string,
  record: OtpRecord
): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    // KEEPTTL preserves the remaining TTL set by `saveOtp`.
    // KEEPTTL คงเวลา TTL ที่เหลือซึ่งตั้งไว้โดย `saveOtp`
    await redis.set(otpKey(identifier), JSON.stringify(record), "KEEPTTL");
    return;
  }
  const entry = memoryOtp.get(otpKey(identifier));
  if (entry) entry.record = record;
}

/**
 * Delete the OTP record (used on success or when attempts are exhausted).
 *
 * (TH) ลบ record OTP (ใช้เมื่อสำเร็จหรือเมื่อใช้ครบจำนวนครั้ง)
 */
export async function clearOtp(identifier: string): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    await redis.del(otpKey(identifier));
    return;
  }
  memoryOtp.delete(otpKey(identifier));
}

/**
 * Atomically increment `identifier`'s send counter and return the new count.
 * The counter window is `windowSeconds` long; the first increment sets the
 * TTL so the window slides forward only after it fully expires.
 *
 * (TH) เพิ่มตัวนับการส่งของ `identifier` แบบ atomic แล้วคืนค่าใหม่ หน้าต่าง
 * ตัวนับยาว `windowSeconds` การเพิ่มครั้งแรกจะตั้ง TTL หน้าต่างจะเลื่อนก็
 * ต่อเมื่อหมดอายุเต็มแล้วเท่านั้น
 */
export async function incrementSendCount(
  identifier: string,
  windowSeconds: number
): Promise<number> {
  const redis = await getRedis();
  if (redis) {
    const count = await redis.incr(sendKey(identifier));
    // Only set the expiry on the first hit so the window doesn't reset.
    // ตั้งหมดอายุเฉพาะครั้งแรก เพื่อไม่ให้หน้าต่างรีเซ็ต
    if (count === 1) await redis.expire(sendKey(identifier), windowSeconds);
    return count;
  }
  const now = Date.now();
  const entry = memorySend.get(sendKey(identifier));
  if (!entry || now >= entry.expiresAt) {
    memorySend.set(sendKey(identifier), {
      count: 1,
      expiresAt: now + windowSeconds * 1000,
    });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

/**
 * Seconds remaining in `identifier`'s current send-rate window (0 if none).
 * Used to populate `Retry-After` when a caller is rate-limited.
 *
 * (TH) วินาทีที่เหลือในหน้าต่าง rate ของ `identifier` (0 ถ้าไม่มี) ใช้เติม
 * `Retry-After` เมื่อผู้เรียกถูกจำกัดอัตรา
 */
export async function sendWindowTtl(identifier: string): Promise<number> {
  const redis = await getRedis();
  if (redis) {
    const ttl = await redis.ttl(sendKey(identifier));
    return ttl > 0 ? ttl : 0;
  }
  const entry = memorySend.get(sendKey(identifier));
  if (!entry) return 0;
  return Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
}
