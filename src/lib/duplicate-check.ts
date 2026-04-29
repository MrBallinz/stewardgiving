// Steward — heuristic duplicate detection for community-submitted churches.
import { supabase } from "@/integrations/supabase/client";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’`.,]/g, "")
    .replace(/\b(the|church|community|fellowship|ministries|inc|llc)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function domainOf(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export type CandidateChurch = {
  legal_name: string;
  city?: string | null;
  state?: string | null;
  website?: string | null;
  giving_url?: string | null;
};

export type DuplicateMatch = {
  id: string;
  legal_name: string;
  city: string | null;
  state: string | null;
  website: string | null;
  giving_url: string | null;
  reason: "name+city" | "website" | "giving_url";
};

export async function findPossibleDuplicates(
  c: CandidateChurch
): Promise<DuplicateMatch[]> {
  const matches: Record<string, DuplicateMatch> = {};
  const normName = normalize(c.legal_name);
  const wd = domainOf(c.website);
  const gd = domainOf(c.giving_url);

  // 1. Same city/state, similar name.
  if (c.city && c.state) {
    const { data } = await supabase
      .from("churches")
      .select("id,legal_name,dba_name,city,state,website,giving_url")
      .eq("city", c.city)
      .eq("state", c.state)
      .limit(50);
    for (const row of data ?? []) {
      const candidates = [row.legal_name, row.dba_name].filter(Boolean) as string[];
      if (candidates.some((n) => normalize(n) === normName)) {
        matches[row.id] = { ...row, reason: "name+city" };
      }
    }
  }

  // 2. Website domain match.
  if (wd) {
    const { data } = await supabase
      .from("churches")
      .select("id,legal_name,city,state,website,giving_url")
      .ilike("website", `%${wd}%`)
      .limit(20);
    for (const row of data ?? []) {
      if (domainOf(row.website) === wd && !matches[row.id]) {
        matches[row.id] = { ...row, reason: "website" };
      }
    }
  }

  // 3. Giving URL domain match.
  if (gd) {
    const { data } = await supabase
      .from("churches")
      .select("id,legal_name,city,state,website,giving_url")
      .ilike("giving_url", `%${gd}%`)
      .limit(20);
    for (const row of data ?? []) {
      if (domainOf(row.giving_url) === gd && !matches[row.id]) {
        matches[row.id] = { ...row, reason: "giving_url" };
      }
    }
  }

  return Object.values(matches);
}
