/**
 * @file Shared TypeScript types for the VibeTrip web app.
 *
 * This module is the single source of truth for every domain object the
 * frontend reads, writes, or stores. Components, hooks, the Zustand store,
 * and API route handlers all import from here so that data shapes stay
 * consistent across the codebase.
 *
 * Sections (in reading order):
 *   1. Travel preferences and geography (small primitives)
 *   2. User account, identity, and insurance
 *   3. Destinations, accommodations, hotels, attractions
 *   4. Group trip planning: messages, polls, expenses, photos
 *   5. AI-generated itinerary structure
 *
 * NOTE: Adding a new field here? Also check `src/lib/store.ts` for any
 * persisted state that needs a migration, and `src/lib/mock-data.ts` for
 * seed data.
 */

// ─── 1. Travel preferences & geography ───────────────────────────────────────

/**
 * Vibe categories the user can pick during onboarding. Drives:
 *  - Destination filtering on the dashboard.
 *  - Packing-list templates (see `PACKING_LISTS` in `mock-data.ts`).
 *  - AI recommendation prompting.
 */
export type Preference =
  | "beach"
  | "mountain"
  | "waterfall"
  | "city"
  | "camping"
  | "island"
  | "culture"
  | "foodie";

/** Latitude/longitude pair in decimal degrees (WGS84). */
export interface GeoCoords {
  lat: number;
  lng: number;
}

// ─── 2. User account, identity, insurance ────────────────────────────────────

/** Optional travel-insurance details collected during step 2 of registration. */
export interface InsuranceDetails {
  provider: string;
  policyNumber: string;
  emergencyContact: string;
}

/**
 * Identity verification document (Thai national ID card or passport).
 * Modeled as a discriminated union so the UI can branch on `type`.
 */
export type IdentityDocument =
  | { type: "id_card"; number: string }
  | { type: "passport"; number: string };

/**
 * The currently signed-in user. Persisted in localStorage by the Zustand
 * store (see `useVibeStore` in `store.ts`). `id` is generated client-side
 * because this is a hackathon demo without a real auth backend.
 */
export interface User {
  id: string;
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname: string;
  homeAddress: string;
  /** Base64 data URL captured by `<AvatarUpload />`. Optional — defaults to initials. */
  avatarDataUrl?: string;
  preferences: Preference[];
  /** Cached geolocation from `useGeolocation`. Used by the GPS fuel calculator. */
  location?: GeoCoords;
  insurance?: InsuranceDetails;
  identityDocument?: IdentityDocument;
  /** ISO 8601 timestamp of account creation. */
  createdAt: string;
}

// ─── 3. Destinations, accommodations, hotels, attractions ────────────────────

/** A curated travel destination shown in the seasonal carousel and search. */
export interface Destination {
  id: string;
  title: string;
  /** Country or region label, e.g. "Thailand", "Japan". */
  region: string;
  /** Free-form display tags like "Beach", "Island", "Sunset". */
  tags: string[];
  imageUrl: string;
  coords: GeoCoords;
  season: "spring" | "summer" | "autumn" | "winter" | "all";
  /** Primary vibe this destination matches. Used for preference filtering. */
  tripType: Preference;
  /** Relative cost: 1 = budget, 2 = mid-range, 3 = premium. */
  priceLevel: 1 | 2 | 3;
}

/** A hand-curated lodging option attached to a destination (mock-data only). */
export interface Accommodation {
  id: string;
  name: string;
  destinationId: string;
  pricePerNight: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  gallery: string[];
  tags: Preference[];
  amenities: string[];
  address: string;
  coords: GeoCoords;
  description: string;
  checkIn: string;
  checkOut: string;
  cancellationPolicy: string;
}

/**
 * Compact card payload embedded inside chat messages when a user shares
 * a destination or accommodation into the group chat.
 */
export interface PlaceCard {
  type: "destination" | "accommodation";
  id: string;
  name: string;
  imageUrl: string;
  subtitle: string;
  price?: number;
  rating?: number;
}

// ─── 4. Group trip planning: messages, polls, expenses, photos ───────────────

/**
 * A single chat message in a trip group. `kind` discriminates between
 * normal text, an attached `PlaceCard`, a poll announcement, or a
 * system notice (e.g. "Alex joined the trip").
 */
export interface ChatMessage {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  kind: "text" | "poll" | "system" | "place";
  /** Set when `kind === "poll"` — links the message back to a Poll. */
  pollId?: string;
  /** Set when `kind === "place"` — embedded card preview. */
  placeCard?: PlaceCard;
  createdAt: string;
}

/** A shared expense logged inside the trip's expense manager. */
export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidById: string;
  paidByName: string;
  createdAt: string;
}

/** A multi-option group poll. `votes` is a list of user IDs per option. */
export interface Poll {
  id: string;
  groupId: string;
  question: string;
  options: { id: string; label: string; votes: string[] }[];
  createdAt: string;
  closed: boolean;
}

/**
 * A planning "group" — a collection of friends going on one trip together.
 * Holds chat, polls, expenses, and a single optional destination pin.
 */
export interface TripGroup {
  id: string;
  name: string;
  destinationId?: string;
  members: { id: string; name: string; avatar?: string }[];
  /** Total agreed-upon budget for the trip, in THB. */
  budget: number;
  expenses: Expense[];
  messages: ChatMessage[];
  polls: Poll[];
  createdAt: string;
  /** Short, shareable join code (e.g. "PHUKET26"). */
  inviteCode: string;
}

/** A photo uploaded into the group's shared photo wall. */
export interface PhotoMemory {
  id: string;
  groupId: string;
  imageDataUrl: string;
  caption: string;
  createdAt: string;
}

// ─── Hotel / attraction catalog (richer dataset than `Destination`) ──────────

export type HotelType =
  | "hotel"
  | "resort"
  | "hostel"
  | "villa"
  | "guesthouse"
  | "boutique";

/**
 * A hotel record from the hotels dataset. Used by the AI hotel
 * recommendation flow and the hotel browser UI.
 */
export interface Hotel {
  id: string;
  name: string;
  province: string;
  district: string;
  region: string;
  address: string;
  lat: number;
  lng: number;
  type: HotelType;
  stars: number;
  priceMin: number;
  priceMax: number;
  phone: string;
  email: string;
  imageUrl: string;
  gallery: string[];
  amenities: string[];
  checkIn: string;
  checkOut: string;
  serviceHours: string;
  tags: string[];
  rating: number;
  reviewCount: number;
}

/** High-level grouping for Thai tourist attractions. */
export type AttractionCategory =
  | "nature"
  | "culture"
  | "activity"
  | "agro"
  | "other";

/**
 * A tourist attraction from the Tourism Authority of Thailand dataset
 * (see `attractions-data.ts`). Some fields use Thai script because the
 * source data is bilingual.
 */
export interface Attraction {
  id: string;
  nameEn: string;
  nameTh: string;
  descriptionEn: string;
  province: string;
  district: string;
  region: string;
  category: AttractionCategory;
  /** Thai-language label for the high-level category. */
  categoryLabel: string;
  /** Thai-language label for the specific attraction type. */
  typeLabel: string;
  /** May be `null` when the source row had no geocoded location. */
  coords: { lat: number; lng: number } | null;
  phone?: string;
  website?: string;
  openHours?: string;
}

// ─── 5. AI-generated itinerary structure ─────────────────────────────────────

/** One scheduled activity inside a day of an itinerary. */
export interface ItineraryActivity {
  /** Human-readable time, e.g. "09:30". The AI returns this as a string. */
  time: string;
  title: string;
  description: string;
  /** Estimated cost in the trip's currency (THB). */
  cost: number;
  /** Group member assigned as the lead, if any. */
  responsible?: string;
}

/** One day of an itinerary. */
export interface ItineraryDay {
  day: number;
  /** Optional calendar date, e.g. "2026-07-12". Not always set. */
  date?: string;
  title: string;
  activities: ItineraryActivity[];
}

/** Full multi-day plan returned by `/api/ai/itinerary`. */
export interface Itinerary {
  destination: string;
  totalBudget: number;
  days: ItineraryDay[];
}
