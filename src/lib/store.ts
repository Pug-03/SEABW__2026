/**
 * @file Global client-side store (Zustand) for the VibeTrip app.
 *
 * This is the single source of truth for everything that persists between
 * page navigations and reloads:
 *   - The signed-in user.
 *   - All trip groups the user belongs to (and which one is "active").
 *   - Photos uploaded to the shared photo wall.
 *   - A demo-data seeded flag so we only inject the Phuket demo once.
 *
 * Persistence: `zustand/middleware/persist` writes the entire state into
 * `localStorage` under the key `"vibetrip-store"`. Because that runs only
 * in the browser, server components must NOT call `useVibeStore` directly
 * during render; pages that read store data are marked `"use client"` and
 * guarded by the `useStoreHydrated` hook to avoid SSR hydration mismatches.
 *
 * File layout:
 *   1. Demo-trip constants and seed builders (Phuket group).
 *   2. State + action interface (`VibeState`).
 *   3. The actual store: state initializers + every action.
 */

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ChatMessage,
  Expense,
  PhotoMemory,
  PlaceCard,
  Poll,
  Preference,
  TripGroup,
  User,
} from "./types";
import { generateId } from "./utils";

// ─── 1. Demo trip constants ──────────────────────────────────────────────────
// Stable IDs so the Phuket demo group can't be duplicated by `createDemoGroup`.

const DEMO_GROUP_ID = "grp_phuket_demo_2026";
const DEMO_ALEX = { id: "usr_demo_alex", name: "Alex" };
const DEMO_SARA = { id: "usr_demo_sara", name: "Sara" };
const DEMO_MIKE = { id: "usr_demo_mike", name: "Mike" };

/**
 * Build an ISO timestamp anchored to 10:30 AM Bangkok time on
 * 2026-07-12 (UTC+7 → 03:30 UTC), offset by `minuteOffset` minutes.
 *
 * Used so the demo chat messages have a believable, monotonically
 * increasing timestamp sequence regardless of when the demo is seeded.
 */
function demoTs(minuteOffset: number, secondOffset = 0): string {
  return new Date(
    Date.UTC(2026, 6, 12, 3, 30 + minuteOffset, secondOffset)
  ).toISOString();
}

/**
 * Build the pre-populated chat for the Phuket demo group.
 *
 * The current user is woven into the conversation (`dmsg_07`, `dmsg_08`)
 * so the chat feels personal as soon as the demo is opened. Other authors
 * are the three fixed demo personas.
 */
function buildDemoMessages(userId: string, userName: string): ChatMessage[] {
  // A shared "destination" place card that one of the demo users posts.
  const beachCard: PlaceCard = {
    type: "destination",
    id: "phuket",
    name: "Kata Noi Beach",
    imageUrl:
      "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=900&q=80",
    subtitle: "Beach · Island · Phuket, Thailand",
    rating: 4.8,
  };

  // A hotel card the current user "shares" into the chat.
  const hotelCard: PlaceCard = {
    type: "accommodation",
    id: "h1",
    name: "The Shore at Katathani",
    imageUrl:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    subtitle: "Kata Noi Rd, Karon, Mueang Phuket",
    price: 3200,
    rating: 4.9,
  };

  // Compact helper for assembling a ChatMessage with the demo group ID baked in.
  const msg = (
    id: string,
    authorId: string,
    authorName: string,
    content: string,
    kind: ChatMessage["kind"],
    ts: string,
    extra: Partial<ChatMessage> = {}
  ): ChatMessage => ({
    id,
    groupId: DEMO_GROUP_ID,
    authorId,
    authorName,
    content,
    kind,
    createdAt: ts,
    ...extra,
  });

  // The conversation is intentionally ordered chronologically.
  return [
    msg("dmsg_01", DEMO_ALEX.id, DEMO_ALEX.name, "Hey everyone! Super excited for this trip 🌊", "text", demoTs(0)),
    msg("dmsg_02", DEMO_SARA.id, DEMO_SARA.name, "Same!! I already packed my swimsuit haha", "text", demoTs(1)),
    msg("dmsg_03", DEMO_MIKE.id, DEMO_MIKE.name, "Should we book the hotel now or wait?", "text", demoTs(2)),
    msg("dmsg_04", DEMO_ALEX.id, DEMO_ALEX.name, "Let's book ASAP, prices are going up 📈", "text", demoTs(3)),
    msg("dmsg_05", DEMO_SARA.id, DEMO_SARA.name, "Check this beach out, it's beautiful! 😍", "place", demoTs(5), { placeCard: beachCard }),
    msg("dmsg_06", DEMO_MIKE.id, DEMO_MIKE.name, "Woah that looks amazing, let's add it to the itinerary!", "text", demoTs(6)),
    msg("dmsg_07", userId, userName, "Agreed! Also found a great hotel nearby 🏨", "text", demoTs(8)),
    msg("dmsg_08", userId, userName, "This hotel has an infinity pool 🏊", "place", demoTs(9), { placeCard: hotelCard }),
    msg("dmsg_09", DEMO_ALEX.id, DEMO_ALEX.name, "Let's vote — who wants to stay here? 🗳️", "text", demoTs(10)),
    msg("dmsg_10", DEMO_SARA.id, DEMO_SARA.name, "🙋 YES", "text", demoTs(11, 0)),
    msg("dmsg_11", DEMO_MIKE.id, DEMO_MIKE.name, "👍 I'm in", "text", demoTs(11, 30)),
  ];
}

// ─── 2. State + action surface ───────────────────────────────────────────────

/**
 * Shape of the persisted Zustand store.
 *
 * Each action is documented inline below — if you add one, also document
 * how it interacts with persistence (especially fields that need migration
 * on schema bumps).
 */
interface VibeState {
  // ── Persisted state ──
  /** Currently signed-in user, or `null` if signed out. */
  user: User | null;
  /** All trip groups visible to the user. */
  groups: TripGroup[];
  /** Currently selected group ID for the `/trip` route. */
  activeGroupId: string | null;
  /** All photos across all groups (filtered per-group at render time). */
  photos: PhotoMemory[];
  /** True once the Phuket demo has been seeded — prevents duplicates. */
  demoSeeded: boolean;

  // ── User actions ──
  /** Replace the entire user object (or sign out by passing `null`). */
  setUser: (u: User | null) => void;
  /** Partially update fields on the current user. No-op when signed out. */
  updateUser: (patch: Partial<User>) => void;
  /** Add/remove a preference from `user.preferences`. */
  togglePreference: (p: Preference) => void;

  // ── Group lifecycle ──
  /** Create a new (empty) group, set it active, and return it. */
  createGroup: (name: string) => TripGroup;
  /** Remove a group and its photos. Advances `activeGroupId` if needed. */
  deleteGroup: (id: string) => void;
  /** Inject the canonical Phuket demo group for the given user. */
  createDemoGroup: (user: User) => void;
  /** Switch the active group (e.g. when clicking a group in the sidebar). */
  setActiveGroup: (id: string) => void;

  // ── Per-group mutations ──
  setGroupBudget: (groupId: string, budget: number) => void;
  setGroupDestination: (groupId: string, destinationId: string) => void;
  addExpense: (
    groupId: string,
    e: Omit<Expense, "id" | "groupId" | "createdAt">
  ) => void;
  addMessage: (
    groupId: string,
    m: Omit<ChatMessage, "id" | "groupId" | "createdAt">
  ) => void;
  /** Create a poll AND post a system message announcing it. */
  addPoll: (groupId: string, question: string, options: string[]) => Poll;
  /** Cast (or change) one user's vote on a poll option. */
  votePoll: (
    groupId: string,
    pollId: string,
    optionId: string,
    userId: string
  ) => void;

  // ── Photo wall ──
  addPhoto: (p: Omit<PhotoMemory, "id" | "createdAt">) => void;

  // ── Maintenance ──
  /** Wipe everything (used by the logout / "switch account" flow). */
  reset: () => void;
}

// ─── 3. Store ────────────────────────────────────────────────────────────────

/**
 * The global app store. Use the standard Zustand selector pattern in
 * components to subscribe to only the slice you need:
 *
 *   const user = useVibeStore((s) => s.user);
 *   const addMessage = useVibeStore((s) => s.addMessage);
 *
 * Persisted to `localStorage` under the key `"vibetrip-store"`.
 */
export const useVibeStore = create<VibeState>()(
  persist(
    (set, get) => ({
      // ── Initial state ──
      user: null,
      groups: [],
      activeGroupId: null,
      photos: [],
      demoSeeded: false,

      // ── User actions ──
      setUser: (u) => set({ user: u }),

      updateUser: (patch) =>
        // Merge `patch` onto the current user; do nothing if signed out.
        set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),

      togglePreference: (p) =>
        set((s) => {
          if (!s.user) return s;
          // Add if missing, remove if already present.
          const has = s.user.preferences.includes(p);
          const preferences = has
            ? s.user.preferences.filter((x) => x !== p)
            : [...s.user.preferences, p];
          return { user: { ...s.user, preferences } };
        }),

      // ── Group lifecycle ──
      createGroup: (name) => {
        const user = get().user;
        // Build a new empty group. If signed in, the user is the sole member.
        const group: TripGroup = {
          id: generateId("grp"),
          name,
          members: user
            ? [
                {
                  id: user.id,
                  name: `${user.firstName} ${user.lastName}`,
                  avatar: user.avatarDataUrl,
                },
              ]
            : [],
          budget: 0,
          expenses: [],
          messages: [],
          polls: [],
          createdAt: new Date().toISOString(),
          // Short, shareable, uppercase invite code derived from a random ID.
          inviteCode: generateId("inv").slice(4, 12).toUpperCase(),
        };
        set((s) => ({
          groups: [...s.groups, group],
          activeGroupId: group.id,
        }));
        return group;
      },

      deleteGroup: (id) =>
        set((s) => {
          const remaining = s.groups.filter((g) => g.id !== id);
          // If we just deleted the active group, jump to whatever's left
          // (or `null` if no groups remain).
          const nextActive =
            s.activeGroupId === id
              ? (remaining[0]?.id ?? null)
              : s.activeGroupId;
          return {
            groups: remaining,
            activeGroupId: nextActive,
            // Also drop any photos that belonged to the deleted group.
            photos: s.photos.filter((p) => p.groupId !== id),
          };
        }),

      createDemoGroup: (user) => {
        const userName = `${user.firstName} ${user.lastName}`;
        const demo: TripGroup = {
          id: DEMO_GROUP_ID,
          name: "Phuket Summer Trip 🌊",
          destinationId: "phuket",
          members: [
            { id: DEMO_ALEX.id, name: DEMO_ALEX.name },
            { id: DEMO_SARA.id, name: DEMO_SARA.name },
            { id: DEMO_MIKE.id, name: DEMO_MIKE.name },
            { id: user.id, name: userName, avatar: user.avatarDataUrl },
          ],
          budget: 30000,
          expenses: [],
          messages: buildDemoMessages(user.id, userName),
          polls: [],
          createdAt: new Date("2026-07-10T09:00:00.000Z").toISOString(),
          inviteCode: "PHUKET26",
        };
        // Prepend the demo so it appears first in the sidebar.
        set((s) => ({
          groups: [demo, ...s.groups],
          activeGroupId: demo.id,
          demoSeeded: true,
        }));
      },

      setActiveGroup: (id) => set({ activeGroupId: id }),

      // ── Per-group mutations ──
      // (Each follows the same "map groups, patch the matching one" shape.)

      setGroupBudget: (groupId, budget) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.id === groupId ? { ...g, budget } : g
          ),
        })),

      setGroupDestination: (groupId, destinationId) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.id === groupId ? { ...g, destinationId } : g
          ),
        })),

      addExpense: (groupId, e) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  expenses: [
                    ...g.expenses,
                    // Caller passes the variable bits; we stamp id/groupId/createdAt.
                    {
                      ...e,
                      id: generateId("exp"),
                      groupId,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                }
              : g
          ),
        })),

      addMessage: (groupId, m) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  messages: [
                    ...g.messages,
                    // Same stamping pattern as addExpense.
                    {
                      ...m,
                      id: generateId("msg"),
                      groupId,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                }
              : g
          ),
        })),

      addPoll: (groupId, question, options) => {
        // Build the poll first so we can attach `pollId` to the announcement.
        const poll: Poll = {
          id: generateId("pol"),
          groupId,
          question,
          options: options.map((o) => ({
            id: generateId("opt"),
            label: o,
            votes: [],
          })),
          createdAt: new Date().toISOString(),
          closed: false,
        };
        set((s) => ({
          groups: s.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  polls: [...g.polls, poll],
                  // Also post a "Poll launched: …" message so the chat
                  // shows the poll inline (kind === "poll").
                  messages: [
                    ...g.messages,
                    {
                      id: generateId("msg"),
                      groupId,
                      authorId: "system",
                      authorName: "VibeTrip",
                      content: `Poll launched: ${question}`,
                      kind: "poll",
                      pollId: poll.id,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                }
              : g
          ),
        }));
        return poll;
      },

      votePoll: (groupId, pollId, optionId, userId) =>
        set((s) => ({
          groups: s.groups.map((g) => {
            if (g.id !== groupId) return g;
            return {
              ...g,
              // Two-pass update on the target poll:
              //   Pass 1: strip any existing vote by `userId` from EVERY
              //           option (so changing vote works without double-counting).
              //   Pass 2: add the user's vote to the chosen option.
              polls: g.polls
                .map((p) =>
                  p.id !== pollId
                    ? p
                    : {
                        ...p,
                        options: p.options.map((o) => ({
                          ...o,
                          votes: o.votes.filter((v) => v !== userId),
                        })),
                      }
                )
                .map((p) =>
                  p.id !== pollId
                    ? p
                    : {
                        ...p,
                        options: p.options.map((o) =>
                          o.id === optionId
                            ? { ...o, votes: [...o.votes, userId] }
                            : o
                        ),
                      }
                ),
            };
          }),
        })),

      // ── Photo wall ──
      addPhoto: (p) =>
        set((s) => ({
          photos: [
            ...s.photos,
            { ...p, id: generateId("pho"), createdAt: new Date().toISOString() },
          ],
        })),

      // ── Maintenance ──
      reset: () =>
        set({
          user: null,
          groups: [],
          activeGroupId: null,
          photos: [],
          demoSeeded: false,
        }),
    }),
    {
      // Persistence config — keep this key stable; changing it would
      // orphan every user's saved data.
      name: "vibetrip-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
