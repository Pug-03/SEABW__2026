/**
 * @file `useStoreHydrated` — wait until Zustand's `persist` middleware has
 * rehydrated state from localStorage before reading it on the client.
 *
 * Why: any component that renders Zustand state on first paint will produce
 * an SSR/CSR mismatch because the server has no localStorage. The fix is to
 * render a neutral placeholder until this hook returns `true`.
 *
 * (TH) ฮุกสำหรับรอให้ Zustand `persist` ดึงข้อมูลจาก localStorage เสร็จก่อน
 * แล้วค่อย render ข้อมูลผู้ใช้ — กันปัญหา hydration mismatch ระหว่าง SSR กับ CSR
 * ของ Next.js ครับ
 */

"use client";

import * as React from "react";
import { useVibeStore } from "@/lib/store";

/**
 * Returns `true` once `useVibeStore` has finished loading its persisted
 * state from localStorage. Returns `false` during SSR and on the very
 * first client paint (before hydration completes).
 *
 * Usage:
 *   const hydrated = useStoreHydrated();
 *   if (!hydrated) return <Splash />;
 *
 * (TH) คืนค่า `true` เมื่อ store โหลดข้อมูลจาก localStorage เสร็จแล้ว
 * ระหว่าง SSR หรือก่อน hydrate เสร็จจะคืน `false` — ให้ใช้แสดง Splash หรือ
 * skeleton ระหว่างรอ เพื่อหลีกเลี่ยง mismatch ระหว่างฝั่ง server กับ client
 */
export function useStoreHydrated(): boolean {
  // Local boolean — false on the server and on first client paint.
  // ตัวแปร local: ค่าเริ่มเป็น false ทั้งฝั่ง server และเฟรมแรกของฝั่ง client
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    // Fast path: persist middleware already finished before this effect ran.
    // กรณี hydrate เสร็จไปแล้วก่อน effect นี้รัน — set true ทันที
    if (useVibeStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    // Otherwise subscribe to the one-shot "finished hydration" callback.
    // ถ้ายังไม่เสร็จ ให้ subscribe ฟัง callback ตอน hydrate เสร็จครั้งเดียว
    const unsub = useVibeStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    // Clean up the subscription if the consumer unmounts mid-hydration.
    // ยกเลิก subscription ถ้า component ถูก unmount ระหว่าง hydrate
    return () => {
      unsub?.();
    };
  }, []);

  return hydrated;
}
