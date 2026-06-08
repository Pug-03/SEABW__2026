/**
 * @file OTP delivery — sends the 6-digit code over email (Nodemailer/SMTP) or
 * SMS (Twilio). Transports are created lazily and cached, and the SDKs are
 * imported dynamically so we only load whichever channel is actually used.
 *
 * Config comes from env vars:
 *   Email — SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *   SMS   — TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 *
 * When a channel is NOT configured we fall back to logging the code to the
 * server console in development (so the flow is testable without real
 * credentials), but THROW in production so a misconfigured deploy fails loudly
 * instead of silently dropping codes.
 *
 * (TH) การส่ง OTP — ส่งโค้ด 6 หลักทางอีเมล (Nodemailer/SMTP) หรือ SMS
 * (Twilio) สร้าง transport แบบ lazy + cache และ import SDK แบบ dynamic เพื่อ
 * โหลดเฉพาะช่องที่ใช้จริง ค่าคอนฟิกมาจาก env เมื่อช่องใดไม่ได้ตั้งค่า จะ
 * fallback เป็น log โค้ดลง console ตอน dev (ให้ทดสอบได้โดยไม่ต้องมี
 * credential จริง) แต่จะ throw ตอน production เพื่อให้ deploy ที่ตั้งค่าผิด
 * ล้มเหลวอย่างชัดเจน
 */

import type { Transporter } from "nodemailer";
import type { DeliveryMethod } from "@/lib/reset-password-schema";

/** True only when running a production build. */
/** (TH) จริงเฉพาะตอนรัน production build */
const isProd = process.env.NODE_ENV === "production";

// ─── Email (Nodemailer) ──────────────────────────────────────────────────────

// Cached SMTP transporter — one per process.
// cache SMTP transporter — หนึ่งตัวต่อโปรเซส
let mailer: Transporter | null = null;

/** True when every required SMTP_* var is present. */
/** (TH) จริงเมื่อมีตัวแปร SMTP_* ครบทุกตัว */
function smtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
  );
}

/**
 * Build (once) and return the Nodemailer transporter from SMTP_* env vars.
 *
 * (TH) สร้าง (ครั้งเดียว) และคืน Nodemailer transporter จาก env SMTP_*
 */
async function getMailer(): Promise<Transporter> {
  if (mailer) return mailer;
  const nodemailer = await import("nodemailer");
  const port = Number(process.env.SMTP_PORT);
  mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 is implicit TLS; other ports use STARTTLS.
    // พอร์ต 465 ใช้ TLS โดยปริยาย พอร์ตอื่นใช้ STARTTLS
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return mailer;
}

/**
 * Send the OTP email. Plain + HTML body; no sensitive data beyond the code
 * the user already requested.
 *
 * (TH) ส่งอีเมล OTP — มีทั้งข้อความล้วนและ HTML ไม่มีข้อมูลอ่อนไหวอื่น
 * นอกจากโค้ดที่ผู้ใช้ร้องขอเอง
 */
async function sendEmailOtp(to: string, code: string): Promise<void> {
  if (!smtpConfigured()) return devFallback("email", to, code);
  const transporter = await getMailer();
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "Your VibeTrip password reset code",
    text: `Your VibeTrip verification code is ${code}. It expires in 5 minutes. If you didn't request this, ignore this email.`,
    html: otpEmailHtml(code),
  });
}

/** Minimal branded HTML body for the OTP email. */
/** (TH) เนื้อหา HTML แบบเรียบของอีเมล OTP */
function otpEmailHtml(code: string): string {
  return `
  <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px">
    <h2 style="margin:0 0 8px">VibeTrip password reset</h2>
    <p style="color:#555;margin:0 0 16px">Use this code to reset your password. It expires in 5 minutes.</p>
    <div style="font-size:32px;font-weight:700;letter-spacing:8px;background:#f4f4f5;border-radius:12px;padding:16px;text-align:center">${code}</div>
    <p style="color:#999;font-size:12px;margin-top:16px">If you didn't request this, you can safely ignore this email.</p>
  </div>`;
}

// ─── SMS (Twilio) ────────────────────────────────────────────────────────────

/** True when every required TWILIO_* var is present. */
/** (TH) จริงเมื่อมีตัวแปร TWILIO_* ครบทุกตัว */
function twilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
  );
}

/**
 * Send the OTP via Twilio SMS. The Twilio SDK is imported lazily so it's only
 * loaded when an SMS is actually sent.
 *
 * (TH) ส่ง OTP ผ่าน Twilio SMS — import SDK แบบ lazy โหลดเฉพาะตอนส่ง SMS จริง
 */
async function sendSmsOtp(to: string, code: string): Promise<void> {
  if (!twilioConfigured()) return devFallback("sms", to, code);
  const { default: twilio } = await import("twilio");
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  await client.messages.create({
    to,
    from: process.env.TWILIO_PHONE_NUMBER,
    body: `Your VibeTrip verification code is ${code}. It expires in 5 minutes.`,
  });
}

// ─── Shared ──────────────────────────────────────────────────────────────────

/**
 * Dev-only fallback when a channel is unconfigured: log the code so the flow
 * is testable, but refuse to silently pretend-send in production.
 *
 * (TH) fallback สำหรับ dev เมื่อช่องยังไม่ตั้งค่า: log โค้ดเพื่อให้ทดสอบได้
 * แต่จะไม่แกล้งส่งเงียบ ๆ ใน production
 */
function devFallback(method: DeliveryMethod, to: string, code: string): void {
  if (isProd) {
    throw new Error(
      `OTP ${method} delivery is not configured (missing env vars).`
    );
  }
  // eslint-disable-next-line no-console
  console.log(
    `[VibeTrip OTP · ${method} · DEV] code=${code} → ${to} (valid 5 min; ${method} not configured, logging instead)`
  );
}

/**
 * Send `code` to `identifier` over the chosen `method`. Throws on delivery
 * failure (the caller maps that to a generic error — we never leak provider
 * details to the client).
 *
 * (TH) ส่ง `code` ไปยัง `identifier` ตามช่อง `method` ถ้าส่งล้มเหลวจะ throw
 * (ผู้เรียกจะแปลงเป็น error แบบ generic — เราไม่เผยรายละเอียดผู้ให้บริการ
 * ให้ client)
 */
export async function sendOtpMessage(
  method: DeliveryMethod,
  identifier: string,
  code: string
): Promise<void> {
  if (method === "email") return sendEmailOtp(identifier, code);
  return sendSmsOtp(identifier, code);
}
