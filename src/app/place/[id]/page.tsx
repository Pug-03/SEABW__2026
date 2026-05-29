/**
 * @file Alias route — `/place/[id]` redirects to `/dashboard`. Place
 * detail is shown as a modal on the dashboard, not its own page.
 *
 * (TH) route alias — `/place/[id]` redirect ไป `/dashboard` เพราะหน้า
 * detail ของสถานที่อยู่ใน modal บน dashboard ไม่ได้แยกเป็นหน้า
 */
import { redirect } from "next/navigation";

/** Default export — runs on each request. */
/** (TH) default export — รันทุก request */
export default function PlaceAliasPage() {
  redirect("/dashboard");
}
