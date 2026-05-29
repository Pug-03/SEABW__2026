/**
 * @file Alias route — `/trips/[id]` redirects to `/trip`. The trip
 * page picks up the active group from the store; no per-id deep-link
 * is needed yet.
 *
 * (TH) route alias — `/trips/[id]` redirect ไป `/trip` เพราะหน้านี้
 * อ่านกลุ่ม active จาก store ยังไม่จำเป็นต้อง deep-link ราย id
 */
import { redirect } from "next/navigation";

/** Default export — runs on each request. */
/** (TH) default export — รันทุก request */
export default function TripDetailAliasPage() {
  redirect("/trip");
}
