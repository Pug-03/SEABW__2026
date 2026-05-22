export type Preference =
  | "beach"
  | "mountain"
  | "waterfall"
  | "city"
  | "camping"
  | "island"
  | "culture"
  | "foodie";

export interface GeoCoords {
  lat: number;
  lng: number;
}

export interface InsuranceDetails {
  provider: string;
  policyNumber: string;
  emergencyContact: string;
}

export type IdentityDocument =
  | { type: "id_card"; number: string }
  | { type: "passport"; number: string };

export interface User {
  id: string;
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname: string;
  homeAddress: string;
  avatarDataUrl?: string;
  preferences: Preference[];
  location?: GeoCoords;
  insurance?: InsuranceDetails;
  identityDocument?: IdentityDocument;
  createdAt: string;
}

export interface Destination {
  id: string;
  title: string;
  region: string;
  tags: string[];
  imageUrl: string;
  coords: GeoCoords;
  season: "spring" | "summer" | "autumn" | "winter" | "all";
  tripType: Preference;
  priceLevel: 1 | 2 | 3;
}

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

export interface PlaceCard {
  type: "destination" | "accommodation";
  id: string;
  name: string;
  imageUrl: string;
  subtitle: string;
  price?: number;
  rating?: number;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  kind: "text" | "poll" | "system" | "place";
  pollId?: string;
  placeCard?: PlaceCard;
  createdAt: string;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidById: string;
  paidByName: string;
  createdAt: string;
}

export interface Poll {
  id: string;
  groupId: string;
  question: string;
  options: { id: string; label: string; votes: string[] }[];
  createdAt: string;
  closed: boolean;
}

export interface TripGroup {
  id: string;
  name: string;
  destinationId?: string;
  members: { id: string; name: string; avatar?: string }[];
  budget: number;
  expenses: Expense[];
  messages: ChatMessage[];
  polls: Poll[];
  createdAt: string;
  inviteCode: string;
}

export interface PhotoMemory {
  id: string;
  groupId: string;
  imageDataUrl: string;
  caption: string;
  createdAt: string;
}

export type AttractionCategory = "nature" | "culture" | "activity" | "agro" | "other";

export interface Attraction {
  id: string;
  nameEn: string;
  nameTh: string;
  descriptionEn: string;
  province: string;
  district: string;
  region: string;
  category: AttractionCategory;
  categoryLabel: string;
  typeLabel: string;
  coords: { lat: number; lng: number } | null;
  phone?: string;
  website?: string;
  openHours?: string;
}

export interface ItineraryActivity {
  time: string;
  title: string;
  description: string;
  cost: number;
  responsible?: string;
}

export interface ItineraryDay {
  day: number;
  date?: string;
  title: string;
  activities: ItineraryActivity[];
}

export interface Itinerary {
  destination: string;
  totalBudget: number;
  days: ItineraryDay[];
}
