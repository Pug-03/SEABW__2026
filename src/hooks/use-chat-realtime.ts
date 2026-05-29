/**
 * @file `useChatRealtime` — subscribes a React component to a live
 * Supabase `chat_messages` table for one trip group, exposing the
 * loaded messages plus an async `sendMessage` writer.
 *
 * Behavior:
 *  - When Supabase env vars are unset, the hook is a no-op and returns
 *    `enabled: false` — callers fall back to local-only chat from the
 *    Zustand store.
 *  - The Supabase JS client is dynamically imported on mount, keeping
 *    it out of the SSR bundle.
 *  - One realtime channel per group; cleaned up automatically on unmount.
 *
 * (TH) ฮุก subscribe ข้อความแชทจาก Supabase แบบ realtime สำหรับกลุ่มทริปหนึ่ง
 * ถ้าไม่มี env Supabase จะคืน `enabled: false` ให้ caller ใช้ Zustand แทน
 * นำเข้า SDK แบบ dynamic เพื่อไม่ติด SSR bundle และปลด subscribe ตอน unmount
 * โดยอัตโนมัติ
 */

"use client";

import * as React from "react";
import type { ChatMessage } from "@/lib/types";
import { generateId } from "@/lib/utils";

// ─── Public types ────────────────────────────────────────────────────────────

/**
 * Lifecycle of the realtime connection. `disabled` means Supabase env
 * vars are not configured; consumers should fall back to local chat.
 *
 * (TH) สถานะการเชื่อมต่อ realtime — ถ้า `disabled` แปลว่าไม่ได้ตั้งค่า
 * env Supabase ให้ consumer ถอยไปใช้ chat แบบ local แทน
 */
export type RealtimeStatus = "disabled" | "connecting" | "connected" | "error";

// ─── Module-level config ─────────────────────────────────────────────────────
// Read env at module load but DO NOT call createClient here — that must
// happen on the browser only (see the dynamic import inside the effect).
// อ่าน env ตอนโหลดโมดูล แต่ห้ามเรียก createClient ที่นี่ — ต้องเรียกตอน runtime
// ฝั่ง browser เท่านั้นเพื่อไม่ให้ติด SSR bundle

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when both env vars are present and realtime mode should activate. */
/** (TH) จริงเมื่อมี env ครบ — ใช้เป็นสวิตช์เปิด/ปิดฟีเจอร์ realtime */
const ENABLED = !!(SUPABASE_URL && SUPABASE_KEY);

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Subscribe to live chat for a specific trip group.
 *
 * Returns:
 *   - `messages`    — chronological array of messages from Supabase.
 *   - `status`      — connection lifecycle (see `RealtimeStatus`).
 *   - `sendMessage` — async writer that inserts a row into `chat_messages`.
 *   - `enabled`     — false when Supabase isn't configured.
 *
 * (TH) ใช้ subscribe ข้อความแชทแบบสด ๆ ของกลุ่มเดียว คืนค่ารายการข้อความ,
 * สถานะการเชื่อมต่อ, ฟังก์ชันส่งข้อความ และธง `enabled` สำหรับใช้ตัดสินใจ
 * ว่าจะใช้โหมด realtime หรือ local
 */
export function useChatRealtime(
  groupId: string,
  userId: string,
  userName: string,
  userAvatar?: string
) {
  // Messages mirror what we've received via initial fetch + INSERT events.
  // เก็บข้อความที่ได้จาก initial fetch + event INSERT ของ Supabase
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);

  // Always start "disabled" so server and client render identically
  // (hydration would mismatch otherwise).
  // เริ่มเป็น "disabled" เสมอ เพื่อไม่ให้ server กับ client render ต่างกัน
  // ตอน hydrate
  const [status, setStatus] = React.useState<RealtimeStatus>("disabled");

  React.useEffect(() => {
    // Bail out cleanly when Supabase isn't configured.
    // ออกจาก effect ทันทีถ้าไม่ได้ตั้งค่า Supabase ไว้
    if (!ENABLED) return;

    // Cancellation flag for the async dynamic import + initial fetch.
    // ธงสำหรับยกเลิก effect ตอน async (dynamic import, initial fetch) ยังไม่จบ
    let cancelled = false;
    // Placeholder cleanup; reassigned once the channel exists.
    // ฟังก์ชัน cleanup เริ่มเป็น no-op แล้วถูกแทนเมื่อ channel ถูกสร้างจริง
    let removeChannel = () => {};

    // Dynamic import keeps @supabase/supabase-js out of the SSR bundle entirely.
    // นำเข้า SDK แบบ dynamic เพื่อไม่ติด SSR bundle ของ Next.js
    import("@supabase/supabase-js").then(({ createClient }) => {
      if (cancelled) return;

      // Construct the Supabase client lazily on the browser.
      // สร้าง client บน browser เท่านั้น
      const client = createClient(SUPABASE_URL!, SUPABASE_KEY!);
      setStatus("connecting");

      // Initial fetch of historical messages for this group.
      // โหลดข้อความเก่าทั้งหมดของกลุ่มเรียงตามเวลา
      client
        .from("chat_messages")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })
        .then(({ data, error }) => {
          if (cancelled) return;
          if (error) {
            // Initial load failed — surface error state to consumers.
            // โหลดเริ่มต้นล้มเหลว — ส่งสัญญาณ error ให้ consumer
            setStatus("error");
            return;
          }
          if (data) setMessages(data.map(rowToMessage));
        });

      // Subscribe to INSERTs scoped to this group only (server-side filter).
      // subscribe เฉพาะ INSERT ของ group นี้เท่านั้น (กรองที่ฝั่ง server)
      const channel = client
        .channel(`chat_messages:${groupId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `group_id=eq.${groupId}`,
          },
          (payload) => {
            if (cancelled) return;
            // Convert the snake_case Postgres row → camelCase domain object.
            // แปลงคอลัมน์ snake_case ของ Postgres → camelCase ของฝั่ง app
            const msg = rowToMessage(payload.new as Record<string, unknown>);
            // De-duplicate in case the optimistic insert + realtime event
            // both arrive (we identify by stable `id`).
            // ป้องกันข้อความซ้ำกรณี optimistic insert มาคู่กับ event จริง
            setMessages((prev) =>
              prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
            );
          }
        )
        .subscribe((s) => {
          if (cancelled) return;
          // Map Supabase channel status → our RealtimeStatus enum.
          // แปลสถานะของ Supabase channel เป็น RealtimeStatus ของเรา
          if (s === "SUBSCRIBED") setStatus("connected");
          else if (
            s === "CHANNEL_ERROR" ||
            s === "TIMED_OUT" ||
            s === "CLOSED"
          )
            setStatus("error");
        });

      // Capture an async-safe channel disposer for the cleanup function.
      // เก็บฟังก์ชันปิด channel ไว้ใช้ใน cleanup
      removeChannel = () => client.removeChannel(channel);
    });

    // Cleanup: cancel pending async work and remove the realtime channel.
    // cleanup: ยกเลิก async ที่ค้าง และถอด channel realtime ออก
    return () => {
      cancelled = true;
      removeChannel();
    };
  }, [groupId]);

  // Keep the latest identity fields in a ref so `sendMessage` (memoized
  // with no deps) always reads the freshest values without re-binding.
  // เก็บค่าล่าสุดของ identity ไว้ใน ref เพื่อไม่ต้อง re-bind `sendMessage`
  // ทุกครั้งที่ props เปลี่ยน
  const sendMessageRef = React.useRef({ groupId, userId, userName, userAvatar });
  React.useEffect(() => {
    sendMessageRef.current = { groupId, userId, userName, userAvatar };
  });

  /**
   * Insert a new message row into Supabase. The realtime subscription
   * will fire an INSERT event and append the message to local state.
   *
   * (TH) เพิ่มข้อความเข้า Supabase — subscription จะส่ง INSERT กลับมาแล้ว
   * เติมเข้า state เอง ไม่ต้อง update local โดยตรง
   */
  const sendMessage = React.useCallback(
    async (
      content: string,
      kind: ChatMessage["kind"] = "text",
      extra: Partial<Pick<ChatMessage, "pollId" | "placeCard">> = {}
    ) => {
      if (!ENABLED) return;
      // Re-create the client inside the callback to avoid carrying a
      // closure that might outlive the effect.
      // สร้าง client ใหม่ภายใน callback เพื่อไม่ผูกตัวที่อยู่นอกอายุ effect
      const { createClient } = await import("@supabase/supabase-js");
      const client = createClient(SUPABASE_URL!, SUPABASE_KEY!);
      const { groupId, userId, userName, userAvatar } = sendMessageRef.current;
      // Note: columns use snake_case to match the Postgres schema.
      // หมายเหตุ: คอลัมน์เป็น snake_case ตาม schema ของ Postgres
      await client.from("chat_messages").insert({
        id: generateId("msg"),
        group_id: groupId,
        author_id: userId,
        author_name: userName,
        author_avatar: userAvatar ?? null,
        content,
        kind,
        poll_id: extra.pollId ?? null,
        place_card: extra.placeCard ?? null,
      });
    },
    []
  );

  return { messages, status, sendMessage, enabled: ENABLED };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert a raw Postgres row (snake_case, untyped) into our typed
 * `ChatMessage` shape. Centralized so the schema is documented in one
 * place — update this whenever you add a column.
 *
 * (TH) แปลง row ดิบจาก Postgres (snake_case, ไม่มี type) เป็น `ChatMessage`
 * รวมไว้ที่เดียวเพื่อแก้ schema ครั้งเดียวเวลามีคอลัมน์ใหม่
 */
function rowToMessage(row: Record<string, unknown>): ChatMessage {
  return {
    id: row.id as string,
    groupId: row.group_id as string,
    authorId: row.author_id as string,
    authorName: row.author_name as string,
    authorAvatar: (row.author_avatar as string) ?? undefined,
    content: row.content as string,
    kind: row.kind as ChatMessage["kind"],
    pollId: (row.poll_id as string) ?? undefined,
    placeCard: row.place_card as ChatMessage["placeCard"],
    createdAt: row.created_at as string,
  };
}
