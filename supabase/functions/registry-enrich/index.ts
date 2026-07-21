// Steward — scrape church websites to discover their online-giving link.
// Admin-only. Heuristic first (fast, cheap, ~80% coverage). Auto-verifies when the
// resolved URL points to a known giving-processor domain.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const ADMIN_EMAILS = (Deno.env.get("ADMIN_EMAILS") ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

async function requireRegistryAdmin(
  req: Request,
  admin: ReturnType<typeof createClient>,
) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return {
      ok: false as const,
      response: new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      }),
    };
  }

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  const user = userData?.user;
  const email = user?.email?.trim().toLowerCase();
  if (userErr || !user?.id || !email) {
    return {
      ok: false as const,
      response: new Response(
        JSON.stringify({
          error: "unauthorized",
          detail: userErr?.message ?? "no user",
        }),
        {
          status: 401,
          headers: { ...cors, "Content-Type": "application/json" },
        },
      ),
    };
  }

  const { data: roleRow, error: roleErr } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  const allowedByRole = Boolean(roleRow) && !roleErr;
  const allowedByEmail = ADMIN_EMAILS.includes(email);
  if (!allowedByRole && !allowedByEmail) {
    return {
      ok: false as const,
      response: new Response(
        JSON.stringify({
          error: "forbidden",
          detail: "Signed-in account is not authorized for registry admin.",
        }),
        {
          status: 403,
          headers: { ...cors, "Content-Type": "application/json" },
        },
      ),
    };
  }

  return { ok: true as const, userId: user.id, email };
}

// Known processors → platform id (matches churches_giving_platform_check).
// Order matters: check longer/more-specific hostnames first.
const PLATFORM_HOSTS: Array<[RegExp, string]> = [
  [/(^|\.)donate\.overflow\.co$|(^|\.)overflow\.co$/i, "overflow"],
  [/(^|\.)tithe\.ly$|(^|\.)tithely\.com$/i, "tithely"],
  [/(^|\.)pushpay\.com$/i, "pushpay"],
  [/(^|\.)givelify\.com$/i, "givelify"],
  [/(^|\.)anedot\.com$/i, "anedot"],
  [/(^|\.)subsplash\.com$/i, "subsplash"],
  [
    /(^|\.)vancopayments\.com$|(^|\.)vanco\.com$|(^|\.)securegive\.com$/i,
    "vanco",
  ],
  [
    /(^|\.)planningcenteronline\.com$|(^|\.)churchcenter\.com$/i,
    "planning_center",
  ],
  [/(^|\.)easytithe\.com$/i, "easytithe"],
  [/(^|\.)donorbox\.org$/i, "donorbox"],
  [/(^|\.)generis\.com$/i, "generis"],
  [/(^|\.)breezechms\.com$/i, "breeze"],
  [/(^|\.)every\.org$/i, "every_org"],
  [
    /(^|\.)stripe\.com$|(^|\.)checkout\.stripe\.com$|(^|\.)buy\.stripe\.com$/i,
    "stripe_direct",
  ],
  [/(^|\.)churchtrac\.com$/i, "churchtrac"],
];

function normHost(u: string): string | null {
  try {
    return new URL(u).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function detectPlatform(u: string): string | null {
  const host = normHost(u);
  if (!host) return null;
  for (const [rx, id] of PLATFORM_HOSTS) if (rx.test(host)) return id;
  return null;
}

const GIVE_TEXT =
  /\b(give|giving|donate|donation|tithe|tithing|generosity|contribute|offering)\b/i;
const GIVE_PATH =
  /\/(give|giving|donate|donation|tithe|tithing|generosity|contribute|pledge)(\/|$|\?)/i;

async function firecrawlScrape(url: string) {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["links", "html"],
      onlyMainContent: false,
      waitFor: 500,
    }),
  });
  if (!res.ok)
    throw new Error(
      `firecrawl ${res.status}: ${(await res.text()).slice(0, 200)}`,
    );
  const j = await res.json();
  const d = j?.data ?? j;
  return {
    links: (d?.links ?? []) as string[],
    html: (d?.html ?? "") as string,
  };
}

/** Extract anchor tags <a href="..">text</a> from raw html (best-effort). */
function extractAnchors(html: string): Array<{ href: string; text: string }> {
  const out: Array<{ href: string; text: string }> = [];
  const rx = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(html)) !== null) {
    const text = m[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    out.push({ href: m[1], text });
    if (out.length > 400) break;
  }
  return out;
}

function resolveUrl(base: string, href: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

/**
 * Given a scraped homepage, find the best giving link.
 * Returns { url, platform } where platform may be null when we found a
 * generic /give page on the church's own site.
 */
async function findGivingLink(
  website: string,
): Promise<{ url: string; platform: string | null } | null> {
  const home = await firecrawlScrape(website);
  const anchors = extractAnchors(home.html);
  const siteHost = normHost(website);

  const scored: Array<{
    url: string;
    score: number;
    platform: string | null;
    sameSite: boolean;
  }> = [];
  for (const a of anchors) {
    const url = resolveUrl(website, a.href);
    if (!url) continue;
    const host = normHost(url);
    if (!host) continue;
    const platform = detectPlatform(url);
    const textHit = GIVE_TEXT.test(a.text);
    const pathHit = GIVE_PATH.test(url);
    if (!platform && !textHit && !pathHit) continue;
    let score = 0;
    if (platform) score += 100;
    if (textHit) score += 10;
    if (pathHit) score += 5;
    scored.push({ url, score, platform, sameSite: host === siteHost });
  }
  // Also mine the flat links array from Firecrawl for platform URLs the anchor regex missed.
  for (const url of home.links) {
    const platform = detectPlatform(url);
    if (!platform) continue;
    scored.push({
      url,
      score: 100,
      platform,
      sameSite: normHost(url) === siteHost,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  // Best: a platform match anywhere.
  const platformHit = scored.find((s) => s.platform);
  if (platformHit)
    return { url: platformHit.url, platform: platformHit.platform };

  // Otherwise: follow the top same-site "/give" page and re-check for a platform there.
  const own = scored.find((s) => s.sameSite);
  if (own) {
    try {
      const give = await firecrawlScrape(own.url);
      const giveAnchors = extractAnchors(give.html);
      for (const a of giveAnchors) {
        const url = resolveUrl(own.url, a.href);
        if (!url) continue;
        const platform = detectPlatform(url);
        if (platform) return { url, platform };
      }
      for (const url of give.links) {
        const platform = detectPlatform(url);
        if (platform) return { url, platform };
      }
      // No platform found — still record the /give page as a best-effort link.
      return { url: own.url, platform: null };
    } catch {
      /* fall through */
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const adminCheck = await requireRegistryAdmin(req, admin);
    if (!adminCheck.ok) return adminCheck.response;

    const body = await req.json().catch(() => ({}));
    const explicitIds: string[] | undefined = Array.isArray(body.church_ids)
      ? body.church_ids
      : undefined;
    const limit = Math.min(Math.max(Number(body.limit ?? 15), 1), 50);

    let churches: Array<{
      id: string;
      website: string | null;
      legal_name: string;
    }>;
    if (explicitIds && explicitIds.length) {
      const { data } = await admin
        .from("churches")
        .select("id,website,legal_name")
        .in("id", explicitIds)
        .limit(limit);
      churches = (data ?? []) as any;
    } else {
      // Pick churches that need a verified giving link. Includes:
      //  - rows with no giving_url yet
      //  - rows whose giving_url was NOT set by a live scrape (guessed/seeded)
      //  - rows not yet auto-verified against a known processor
      // Skip ones scraped in the last 7 days to avoid re-hammering.
      const staleCutoff = new Date(Date.now() - 7 * 864e5).toISOString();
      const { data } = await admin
        .from("churches")
        .select(
          "id,website,legal_name,giving_url,giving_url_source,verification_status",
        )
        .not("website", "is", null)
        .neq("verification_status", "verified")
        .or(
          `enrichment_attempted_at.is.null,enrichment_attempted_at.lt.${staleCutoff}`,
        )
        .limit(limit);
      churches = (data ?? []) as any;
    }

    const results: Array<Record<string, unknown>> = [];
    for (const c of churches) {
      const patch: Record<string, unknown> = {
        enrichment_attempted_at: new Date().toISOString(),
        enrichment_last_error: null,
      };
      try {
        if (!c.website) throw new Error("no website");
        const hit = await findGivingLink(c.website);
        if (!hit) {
          patch.enrichment_last_error = "no giving link found";
          patch.enrichment_status = "enriched";
        } else {
          patch.giving_url = hit.url;
          patch.giving_url_source = "firecrawl_scrape";
          patch.enrichment_status = "enriched";
          if (hit.platform) {
            patch.giving_platform = hit.platform;
            // Auto-verify when the resolved URL points to a known processor.
            patch.verification_status = "verified";
            patch.last_verified_at = new Date().toISOString();
          }
        }
      } catch (e) {
        patch.enrichment_last_error = String((e as Error).message).slice(
          0,
          500,
        );
      }
      const { error: upErr } = await admin
        .from("churches")
        .update(patch)
        .eq("id", c.id);
      results.push({
        id: c.id,
        name: c.legal_name,
        ...(upErr ? { error: upErr.message } : patch),
      });
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      {
        headers: { ...cors, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String((e as Error).message) }),
      {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      },
    );
  }
});
