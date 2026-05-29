/**
 * @file Static seed data for the VibeTrip demo.
 *
 * This module contains hand-curated destinations, accommodations, packing
 * lists, and SOS contacts that drive the dashboard, search, and map
 * features when the app is run without a backend.
 *
 * Sections:
 *   1. `PREFERENCE_META`   — UI metadata for each Preference category.
 *   2. `DESTINATIONS`      — Curated travel destinations (carousel + search).
 *   3. `ACCOMMODATIONS`    — Curated lodging tied to destinations.
 *   4. `PACKING_LISTS`     — Default packing checklist per preference.
 *   5. `SOS_FACILITIES`    — Emergency contacts shown by the SOS widget.
 *   6. Fuel constants      — Used by the GPS fuel calculator.
 *
 * Adding entries here is safe; the app reads these as read-only arrays.
 */

import type { Accommodation, Destination, Preference } from "./types";

// ─── 1. Preference metadata ─────────────────────────────────────────────────

/**
 * Per-preference UI metadata. Keys must cover every `Preference` member
 * (enforced by `Record<Preference, ...>`). `icon` matches a lucide-react
 * component name and is resolved at render time.
 */
export const PREFERENCE_META: Record<
  Preference,
  { label: string; description: string; icon: string }
> = {
  beach: { label: "Beach", description: "Sun, sand, salt", icon: "Waves" },
  mountain: { label: "Mountain", description: "Peaks & trails", icon: "Mountain" },
  waterfall: { label: "Waterfall", description: "Hidden cascades", icon: "Droplets" },
  city: { label: "City", description: "Urban escapes", icon: "Building2" },
  camping: { label: "Camping", description: "Wild & rugged", icon: "Tent" },
  island: { label: "Island", description: "Pure paradise", icon: "Palmtree" },
  culture: { label: "Culture", description: "Temples & art", icon: "Landmark" },
  foodie: { label: "Foodie", description: "Local flavors", icon: "UtensilsCrossed" },
};

// ─── 2. Destinations ────────────────────────────────────────────────────────

/**
 * Curated destinations powering:
 *   - The seasonal carousel on the dashboard.
 *   - The dashboard search input (matches title/region/tags/tripType).
 *   - Destination detail modals.
 *
 * Each `id` is a stable slug; keep them stable because they're referenced
 * by `TripGroup.destinationId` in persisted user data.
 */
export const DESTINATIONS: Destination[] = [
  {
    id: "phuket",
    title: "Phuket",
    region: "Thailand",
    tags: ["Beach", "Island"],
    imageUrl:
      "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=900&q=80",
    coords: { lat: 7.8804, lng: 98.3923 },
    season: "summer",
    tripType: "beach",
    priceLevel: 2,
  },
  {
    id: "chiang-mai",
    title: "Chiang Mai",
    region: "Thailand",
    tags: ["Culture", "Mountain"],
    imageUrl:
      "https://images.unsplash.com/photo-1598935898639-81586f7d2129?w=900&q=80",
    coords: { lat: 18.7883, lng: 98.9853 },
    season: "winter",
    tripType: "culture",
    priceLevel: 1,
  },
  {
    id: "kyoto",
    title: "Kyoto",
    region: "Japan",
    tags: ["Culture", "Temple"],
    imageUrl:
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=900&q=80",
    coords: { lat: 35.0116, lng: 135.7681 },
    season: "spring",
    tripType: "culture",
    priceLevel: 3,
  },
  {
    id: "bali",
    title: "Bali",
    region: "Indonesia",
    tags: ["Beach", "Island"],
    imageUrl:
      "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=900&q=80",
    coords: { lat: -8.4095, lng: 115.1889 },
    season: "summer",
    tripType: "island",
    priceLevel: 2,
  },
  {
    id: "swiss-alps",
    title: "Swiss Alps",
    region: "Switzerland",
    tags: ["Mountain", "Snow"],
    imageUrl:
      "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=900&q=80",
    coords: { lat: 46.5582, lng: 8.5614 },
    season: "winter",
    tripType: "mountain",
    priceLevel: 3,
  },
  {
    id: "santorini",
    title: "Santorini",
    region: "Greece",
    tags: ["Island", "Sunset"],
    imageUrl:
      "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=900&q=80",
    coords: { lat: 36.3932, lng: 25.4615 },
    season: "summer",
    tripType: "island",
    priceLevel: 3,
  },
  {
    id: "iceland",
    title: "Reykjavik",
    region: "Iceland",
    tags: ["Waterfall", "Aurora"],
    imageUrl:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80",
    coords: { lat: 64.1466, lng: -21.9426 },
    season: "winter",
    tripType: "waterfall",
    priceLevel: 3,
  },
  {
    id: "new-york",
    title: "New York",
    region: "USA",
    tags: ["City", "Skyline"],
    imageUrl:
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=900&q=80",
    coords: { lat: 40.7128, lng: -74.006 },
    season: "autumn",
    tripType: "city",
    priceLevel: 3,
  },
  {
    id: "patagonia",
    title: "Patagonia",
    region: "Argentina",
    tags: ["Camping", "Mountain"],
    imageUrl:
      "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=900&q=80",
    coords: { lat: -49.3274, lng: -72.886 },
    season: "spring",
    tripType: "camping",
    priceLevel: 2,
  },
  {
    id: "maldives",
    title: "Maldives",
    region: "Maldives",
    tags: ["Beach", "Island"],
    imageUrl:
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=900&q=80",
    coords: { lat: 3.2028, lng: 73.2207 },
    season: "all",
    tripType: "beach",
    priceLevel: 3,
  },
  {
    id: "banff",
    title: "Banff",
    region: "Canada",
    tags: ["Mountain", "Lake"],
    imageUrl:
      "https://images.unsplash.com/photo-1609825488888-3a766db05542?w=900&q=80",
    coords: { lat: 51.4968, lng: -115.9281 },
    season: "summer",
    tripType: "mountain",
    priceLevel: 2,
  },
  {
    id: "tokyo",
    title: "Tokyo",
    region: "Japan",
    tags: ["City", "Foodie"],
    imageUrl:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=900&q=80",
    coords: { lat: 35.6762, lng: 139.6503 },
    season: "spring",
    tripType: "city",
    priceLevel: 3,
  },
  {
    id: "lisbon",
    title: "Lisbon",
    region: "Portugal",
    tags: ["City", "Culture"],
    imageUrl:
      "https://images.unsplash.com/photo-1513735492246-483525079686?w=900&q=80",
    coords: { lat: 38.7223, lng: -9.1393 },
    season: "spring",
    tripType: "city",
    priceLevel: 2,
  },
  {
    id: "queenstown",
    title: "Queenstown",
    region: "New Zealand",
    tags: ["Mountain", "Adventure"],
    imageUrl:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=900&q=80",
    coords: { lat: -45.0312, lng: 168.6626 },
    season: "winter",
    tripType: "mountain",
    priceLevel: 2,
  },
  {
    id: "krabi",
    title: "Krabi",
    region: "Thailand",
    tags: ["Beach", "Waterfall"],
    imageUrl:
      "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=900&q=80",
    coords: { lat: 8.0863, lng: 98.9063 },
    season: "winter",
    tripType: "waterfall",
    priceLevel: 2,
  },
];

// ─── 3. Accommodations ──────────────────────────────────────────────────────

/**
 * Curated lodging options. Each row references a destination via
 * `destinationId`. Used by the accommodation detail modal and the
 * "share to chat" flow that embeds a `PlaceCard` in group chat.
 */
export const ACCOMMODATIONS: Accommodation[] = [
  {
    id: "h1",
    name: "Andaman Cliffside Resort",
    destinationId: "phuket",
    pricePerNight: 3200,
    rating: 4.7,
    reviewCount: 1283,
    imageUrl:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
    ],
    tags: ["beach", "island"],
    amenities: ["Pool", "Spa", "Sea View", "Free Wi-Fi", "Breakfast", "AC"],
    address: "88/12 Kata Noi Rd, Karon, Mueang Phuket, Phuket 83100, Thailand",
    coords: { lat: 7.8127, lng: 98.297 },
    description:
      "Perched above Kata Noi bay, this cliffside retreat blends teak architecture with an infinity pool that pours into the Andaman horizon. A guest favorite for sunsets and slow mornings.",
    checkIn: "15:00",
    checkOut: "11:00",
    cancellationPolicy: "Free cancellation up to 48 hours before check-in.",
  },
  {
    id: "h2",
    name: "Beachfront Bamboo Villa",
    destinationId: "phuket",
    pricePerNight: 1800,
    rating: 4.5,
    reviewCount: 642,
    imageUrl:
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    ],
    tags: ["beach", "foodie"],
    amenities: ["Breakfast", "Beach Access", "Outdoor Shower", "Bike Rental"],
    address: "201 Nai Harn Beach Rd, Rawai, Phuket 83130, Thailand",
    coords: { lat: 7.7714, lng: 98.3071 },
    description:
      "A laid-back bamboo villa steps from Nai Harn beach with a fire pit, communal kitchen, and morning yoga deck.",
    checkIn: "14:00",
    checkOut: "10:00",
    cancellationPolicy: "Free cancellation up to 24 hours before check-in.",
  },
  {
    id: "h3",
    name: "Lanna Garden Boutique",
    destinationId: "chiang-mai",
    pricePerNight: 1200,
    rating: 4.6,
    reviewCount: 489,
    imageUrl:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1598935898639-81586f7d2129?w=800&q=80",
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80",
    ],
    tags: ["culture", "mountain"],
    amenities: ["Tropical Garden", "Bike Rental", "Tea House", "Free Wi-Fi"],
    address: "14 Ratchadamnoen Soi 6, Si Phum, Chiang Mai 50200, Thailand",
    coords: { lat: 18.7896, lng: 98.9883 },
    description:
      "A restored Lanna-style residence inside the old city walls — wooden balconies, mango trees, and a 90-second walk to Wat Phra Singh.",
    checkIn: "14:00",
    checkOut: "12:00",
    cancellationPolicy: "Fully refundable until 7 days before check-in.",
  },
  {
    id: "h4",
    name: "Alpine Chalet Loft",
    destinationId: "swiss-alps",
    pricePerNight: 5400,
    rating: 4.9,
    reviewCount: 215,
    imageUrl:
      "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?w=800&q=80",
    ],
    tags: ["mountain", "camping"],
    amenities: ["Fireplace", "Sauna", "Ski Storage", "Hot Tub", "Mountain View"],
    address: "Chemin du Glacier 7, 3818 Grindelwald, Switzerland",
    coords: { lat: 46.6244, lng: 8.0413 },
    description:
      "Hand-cut timber loft with a panoramic balcony facing the Eiger north face. Ski-in / ski-out with private sauna.",
    checkIn: "16:00",
    checkOut: "10:00",
    cancellationPolicy: "Non-refundable within 14 days of arrival.",
  },
  {
    id: "h5",
    name: "Caldera Sky Suites",
    destinationId: "santorini",
    pricePerNight: 6200,
    rating: 4.8,
    reviewCount: 731,
    imageUrl:
      "https://images.unsplash.com/photo-1601628828688-632f38a5a7d0?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80",
      "https://images.unsplash.com/photo-1601628828688-632f38a5a7d0?w=800&q=80",
    ],
    tags: ["island", "culture"],
    amenities: ["Infinity Pool", "Sunset Deck", "Private Jacuzzi", "Wine Bar"],
    address: "Oia, Santorini 84702, Cyclades, Greece",
    coords: { lat: 36.4618, lng: 25.3753 },
    description:
      "Cave-carved suites tumbling down the Oia cliff face — every balcony catches the world-famous sunset.",
    checkIn: "15:00",
    checkOut: "11:00",
    cancellationPolicy: "Free cancellation up to 30 days before check-in.",
  },
  {
    id: "h6",
    name: "Krabi Hidden Lagoon",
    destinationId: "krabi",
    pricePerNight: 2200,
    rating: 4.6,
    reviewCount: 358,
    imageUrl:
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    ],
    tags: ["waterfall", "beach"],
    amenities: ["Kayak", "Spa", "Jungle Trail", "Outdoor Pool"],
    address: "32 Ao Nang Beach Rd, Nong Thale, Mueang Krabi, Krabi 81180, Thailand",
    coords: { lat: 8.0331, lng: 98.8233 },
    description:
      "A hideaway nestled between limestone cliffs and the Hidden Lagoon trailhead — kayaks at sunrise, hammock by sunset.",
    checkIn: "14:00",
    checkOut: "11:00",
    cancellationPolicy: "Free cancellation up to 5 days before check-in.",
  },
  {
    id: "h7",
    name: "Maldives Overwater Pearl",
    destinationId: "maldives",
    pricePerNight: 9800,
    rating: 4.9,
    reviewCount: 1042,
    imageUrl:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
    ],
    tags: ["beach", "island"],
    amenities: ["Overwater Bungalow", "Snorkel Gear", "Private Deck", "Butler"],
    address: "North Malé Atoll, Kaafu, 20026, Republic of Maldives",
    coords: { lat: 4.345, lng: 73.491 },
    description:
      "Glass-floor bungalows over a protected lagoon. Pop the hatch and snorkel straight into a reef garden.",
    checkIn: "13:00",
    checkOut: "12:00",
    cancellationPolicy: "Non-refundable. Resort credit available on request.",
  },
  {
    id: "h8",
    name: "Banff Pine Lodge",
    destinationId: "banff",
    pricePerNight: 3600,
    rating: 4.7,
    reviewCount: 524,
    imageUrl:
      "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1609825488888-3a766db05542?w=800&q=80",
      "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=800&q=80",
    ],
    tags: ["mountain", "camping"],
    amenities: ["Hot Tub", "Trail Access", "Ski Shuttle", "Communal Kitchen"],
    address: "537 Banff Ave, Banff, AB T1L 1B5, Canada",
    coords: { lat: 51.1784, lng: -115.5708 },
    description:
      "Pine-scented lodge a 4-minute drive from Banff townsite. Outdoor hot tub under Rocky Mountain stars.",
    checkIn: "16:00",
    checkOut: "11:00",
    cancellationPolicy: "Free cancellation up to 72 hours before check-in.",
  },
];

// ─── 4. Packing checklist templates ─────────────────────────────────────────

/**
 * Default packing items per preference. The packing-checklist widget
 * unions items across all of the user's selected preferences and
 * de-duplicates by item name.
 */
export const PACKING_LISTS: Record<Preference, string[]> = {
  beach: [
    "Swimsuit",
    "Sunscreen SPF 50",
    "Beach towel",
    "Reef-safe flip flops",
    "Snorkel set",
    "Wide-brim hat",
    "Waterproof phone pouch",
  ],
  mountain: [
    "Hiking boots",
    "Thermal layers",
    "Down jacket",
    "Trekking poles",
    "Headlamp",
    "First aid kit",
    "Insulated water bottle",
  ],
  waterfall: [
    "Quick-dry clothing",
    "Water shoes",
    "Dry bag",
    "GoPro / waterproof camera",
    "Microfiber towel",
    "Bug spray",
  ],
  city: [
    "Comfortable sneakers",
    "Portable charger",
    "Compact umbrella",
    "Day backpack",
    "Smart casual outfit",
    "Local transit card",
  ],
  camping: [
    "Tent & stakes",
    "Sleeping bag",
    "Camp stove",
    "Multi-tool",
    "Firestarter",
    "Bear-safe food storage",
    "Map & compass",
  ],
  island: [
    "Snorkel mask",
    "Reef-safe sunscreen",
    "Swimwear",
    "Sandals",
    "Light cover-up",
    "Waterproof bag",
  ],
  culture: [
    "Modest clothing for temples",
    "Comfortable walking shoes",
    "Phrasebook",
    "Notebook",
    "Camera",
    "Power adapter",
  ],
  foodie: [
    "Stretchy pants",
    "Antacids",
    "Reusable chopsticks",
    "Restaurant list",
    "Compact camera",
    "Hand sanitizer",
  ],
};

// ─── 5. SOS facilities (emergency contacts) ─────────────────────────────────

/**
 * Static emergency contacts used by the SOS widget. `distanceKm` is a
 * placeholder — when the user's geolocation is available, the widget
 * would normally recompute this with `haversineDistanceKm`.
 *
 * The `as const` on `type` narrows the literal so the SOS UI can switch
 * on it without `string` widening.
 */
export const SOS_FACILITIES = [
  {
    type: "Hospital" as const,
    name: "Bangkok General Hospital",
    phone: "+66 2 310 3000",
    distanceKm: 1.4,
  },
  {
    type: "Hospital" as const,
    name: "Bumrungrad International",
    phone: "+66 2 066 8888",
    distanceKm: 2.8,
  },
  {
    type: "Police" as const,
    name: "Tourist Police Station",
    phone: "1155",
    distanceKm: 0.9,
  },
  {
    type: "Gas" as const,
    name: "PTT Station — Sukhumvit 21",
    phone: "+66 2 537 2000",
    distanceKm: 0.6,
  },
];

// ─── 6. Fuel constants (GPS fuel calculator) ────────────────────────────────

/** Current pump price assumption in Thai baht per liter. */
export const FUEL_RATE_THB_PER_LITER = 39.5;

/** Assumed fuel economy in km/L for an average sedan. */
export const AVG_KM_PER_LITER = 13;
