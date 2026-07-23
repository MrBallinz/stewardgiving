import { supabase } from "@/integrations/supabase/client";

// The community tables are new; Supabase types regenerate after migration approval.
// Until then, cast through `any` so the app compiles.
export const db = supabase as any;

export const SCAM_PATTERNS = [
  /send me/i, /wire (transfer|me)/i, /western union/i, /money ?gram/i,
  /gift ?card/i, /cash ?app/i, /\$[a-z0-9_]+/i, /venmo/i, /zelle/i,
  /paypal\.me/i, /bitcoin|crypto|\bbtc\b|\beth\b|\busdt\b/i,
  /investment opportunity/i, /guaranteed return/i, /double your/i,
  /forex|binary option/i, /(\+?\d[\s\-.]?){10,}/,
];

export function looksLikeScam(text: string): boolean {
  return SCAM_PATTERNS.some((r) => r.test(text));
}
