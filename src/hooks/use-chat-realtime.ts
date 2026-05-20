"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase";
import type { ChatMessage } from "@/lib/types";
import { generateId } from "@/lib/utils";

export type RealtimeStatus = "disabled" | "connecting" | "connected" | "error";

export function useChatRealtime(
  groupId: string,
  userId: string,
  userName: string,
  userAvatar?: string
) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [status, setStatus] = React.useState<RealtimeStatus>(
    supabase ? "connecting" : "disabled"
  );

  React.useEffect(() => {
    if (!supabase) return;

    supabase
      .from("chat_messages")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) { setStatus("error"); return; }
        if (data) setMessages(data.map(rowToMessage));
      });

    const channel = supabase
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
          const msg = rowToMessage(payload.new as Record<string, unknown>);
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
          );
        }
      )
      .subscribe((s) => {
        if (s === "SUBSCRIBED") setStatus("connected");
        else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") setStatus("error");
      });

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [groupId]);

  const sendMessage = React.useCallback(
    async (
      content: string,
      kind: ChatMessage["kind"] = "text",
      extra: Partial<Pick<ChatMessage, "pollId" | "placeCard">> = {}
    ) => {
      if (!supabase) return;
      await supabase.from("chat_messages").insert({
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
    [groupId, userId, userName, userAvatar]
  );

  return { messages, status, sendMessage, enabled: !!supabase };
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
