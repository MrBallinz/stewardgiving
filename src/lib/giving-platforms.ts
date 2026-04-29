// Steward — known giving platforms.
// This file serves both the new ChurchSearch flow and the existing Recipients page.

export type PlatformId =
  | "tithely"
  | "pushpay"
  | "givelify"
  | "anedot"
  | "subsplash"
  | "vanco"
  | "churchtrac"
  | "overflow"
  | "planning_center"
  | "easytithe"
  | "stripe_direct"
  | "every_org"
  | "unknown";

export type PlatformCategory = "church" | "nonprofit" | "generic";

export type Platform = {
  id: PlatformId;
  name: string;
  category: PlatformCategory;
  description: string;
  urlPattern?: string; // {slug} placeholder
};

export const PLATFORMS: Platform[] = [
  { id: "tithely", name: "Tithe.ly", category: "church",
    description: "Popular giving platform for churches.",
    urlPattern: "https://tithe.ly/give?c={slug}" },
  { id: "pushpay", name: "Pushpay", category: "church",
    description: "Used by larger congregations.",
    urlPattern: "https://pushpay.com/g/{slug}" },
  { id: "givelify", name: "Givelify", category: "church",
    description: "Mobile-first giving app.",
    urlPattern: "https://www.givelify.com/donate/{slug}" },
  { id: "anedot", name: "Anedot", category: "church",
    description: "Donation processor for churches and nonprofits.",
    urlPattern: "https://anedot.com/{slug}" },
  { id: "subsplash", name: "Subsplash", category: "church",
    description: "Church platform with built-in giving.",
    urlPattern: "https://subsplash.com/+{slug}/give" },
  { id: "vanco", name: "Vanco", category: "church",
    description: "Faith-based payment processor.",
    urlPattern: "https://secure.myvanco.com/{slug}" },
  { id: "churchtrac", name: "ChurchTrac", category: "church",
    description: "Church management with giving.",
    urlPattern: "https://www.churchtrac.com/{slug}" },
  { id: "overflow", name: "Overflow", category: "church",
    description: "Stock and crypto giving.",
    urlPattern: "https://overflow.co/give/{slug}" },
  { id: "planning_center", name: "Planning Center", category: "church",
    description: "Church management with Church Center giving.",
    urlPattern: "https://{slug}.churchcenter.com/giving" },
  { id: "easytithe", name: "EasyTithe", category: "church",
    description: "Simple online giving.",
    urlPattern: "https://easytithe.com/{slug}" },
  { id: "stripe_direct", name: "Direct (Stripe)", category: "nonprofit",
    description: "Org's own donation page (often Stripe-powered)." },
  { id: "every_org", name: "every.org", category: "nonprofit",
    description: "Free 501(c)(3) donation routing.",
    urlPattern: "https://www.every.org/{slug}" },
  { id: "unknown", name: "Unknown", category: "generic",
    description: "Platform not detected — manual instructions." },
];

export const PLATFORM_BY_ID: Record<PlatformId, Platform> = Object.fromEntries(
  PLATFORMS.map((p) => [p.id, p])
) as Record<PlatformId, Platform>;

export function platformLabel(p?: string | null): string {
  if (!p) return "No platform detected";
  return PLATFORM_BY_ID[p as PlatformId]?.name ?? p;
}

export function platformBadgeText(p?: string | null): string {
  if (!p) return "No platform detected — manual instructions";
  return `Gives via ${platformLabel(p)}`;
}

export function buildDonateUrl(params: {
  name: string;
  type: "church" | "missions" | "nonprofit";
  platform: PlatformId | null;
  slug?: string | null;
}): string | null {
  const { platform, slug } = params;
  if (!platform) return null;
  const p = PLATFORM_BY_ID[platform];
  if (!p?.urlPattern) return null;
  if (!slug) return null;
  return p.urlPattern.replace("{slug}", encodeURIComponent(slug));
}

// ---- Lightweight directory used by the legacy Recipients quick-pick.
// (Real church search now lives in <ChurchSearch /> backed by the churches table.)
export type DirectoryEntry = {
  name: string;
  city?: string;
  state?: string;
  platform: PlatformId;
  slug?: string;
};

export const DIRECTORY: DirectoryEntry[] = [
  { name: "Compassion International", city: "Colorado Springs", state: "CO", platform: "stripe_direct" },
  { name: "World Vision", city: "Federal Way", state: "WA", platform: "stripe_direct" },
  { name: "Samaritan's Purse", city: "Boone", state: "NC", platform: "stripe_direct" },
  { name: "International Justice Mission", city: "Washington", state: "DC", platform: "stripe_direct" },
  { name: "Cru", city: "Orlando", state: "FL", platform: "stripe_direct" },
  { name: "Wycliffe Bible Translators", city: "Orlando", state: "FL", platform: "stripe_direct" },
  { name: "Young Life", city: "Colorado Springs", state: "CO", platform: "stripe_direct" },
  { name: "The Navigators", city: "Colorado Springs", state: "CO", platform: "stripe_direct" },
];

// Backward-compat aliases for older imports.
export const GIVING_PLATFORMS = Object.fromEntries(
  PLATFORMS.map((p) => [p.id, p.name])
) as Record<PlatformId, string>;
export type GivingPlatform = PlatformId;
