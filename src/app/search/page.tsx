/**
 * @file Alias route — `/search` redirects to `/dashboard` where the
 * smart search bar lives.
 *
 * (TH) route alias — `/search` redirect ไป `/dashboard` ที่มีช่องค้นหา
 */
import { redirect } from "next/navigation";

/** Default export — runs on each request. */
/** (TH) default export — รันทุก request */
export default function SearchAliasPage() {
  redirect("/dashboard");
}
