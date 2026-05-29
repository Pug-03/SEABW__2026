/**
 * @file Alias route — `/register` redirects to the unified auth page
 * at `/`. Mirrors `/login` — both tabs live on the root page.
 *
 * (TH) route alias — `/register` redirect ไปหน้า auth ที่ `/` คู่กับ
 * `/login` (ทั้งสองแท็บอยู่หน้า root)
 */
import { redirect } from "next/navigation";

/** Default export — runs on each request. */
/** (TH) default export — รันทุก request */
export default function RegisterAliasPage() {
  redirect("/");
}
