/**
 * @file Root layout for the Next.js App Router. Wraps every page with
 * the `<ThemeProvider>` (light/dark), a fixed background gradient
 * mesh, and the global font/background styles.
 *
 * (TH) Layout หลักของ Next.js App Router — ห่อทุกหน้าด้วย ThemeProvider
 * (light/dark), gradient mesh พื้นหลังแบบ fixed, และสไตล์ฟอนต์/พื้นหลังกลาง
 */

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";

/** Document `<title>` and `<meta name="description">`. */
/** (TH) ใส่ `<title>` กับ description ของหน้า */
export const metadata: Metadata = {
  title: "VibeTrip — Travel with your crew",
  description:
    "VibeTrip is the AI-powered travel companion for groups. Plan, split, vibe.",
};

/**
 * Viewport theme-color — tells iOS/Android browsers what color to
 * paint the address bar in light vs dark mode.
 *
 * (TH) theme-color ของ viewport — บอกบราวเซอร์ iOS/Android ว่าให้ใช้สี
 * อะไรกับ address bar ใน light/dark
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0c" },
  ],
};

/**
 * The root layout component. Wraps the page tree with the theme
 * provider and a decorative gradient mesh.
 *
 * (TH) คอมโพเนนต์ root layout — ห่อ tree ของหน้าด้วย ThemeProvider และ
 * gradient mesh ตกแต่ง
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <html> root — `suppressHydrationWarning` keeps Next quiet about
    // the `class="dark"` toggle that the theme provider applies post-hydration.
    // <html> root — suppressHydrationWarning เพื่อกัน warning จาก class="dark"
    // ที่ theme provider จะใส่หลัง hydrate
    <html lang="en" suppressHydrationWarning>
      {/* <body> with the brand font + base background. */}
      {/* <body> ใส่ฟอนต์แบรนด์ + พื้นหลังหลัก */}
      <body className="min-h-screen bg-background font-sans">
        {/* Isolated stacking context so the gradient mesh sits behind everything. */}
        {/* stacking context แยก เพื่อให้ gradient mesh อยู่ใต้ทุกอย่าง */}
        <div className="relative isolate min-h-screen">
          {/* Decorative full-viewport gradient (faded out in dark mode). */}
          {/* gradient ตกแต่งเต็ม viewport (จางลงใน dark mode) */}
          <div className="fixed inset-0 -z-10 gradient-mesh opacity-60 dark:opacity-30" />
          {/* Theme context wrapping the entire tree. */}
          {/* context ของธีมที่ห่อ tree ทั้งหมด */}
          <ThemeProvider>{children}</ThemeProvider>
        </div>
      </body>
    </html>
  );
}
