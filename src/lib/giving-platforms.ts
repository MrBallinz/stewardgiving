// Steward — known giving platforms and their display labels
export const GIVING_PLATFORMS = {
  tithely: "Tithe.ly",
  pushpay: "Pushpay",
  givelify: "Givelify",
  anedot: "Anedot",
  subsplash: "Subsplash",
  vanco: "Vanco",
  churchtrac: "ChurchTrac",
  overflow: "Overflow",
  planning_center: "Planning Center",
  easytithe: "EasyTithe",
  stripe_direct: "Stripe (direct)",
  every_org: "every.org",
  unknown: "Unknown",
} as const;

export type GivingPlatform = keyof typeof GIVING_PLATFORMS;

export function platformLabel(p?: string | null): string {
  if (!p) return "No platform detected";
  return (GIVING_PLATFORMS as Record<string, string>)[p] ?? p;
}

export function platformBadgeText(p?: string | null): string {
  if (!p) return "No platform detected — manual instructions";
  return `Gives via ${platformLabel(p)}`;
}
