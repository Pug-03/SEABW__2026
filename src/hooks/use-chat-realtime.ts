"use client";

import * as React from "react";
import type { ChatMessage } from "@/lib/types";
import { generateId } from "@/lib/utils";

export type RealtimeStatus = "disabled" | "connecting" | "connected" | "error";

// Read at module level but never call createClient here — that must only
// happen on the browser to avoid any server-side side effects.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ENABLED = !!(SUPABASE_URL && SUPABASE_KEY);

export function useChatRealtime(
  groupId: string,
  userId: string,
  userName: string,
  userAvatar?: string
) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  // Always start "disabled" so server and client render identically (no hydration mismatch).
  const [status, setStatus] = React.useState<RealtimeStatus>("disabled");

  React.useEffect(() => {
    if (!ENABLED) return;

    // Dynamic import keeps @supabase/supabase-js out of the SSR bundle entirely.
    let cancelled = false;
    let removeChannel = () => {};

    import("@supabase/supabase-js").then(({ createClient }) => {
      if (cancelled) return;

      const client = createClient(SUPABASE_URL!, SUPABASE_KEY!);
      setStatus("connecting");

      client
        .from("chat_messages")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })
        .then(({ data, error }) => {
          if (cancelled) return;
          if (error) { setStatus("error"); return; }
          if (data) setMessages(data.map(rowToMessage));
        });

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
            const msg = rowToMessage(payload.new as Record<string, unknown>);
            setMessages((prev) =>
              prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
            );
          }
        )
        .subscribe((s) => {
          if (cancelled) return;
          if (s === "SUBSCRIBED") setStatus("connected");
          else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED")
            setStatus("error");
        });

      removeChannel = () => client.removeChannel(channel);
    });

    return () => {
      cancelled = true;
      removeChannel();
    };
  }, [groupId]);

  const sendMessageRef = React.useRef({ groupId, userId, userName, userAvatar });
  React.useEffect(() => {
    sendMessageRef.current = { groupId, userId, userName, userAvatar };
  });

  const sendMessage = React.useCallback(
    async (
      content: string,
      kind: ChatMessage["kind"] = "text",
      extra: Partial<Pick<ChatMessage, "pollId" | "placeCard">> = {}
    ) => {
      if (!ENABLED) return;
      const { createClient } = await import("@supabase/supabase-js");
      const client = createClient(SUPABASE_URL!, SUPABASE_KEY!);
      const { groupId, userId, userName, userAvatar } = sendMessageRef.current;
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
