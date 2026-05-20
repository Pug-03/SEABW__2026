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

// ─── Stable IDs for the demo trip so it never duplicates ─────────────────────
const DEMO_GROUP_ID = "grp_phuket_demo_2026";
const DEMO_ALEX = { id: "usr_demo_alex", name: "Alex" };
const DEMO_SARA = { id: "usr_demo_sara", name: "Sara" };
const DEMO_MIKE = { id: "usr_demo_mike", name: "Mike" };

// Build a demo ISO timestamp: July 12 2026, 10:30 AM Bangkok (UTC+7 = 03:30 UTC)
function demoTs(minuteOffset: number, secondOffset = 0): string {
  return new Date(
    Date.UTC(2026, 6, 12, 3, 30 + minuteOffset, secondOffset)
  ).toISOString();
}

function buildDemoMessages(userId: string, userName: string): ChatMessage[] {
  const beachCard: PlaceCard = {
    type: "destination",
    id: "phuket",
    name: "Kata Noi Beach",
    imageUrl:
      "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=900&q=80",
    subtitle: "Beach · Island · Phuket, Thailand",
    rating: 4.8,
  };

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

interface VibeState {
  user: User | null;
  groups: TripGroup[];
  activeGroupId: string | null;
  photos: PhotoMemory[];
  demoSeeded: boolean;

  setUser: (u: User | null) => void;
  updateUser: (patch: Partial<User>) => void;
  togglePreference: (p: Preference) => void;
  createGroup: (name: string) => TripGroup;
  deleteGroup: (id: string) => void;
  createDemoGroup: (user: User) => void;
  setActiveGroup: (id: string) => void;
  setGroupBudget: (groupId: string, budget: number) => void;
  setGroupDestination: (groupId: string, destinationId: string) => void;
  addExpense: (groupId: string, e: Omit<Expense, "id" | "groupId" | "createdAt">) => void;
  addMessage: (groupId: string, m: Omit<ChatMessage, "id" | "groupId" | "createdAt">) => void;
  addPoll: (groupId: string, question: string, options: string[]) => Poll;
  votePoll: (groupId: string, pollId: string, optionId: string, userId: string) => void;
  addPhoto: (p: Omit<PhotoMemory, "id" | "createdAt">) => void;
  reset: () => void;
}

export const useVibeStore = create<VibeState>()(
  persist(
    (set, get) => ({
      user: null,
      groups: [],
      activeGroupId: null,
      photos: [],
      demoSeeded: false,

      setUser: (u) => set({ user: u }),

      updateUser: (patch) =>
        set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),

      togglePreference: (p) =>
        set((s) => {
          if (!s.user) return s;
          const has = s.user.preferences.includes(p);
          const preferences = has
            ? s.user.preferences.filter((x) => x !== p)
            : [...s.user.preferences, p];
          return { user: { ...s.user, preferences } };
        }),

      createGroup: (name) => {
        const user = get().user;
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
          const nextActive =
            s.activeGroupId === id
              ? (remaining[0]?.id ?? null)
              : s.activeGroupId;
          return {
            groups: remaining,
            activeGroupId: nextActive,
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
        set((s) => ({
          groups: [demo, ...s.groups],
          activeGroupId: demo.id,
          demoSeeded: true,
        }));
      },

      setActiveGroup: (id) => set({ activeGroupId: id }),

      setGroupBudget: (groupId, budget) =>
        set((s) => ({
          groups: s.groups.map((g) => (g.id === groupId ? { ...g, budget } : g)),
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

      addPhoto: (p) =>
        set((s) => ({
          photos: [
            ...s.photos,
            { ...p, id: generateId("pho"), createdAt: new Date().toISOString() },
          ],
        })),

      reset: () =>
        set({ user: null, groups: [], activeGroupId: null, photos: [], demoSeeded: false }),
    }),
    {
      name: "vibetrip-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
