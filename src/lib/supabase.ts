// This module is kept as a lightweight re-export target.
// The actual client is constructed lazily on the browser inside
// use-chat-realtime.ts via a dynamic import, so this file
// never calls createClient at module load time.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
