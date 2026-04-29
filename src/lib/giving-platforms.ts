// Curated directory of giving platforms used by churches, missions, and nonprofits.
// This is the source of truth for "how does money actually reach a recipient."
// In demo mode we don't move money — we link out to the recipient's official page
// on their chosen platform so the user can complete the gift there.

export type PlatformId =
  | "overflow"
  | "tithely"
  | "pushpay"
  | "planning_center"
  | "subsplash"
  | "givelify"
  | "every_org"
  | "pure_charity"
  | "give_directly"
  | "compassion"
  | "paypal"
  | "stripe_link"
  | "ach"
  | "other";

export type GivingPlatform = {
  id: PlatformId;
  name: string;
  category: "Church" | "Missions / Nonprofit" | "Direct";
  description: string;
  // How a recipient page URL is typically structured. {slug} is the org's handle.
  urlPattern?: string;
  homepage: string;
  supports: ("one_time" | "recurring" | "ach" | "card" | "stock" | "crypto")[];
};

export const PLATFORMS: GivingPlatform[] = [
  {
    id: "overflow",
    name: "Overflow",
    category: "Church",
    description: "Stock, crypto, and cash giving used by many modern US churches.",
    urlPattern: "https://donate.overflow.co/{slug}",
    homepage: "https://overflow.co",
    supports: ["one_time", "recurring", "card", "ach", "stock", "crypto"],
  },
  {
    id: "tithely",
    name: "Tithe.ly",
    category: "Church",
    description: "Most widely used church giving platform in the US.",
    urlPattern: "https://tithe.ly/give_new/www/#/tithely/give-one-time/{slug}",
    homepage: "https://tithe.ly",
    supports: ["one_time", "recurring", "card", "ach"],
  },
  {
    id: "pushpay",
    name: "Pushpay",
    category: "Church",
    description: "Enterprise giving for large multi-site churches.",
    homepage: "https://pushpay.com",
    supports: ["one_time", "recurring", "card", "ach"],
  },
  {
    id: "planning_center",
    name: "Planning Center Giving",
    category: "Church",
    description: "Giving inside the Planning Center church management suite.",
    urlPattern: "https://{slug}.churchcenter.com/giving",
    homepage: "https://planningcenter.com/giving",
    supports: ["one_time", "recurring", "card", "ach"],
  },
  {
    id: "subsplash",
    name: "Subsplash Giving",
    category: "Church",
    description: "App + web giving bundled with church mobile apps.",
    homepage: "https://subsplash.com/giving",
    supports: ["one_time", "recurring", "card", "ach"],
  },
  {
    id: "givelify",
    name: "Givelify",
    category: "Church",
    description: "Mobile-first giving popular with smaller congregations.",
    urlPattern: "https://www.givelify.com/donate/{slug}",
    homepage: "https://givelify.com",
    supports: ["one_time", "recurring", "card"],
  },
  {
    id: "every_org",
    name: "Every.org",
    category: "Missions / Nonprofit",
    description: "Free giving platform for any US 501(c)(3).",
    urlPattern: "https://www.every.org/{slug}",
    homepage: "https://every.org",
    supports: ["one_time", "recurring", "card", "ach", "stock", "crypto"],
  },
  {
    id: "pure_charity",
    name: "Pure Charity",
    category: "Missions / Nonprofit",
    description: "Mission trip & nonprofit fundraising platform.",
    homepage: "https://purecharity.com",
    supports: ["one_time", "recurring", "card", "ach"],
  },
  {
    id: "give_directly",
    name: "GiveDirectly",
    category: "Missions / Nonprofit",
    description: "Direct cash transfers to families in extreme poverty.",
    homepage: "https://givedirectly.org",
    supports: ["one_time", "recurring", "card", "ach"],
  },
  {
    id: "compassion",
    name: "Compassion International",
    category: "Missions / Nonprofit",
    description: "Child sponsorship and Christian relief.",
    homepage: "https://compassion.com",
    supports: ["one_time", "recurring", "card", "ach"],
  },
  {
    id: "paypal",
    name: "PayPal Giving",
    category: "Direct",
    description: "Direct PayPal donation page.",
    homepage: "https://paypal.com",
    supports: ["one_time", "recurring", "card"],
  },
  {
    id: "stripe_link",
    name: "Stripe Payment Link",
    category: "Direct",
    description: "Custom Stripe-hosted donation page.",
    homepage: "https://stripe.com",
    supports: ["one_time", "recurring", "card", "ach"],
  },
  {
    id: "ach",
    name: "Bank Transfer (ACH)",
    category: "Direct",
    description: "Direct ACH to the recipient's bank account.",
    supports: ["one_time", "recurring", "ach"],
    homepage: "",
  },
  {
    id: "other",
    name: "Other / In-person",
    category: "Direct",
    description: "Tracked here for records only — gift completed elsewhere.",
    homepage: "",
    supports: ["one_time"],
  },
];

export const PLATFORM_BY_ID: Record<PlatformId, GivingPlatform> =
  Object.fromEntries(PLATFORMS.map((p) => [p.id, p])) as Record<PlatformId, GivingPlatform>;

// Curated directory of well-known recipients. Slugs verified against each
// platform's public donation URL. This is the seed list users can search.
export type DirectoryEntry = {
  name: string;
  type: "church" | "missions" | "nonprofit";
  city?: string;
  state?: string;
  website?: string;
  platform: PlatformId;
  slug?: string;       // used to build the donation URL
  donateUrl?: string;  // overrides urlPattern when present
  ein?: string;
};

export const DIRECTORY: DirectoryEntry[] = [
  // Churches — Overflow
  {
    name: "Lifepoint Church",
    type: "church",
    city: "Wilmington",
    state: "NC",
    website: "https://lifepointnow.com",
    platform: "overflow",
    slug: "lifepointchurchnc",
    donateUrl: "https://donate.overflow.co/lifepointchurchnc",
  },
  {
    name: "Church of the Highlands",
    type: "church",
    city: "Birmingham",
    state: "AL",
    website: "https://churchofthehighlands.com",
    platform: "pushpay",
  },
  {
    name: "Elevation Church",
    type: "church",
    city: "Charlotte",
    state: "NC",
    website: "https://elevationchurch.org",
    platform: "pushpay",
  },
  {
    name: "Bethel Church",
    type: "church",
    city: "Redding",
    state: "CA",
    website: "https://bethel.com",
    platform: "subsplash",
  },
  {
    name: "Hillsong Church",
    type: "church",
    city: "Sydney",
    state: "AU",
    website: "https://hillsong.com",
    platform: "pushpay",
  },
  {
    name: "Passion City Church",
    type: "church",
    city: "Atlanta",
    state: "GA",
    website: "https://passioncitychurch.com",
    platform: "planning_center",
    slug: "passioncity",
  },
  {
    name: "The Village Church",
    type: "church",
    city: "Flower Mound",
    state: "TX",
    website: "https://thevillagechurch.net",
    platform: "tithely",
    slug: "the-village-church",
  },
  // Missions / Nonprofit
  {
    name: "Compassion International",
    type: "missions",
    website: "https://compassion.com",
    platform: "compassion",
    ein: "36-2423707",
  },
  {
    name: "Samaritan's Purse",
    type: "missions",
    website: "https://samaritanspurse.org",
    platform: "every_org",
    slug: "samaritans-purse",
    ein: "58-1437002",
  },
  {
    name: "International Justice Mission",
    type: "nonprofit",
    website: "https://ijm.org",
    platform: "every_org",
    slug: "ijm",
    ein: "54-1722887",
  },
  {
    name: "Voice of the Martyrs",
    type: "missions",
    website: "https://persecution.com",
    platform: "every_org",
    slug: "vom",
    ein: "73-1395057",
  },
  {
    name: "GiveDirectly",
    type: "nonprofit",
    website: "https://givedirectly.org",
    platform: "give_directly",
    ein: "27-1661997",
  },
  {
    name: "World Vision",
    type: "missions",
    website: "https://worldvision.org",
    platform: "every_org",
    slug: "world-vision",
    ein: "95-1922279",
  },
];

export function buildDonateUrl(entry: DirectoryEntry): string | null {
  if (entry.donateUrl) return entry.donateUrl;
  const platform = PLATFORM_BY_ID[entry.platform];
  if (platform.urlPattern && entry.slug) {
    return platform.urlPattern.replace("{slug}", entry.slug);
  }
  return platform.homepage || null;
}
