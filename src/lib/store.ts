"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ChatMessage,
  Expense,
  PhotoMemory,
  Poll,
  Preference,
  TripGroup,
  User,
} from "./types";
import { generateId } from "./utils";

interface VibeState {
  user: User | null;
  groups: TripGroup[];
  activeGroupId: string | null;
  photos: PhotoMemory[];
  setUser: (u: User | null) => void;
  updateUser: (patch: Partial<User>) => void;
  togglePreference: (p: Preference) => void;
  createGroup: (name: string) => TripGroup;
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
              polls: g.polls.map((p) =>
                p.id !== pollId
                  ? p
                  : {
                      ...p,
                      options: p.options.map((o) => ({
                        ...o,
                        votes: o.votes.filter((v) => v !== userId),
                      })),
                    }
              ).map((p) =>
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
        set({ user: null, groups: [], activeGroupId: null, photos: [] }),
    }),
    {
      name: "vibetrip-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
