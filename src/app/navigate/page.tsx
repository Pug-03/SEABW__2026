/**
 * @file Alias route — `/navigate` redirects to `/trip` where the map
 * widget lives. Kept for older deep links.
 *
 * (TH) route alias — `/navigate` redirect ไป `/trip` ที่มีแผนที่
 * เก็บไว้สำหรับลิงก์เก่า
 */
import { redirect } from "next/navigation";

/** Default export — runs on each request. */
/** (TH) default export — รันทุก request */
export default function NavigateAliasPage() {
  redirect("/trip");
}
