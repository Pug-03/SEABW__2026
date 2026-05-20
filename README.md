# VibeTrip

A modern, Apple-style group-travel companion built for the SEABW 2026 hackathon. Plan, split, and vibe with your crew — register, pick preferences, create trip groups, chat in real time (mocked), split the bill with PromptPay QR, and generate AI itineraries.

---

## Tech stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router) + TypeScript
- **Styling**: Tailwind CSS + custom CSS variables (light & dark mode)
- **UI primitives**: Shadcn-style components built on [Radix UI](https://www.radix-ui.com/) (Dialog, Tabs, Avatar, Switch, Label, Progress)
- **Icons**: [`lucide-react`](https://lucide.dev/)
- **State**: [Zustand](https://github.com/pmndrs/zustand) with `persist` middleware (localStorage)
- **QR codes**: [`qrcode.react`](https://github.com/zpao/qrcode.react)
- **AI** (optional): Anthropic Claude (`claude-haiku-4-5-20251001`) via `/api/ai/itinerary` — falls back to a structured mock if no API key is configured

---

## Getting started

Requirements: **Node 18.17+** (Node 20 LTS recommended) and **pnpm** (or npm/yarn).

### Install

```bash
# with pnpm (recommended — used during development)
pnpm install

# or with npm
npm install
```

### Run the dev server

```bash
pnpm dev
# or
npm run dev
```

Open <http://localhost:3000>. If port 3000 is busy, Next.js will offer the next free port and print it to the console.

### Build for production

```bash
pnpm build
pnpm start
```

### Other commands

```bash
pnpm typecheck   # tsc --noEmit
pnpm lint        # next lint
```

### Optional: enable real AI itinerary

Create `.env.local` in the project root:

```env
ANTHROPIC_API_KEY=sk-ant-...
```

Without a key, `/api/ai/itinerary` returns a deterministic mock plan — the UI is identical, just the source badge changes.

---

## Main features

1. **Authentication & onboarding**
   - Browser geolocation prompt on first load
   - Registration with phone, email, name, nickname, address, password (+ confirm validation)
   - Drag-and-drop profile picture upload
   - Toggleable register / login forms
   - **Bento preference grid** — multi-select trip vibes (Beach, Mountain, Waterfall, City, Camping, Island, Culture, Foodie)
   - Profile-creation step with **invite link + scannable QR**
   - Optional **travel insurance** fields (provider, policy number, emergency contact)

2. **Main dashboard**
   - Glass top navbar — settings on the far left, profile avatar on the far right
   - Centered **smart search bar** with submit-driven destination filtering and a "No results" state
   - **Auto-scrolling seasonal carousel** (15 destinations, 5 visible on desktop, seamless infinite loop, hover-to-pause)
   - **Profile modal** with edit-flow password re-verification
   - **Settings modal** (privacy, push notifications, 2FA, biometric, language, change password)

3. **Trip hub (group chat & collaboration)**
   - **Infinite group creation** with per-group QR invite codes
   - Clean chat interface (text + system + poll messages)
   - **Expense Manager** sidebar — total budget + progress bar + per-member expenses
   - **Split Bill** calculator with PromptPay-style QR code
   - **Accommodation recommendations** with "Book Now" + detail modal (address, coords, distance from you, amenities, check-in / check-out)

4. **AI & utilities**
   - **AI Itinerary** — 3D/2N timeline with day blocks, activities, costs, and responsible-member chips. Backed by Anthropic Claude when `ANTHROPIC_API_KEY` is set, mock otherwise.
   - **Smart group polls** with live percentage bars
   - **GPS + Fuel calculator** — haversine distance, ETA, fuel cost (configurable km/L and ฿/L)
   - **Weather widget** — current + 5-day forecast
   - **Packing checklist** — grouped by trip type (beach essentials, mountain gear, …)
   - **Nearby SOS** — hospitals / police / gas with mock phone numbers and distances
   - **Trip Memory photo wall** — drag-and-drop CSS-grid scrapbook with captions
   - **AI recommendation engine** — scores stays against the user's preferences + the group's remaining budget; shows an "AI Recommended for you" badge with a reason
   - **Travel insurance integration** — when SOS is activated, the user's insurance card (provider, policy, emergency contact, mock barcode) is displayed prominently

---

## Pages & routes

| Route | Purpose |
| --- | --- |
| `/` | Authentication & onboarding (register, login, preferences bento, profile creation with invite QR) |
| `/dashboard` | Main dashboard — smart search, seasonal carousel, AI recommendations, weather, GPS & fuel |
| `/trip` | Trip hub — group sidebar, chat, expense manager, split bill, AI itinerary, packing, SOS, photo wall |
| `/api/ai/itinerary` | POST endpoint that generates a structured 3D/2N itinerary (Claude or mock) |

---

## Project structure

```
src/
├─ app/
│  ├─ page.tsx              # /  — auth & onboarding
│  ├─ dashboard/page.tsx    # /dashboard
│  ├─ trip/
│  │  ├─ page.tsx           # /trip
│  │  └─ error.tsx          # /trip error boundary
│  ├─ api/ai/itinerary/route.ts
│  ├─ layout.tsx
│  └─ globals.css
├─ components/
│  ├─ auth/                 # registration, login, preference grid, profile creation
│  ├─ dashboard/            # navbar, smart search, carousel, profile/settings modals
│  ├─ trip/                 # group sidebar, chat, expense manager (+ split bill)
│  ├─ features/             # AI itinerary, recommendations, weather, GPS/fuel,
│  │                         #   packing, SOS, polls, photo wall, hotel detail
│  ├─ common/               # logo, theme toggle, splash, QR, avatar upload
│  └─ ui/                   # shadcn-style primitives
├─ hooks/                   # use-geolocation, use-store-hydrated
└─ lib/                     # types, store (Zustand), mock-data, theme, utils
```

---

## Troubleshooting

- **Stuck on the auth page after refreshing while logged in?** The store hydrates from `localStorage` via Zustand persist. The dashboard and trip routes wait for hydration before redirecting — see `src/hooks/use-store-hydrated.ts`.
- **Geolocation never prompts?** Browsers only prompt once per origin. If you previously denied, re-enable via the address-bar site settings.
- **Images don't load?** Destination & hotel imagery is sourced from `images.unsplash.com`. Network filters or offline mode may block them — placeholders should still render.
