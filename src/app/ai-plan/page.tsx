/**
 * @file Alias route — server-side redirects `/ai-plan` → `/trip`.
 * Kept around so any older shared links keep working.
 *
 * (TH) route alias — server-side redirect `/ai-plan` → `/trip`
 * เก็บไว้เพื่อให้ลิงก์เก่ายังใช้งานได้
 */
import { redirect } from "next/navigation";

/** Default export — Next.js calls this on each request. */
/** (TH) default export — Next.js เรียกทุก request */
export default function AiPlanAliasPage() {
  redirect("/trip");
}
