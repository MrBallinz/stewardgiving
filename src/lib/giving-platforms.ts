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

export type PlatformCategory = "Church" | "Missions / Nonprofit" | "Direct";

export type Platform = {
  id: PlatformId;
  name: string;
  category: PlatformCategory;
  description: string;
  urlPattern?: string; // {slug} placeholder
};

export const PLATFORMS: Platform[] = [
  { id: "tithely", name: "Tithe.ly", category: "Church",
    description: "Popular giving platform for churches.",
    urlPattern: "https://tithe.ly/give?c={slug}" },
  { id: "pushpay", name: "Pushpay", category: "Church",
    description: "Used by larger congregations.",
    urlPattern: "https://pushpay.com/g/{slug}" },
  { id: "givelify", name: "Givelify", category: "Church",
    description: "Mobile-first giving app.",
    urlPattern: "https://www.givelify.com/donate/{slug}" },
  { id: "anedot", name: "Anedot", category: "Church",
    description: "Donation processor for churches and nonprofits.",
    urlPattern: "https://anedot.com/{slug}" },
  { id: "subsplash", name: "Subsplash", category: "Church",
    description: "Church platform with built-in giving.",
    urlPattern: "https://subsplash.com/+{slug}/give" },
  { id: "vanco", name: "Vanco", category: "Church",
    description: "Faith-based payment processor.",
    urlPattern: "https://secure.myvanco.com/{slug}" },
  { id: "churchtrac", name: "ChurchTrac", category: "Church",
    description: "Church management with giving.",
    urlPattern: "https://www.churchtrac.com/{slug}" },
  { id: "overflow", name: "Overflow", category: "Church",
    description: "Stock and crypto giving.",
    urlPattern: "https://overflow.co/give/{slug}" },
  { id: "planning_center", name: "Planning Center", category: "Church",
    description: "Church management with Church Center giving.",
    urlPattern: "https://{slug}.churchcenter.com/giving" },
  { id: "easytithe", name: "EasyTithe", category: "Church",
    description: "Simple online giving.",
    urlPattern: "https://easytithe.com/{slug}" },
  { id: "stripe_direct", name: "Direct (Stripe)", category: "Direct",
    description: "Org's own donation page (often Stripe-powered)." },
  { id: "every_org", name: "every.org", category: "Missions / Nonprofit",
    description: "Free 501(c)(3) donation routing.",
    urlPattern: "https://www.every.org/{slug}" },
  { id: "unknown", name: "Unknown", category: "Direct",
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
  type: "church" | "missions" | "nonprofit" | "other";
  city?: string;
  state?: string;
  website?: string;
  donateUrl?: string;
  ein?: string;
  platform: PlatformId;
  slug?: string;
};

export const DIRECTORY: DirectoryEntry[] = [
  { name: "Compassion International", type: "nonprofit", city: "Colorado Springs", state: "CO", platform: "stripe_direct", website: "https://compassion.com", donateUrl: "https://compassion.com/donate" },
  { name: "World Vision", type: "nonprofit", city: "Federal Way", state: "WA", platform: "stripe_direct", website: "https://worldvision.org", donateUrl: "https://donate.worldvision.org" },
  { name: "Samaritan's Purse", type: "nonprofit", city: "Boone", state: "NC", platform: "stripe_direct", website: "https://samaritanspurse.org", donateUrl: "https://samaritanspurse.org/donate" },
  { name: "International Justice Mission", type: "missions", city: "Washington", state: "DC", platform: "stripe_direct", website: "https://ijm.org", donateUrl: "https://ijm.org/donate" },
  { name: "Cru", type: "missions", city: "Orlando", state: "FL", platform: "stripe_direct", website: "https://cru.org", donateUrl: "https://give.cru.org" },
  { name: "Wycliffe Bible Translators", type: "missions", city: "Orlando", state: "FL", platform: "stripe_direct", website: "https://wycliffe.org", donateUrl: "https://wycliffe.org/donate" },
  { name: "Young Life", type: "missions", city: "Colorado Springs", state: "CO", platform: "stripe_direct", website: "https://younglife.org", donateUrl: "https://younglife.org/donate" },
  { name: "The Navigators", type: "missions", city: "Colorado Springs", state: "CO", platform: "stripe_direct", website: "https://navigators.org", donateUrl: "https://navigators.org/donate" },
];

// Backward-compat aliases for older imports.
export const GIVING_PLATFORMS = Object.fromEntries(
  PLATFORMS.map((p) => [p.id, p.name])
) as Record<PlatformId, string>;
export type GivingPlatform = PlatformId;
