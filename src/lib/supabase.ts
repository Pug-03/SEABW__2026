/**
 * @file Supabase configuration constants.
 *
 * This file deliberately does NOT create a Supabase client at module load
 * time. Reasons:
 *   1. The Supabase JS SDK is only needed in one place (the realtime chat
 *      hook), so eagerly bundling it would inflate every page that imports
 *      types from `lib/`.
 *   2. We want the client to live in browser code only — `createClient`
 *      is called via a dynamic `import("@supabase/supabase-js")` inside
 *      `src/hooks/use-chat-realtime.ts`.
 *
 * If env vars are missing, the constants below become empty strings; the
 * realtime hook treats that as "Supabase disabled" and falls back to a
 * purely local Zustand-backed chat.
 */

/** Project URL, e.g. `https://xyz.supabase.co`. Empty string when unset. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/** Anon public key. Empty string when unset (disables realtime features). */
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
