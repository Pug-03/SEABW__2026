/**
 * @file Alias route — `/welcome` redirects to `/` (the auth landing).
 * Kept for legacy onboarding emails.
 *
 * (TH) route alias — `/welcome` redirect ไป `/` (หน้าแรก)
 * เก็บไว้สำหรับ email onboarding รุ่นเก่า
 */
import { redirect } from "next/navigation";

/** Default export — runs on each request. */
/** (TH) default export — รันทุก request */
export default function WelcomeAliasPage() {
  redirect("/");
}
