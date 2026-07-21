// Steward — discover churches in a metro via Firecrawl web search and upsert stubs.
// Admin-only. Auth: requires JWT; email must be in ADMIN_EMAILS (comma-separated env).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const ADMIN_EMAILS = (Deno.env.get("ADMIN_EMAILS") ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const BAD_HOSTS = new Set([
  "facebook.com", "m.facebook.com", "www.facebook.com",
  "instagram.com", "twitter.com", "x.com", "youtube.com",
  "yelp.com", "google.com", "maps.google.com", "goo.gl",
  "linkedin.com", "wikipedia.org", "reddit.com", "tiktok.com",
  "eventbrite.com", "meetup.com", "yellowpages.com",
  "churchfinder.com", "usachurches.org", "churchangel.com",
]);

function normDomain(u: string): string | null {
  try {
    const url = new URL(u.startsWith("http") ? u : `https://${u}`);
    return url.hostname.replace(/^www\./, "").toLowerCase();
  } catch { return null; }
}

async function firecrawlSearch(query: string, limit = 20) {
  const res = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, limit }),
  });
  if (!res.ok) throw new Error(`firecrawl search ${res.status}: ${await res.text()}`);
  const j = await res.json();
  // v2 returns { success, data: { web: [{url,title,description}] } } or { data: [...] }
  const web = j?.data?.web ?? j?.data ?? [];
  return Array.isArray(web) ? web : [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    }
    // Verify caller and check admin allowlist.
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: u } = await userClient.auth.getUser();
    const email = u?.user?.email?.toLowerCase();
    if (!email || !ADMIN_EMAILS.includes(email)) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const city = String(body.city ?? "").trim();
    const state = String(body.state ?? "").trim().toUpperCase().slice(0, 2);
    const limit = Math.min(Math.max(Number(body.limit ?? 20), 1), 40);
    if (!city || !state) {
      return new Response(JSON.stringify({ error: "city and state required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const query = `churches in ${city}, ${state} -site:facebook.com -site:yelp.com`;
    const results = await firecrawlSearch(query, limit);

    let discovered = 0, skipped = 0, inserted = 0;
    for (const r of results) {
      discovered++;
      const url: string = r.url ?? r.link ?? "";
      const title: string = r.title ?? "";
      const desc: string = r.description ?? r.snippet ?? "";
      const domain = normDomain(url);
      if (!domain || BAD_HOSTS.has(domain)) { skipped++; continue; }
      // Heuristic: skip results that aren't a homepage-like URL.
      let pathDepth = 0;
      try { pathDepth = new URL(url).pathname.split("/").filter(Boolean).length; } catch {}
      if (pathDepth > 2) { skipped++; continue; }
      // Skip if the title/desc doesn't look church-like.
      const hay = `${title} ${desc}`.toLowerCase();
      if (!/church|chapel|parish|cathedral|congregation|assembly|ministries|worship|fellowship/.test(hay)) {
        skipped++; continue;
      }
      // Clean up name candidate from title.
      const legalName = title.split(/[\|\-–—:]/)[0].trim().slice(0, 150) || domain;
      const website = `https://${domain}`;

      // Avoid duplicates by website domain OR by name+city+state.
      const { data: exists } = await admin
        .from("churches")
        .select("id")
        .or(`website.ilike.%${domain}%,and(legal_name.ilike.${legalName.slice(0,60)},city.ilike.${city},state.eq.${state})`)
        .limit(1);
      if (exists && exists.length > 0) { skipped++; continue; }

      const { error: insErr } = await admin.from("churches").insert({
        legal_name: legalName,
        city, state,
        website,
        source_type: "imported",
        source_url: `firecrawl:search:${query}`,
        enrichment_status: "seeded",
        verification_status: "community_submitted",
      });
      if (!insErr) inserted++; else skipped++;
    }

    return new Response(JSON.stringify({ discovered, inserted, skipped }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
