/**
 * @file Alias route — `/login` redirects to the unified auth page at
 * `/`. There's no separate login screen; both register and sign-in
 * live in the tabs on the root page.
 *
 * (TH) route alias — `/login` redirect ไปหน้า auth รวมที่ `/` เพราะไม่มี
 * หน้า login แยก ทั้งสมัครและเข้าระบบอยู่บนแท็บที่หน้า root
 */
import { redirect } from "next/navigation";

/** Default export — runs on each request. */
/** (TH) default export — รันทุก request */
export default function LoginAliasPage() {
  redirect("/");
}
