/**
 * @file Alias route — `/trips` redirects to `/trip`. There's no
 * separate "all trips" list page; the sidebar inside `/trip` already
 * shows every group.
 *
 * (TH) route alias — `/trips` redirect ไป `/trip` เพราะ sidebar ภายใน
 * `/trip` แสดงทุกกลุ่มอยู่แล้ว
 */
import { redirect } from "next/navigation";

/** Default export — runs on each request. */
/** (TH) default export — รันทุก request */
export default function TripsAliasPage() {
  redirect("/trip");
}
