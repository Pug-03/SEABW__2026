# VibeTrip — Travel Planning Web App

## Overview

VibeTrip is a mobile-first travel planning web app for group trips. Travelers can register, choose trip preferences, search destinations, create trip groups, chat with members, share place cards, split bills with QR codes, generate an AI trip plan, and navigate with nearby POI markers.

The app runs fully in local demo mode by default. Optional Anthropic and Supabase credentials enable live AI itinerary generation and realtime chat sync.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 14 App Router, React 18, TypeScript |
| Styling | Tailwind CSS, CSS variables, responsive mobile-first layouts |
| UI primitives | Radix UI Dialog, Tabs, Avatar, Label, Progress, Switch |
| Icons | lucide-react |
| State management | Zustand with persisted localStorage state |
| Maps | Leaflet.js, react-leaflet, OpenStreetMap tiles |
| AI itinerary | Anthropic Claude API when `ANTHROPIC_API_KEY` is set, mock itinerary fallback otherwise |
| Realtime chat | Supabase Realtime when public Supabase env vars are set, local Zustand chat otherwise |
| QR codes | qrcode.react |

## Getting Started

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open `http://localhost:3000` in your browser.

Useful checks:

```bash
npm run typecheck
npm run lint
npm run build
```

Optional environment variables can be copied from `.env.local.example`:

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Enables real Claude-generated itineraries through `/api/ai/itinerary` |
| `NEXT_PUBLIC_SUPABASE_URL` | Enables Supabase-backed realtime chat |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Required with the Supabase URL |

## Features

- User registration with a 2-step flow: personal info, identity document, password, and travel insurance.
- Login and welcome/profile completion flow with invite link and QR code.
- Home/dashboard experience with destination search, trending destinations, weather, fuel estimate, recommendations, and bill splitter.
- Trip management with create, view, active-trip switching, and delete confirmation.
- Trip group chat with text messages, polls, invite QR code, and shared destination/accommodation cards.
- Hotel and attraction detail modals with maps, share-to-chat, and booking links.
- AI Trip Plan generator with day-by-day itinerary output and member responsibilities.
- Navigation map powered by Leaflet.js with destination marker, route line, and POI markers for hospitals, police, and gas stations.
- Quick-select POI filter buttons.
- Expense manager, packing checklist, photo wall, and SOS widget.
- Fully responsive mobile-first layout with 360px+ support and 44px minimum button targets.

## Pages & Routes

| Route | Purpose |
| --- | --- |
| `/` | Login, sign up, preferences, and welcome/profile flow |
| `/login` | Alias redirect to `/` |
| `/register` | Alias redirect to `/` |
| `/welcome` | Alias redirect to `/` |
| `/dashboard` | Main home dashboard with search, trending cards, bill splitter, recommendations, weather, and destination details |
| `/trip` | Trip hub with group sidebar, chat, expenses, AI plan, map, SOS, packing list, and photo wall |
| `/trips` | Alias redirect to `/trip` |
| `/trips/:id` | Alias redirect to `/trip` |
| `/search` | Alias redirect to `/dashboard` |
| `/place/:id` | Alias redirect to `/dashboard` |
| `/navigate` | Alias redirect to `/trip` |
| `/ai-plan` | Alias redirect to `/trip` |
| `/api/ai/itinerary` | POST endpoint for itinerary generation |

## Notes

- Mobile-first: optimized for 360px+ screen width.
- Destination and accommodation images are loaded from Unsplash URLs.
- Map tiles are provided by OpenStreetMap and require network access.
- AI Trip Plan uses Anthropic Claude when configured; otherwise it returns a structured demo plan.
- Realtime chat uses Supabase when configured; otherwise chat remains local to the browser.
- PromptPay QR generation is currently demo-formatted and should be connected to a real merchant or PromptPay payload before production use.

## Verification

Latest audit checks run successfully:

```bash
npm run typecheck
npm run lint
npm run build
```

The development server was also checked for the main routes and aliases. `/`, `/dashboard`, and `/trip` return `200`; alias routes redirect successfully.
