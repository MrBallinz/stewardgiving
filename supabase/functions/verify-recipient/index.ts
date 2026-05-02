// Verify a giving recipient by scraping their website + donation page with Firecrawl,
// extracting official name/EIN/logo, and confirming the donate URL is reachable and
// references the recipient's name. Updates the giving_recipients row for the caller.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ALLOWED_ORIGINS = new Set([
  "https://stewardgiving.lovable.app",
  "https://id-preview--f46fe20b-fd62-4cf4-8a60-9663e7eed2e3.lovable.app",
  "http://localhost:8080",
  "http://localhost:5173",
]);

function buildCors(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://stewardgiving.lovable.app";
  return {
    "Access-Control-Allow-Origin": allow,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// SSRF guard: reject private/loopback/link-local/metadata hosts and require https/http.
const BLOCKED_HOST_RE = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|::1|fe80:|metadata\.google\.|169\.254\.169\.254)/i;
function isUrlAllowed(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    if (BLOCKED_HOST_RE.test(u.hostname)) return false;
    // Block bare IPs in private ranges
    if (/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)) {
      const [a, b] = u.hostname.split(".").map(Number);
      if (a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254)) {
        return false;
      }
    }
    return true;
  } catch { return false; }
}

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";

type VerifyBody = {
  recipient_id: string;
};

type ExtractedOrg = {
  official_name?: string;
  ein?: string;
  logo_url?: string;
  is_donation_page?: boolean;
  mentions_recipient?: boolean;
};

async function firecrawlScrape(url: string, apiKey: string, opts: {
  formats: unknown[];
  onlyMainContent?: boolean;
  waitFor?: number;
}) {
  const res = await fetch(`${FIRECRAWL_V2}/scrape`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: opts.formats,
      onlyMainContent: opts.onlyMainContent ?? true,
      waitFor: opts.waitFor ?? 1500,
    }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticated client (RLS-bound to caller).
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as VerifyBody;
    if (!body?.recipient_id || typeof body.recipient_id !== "string") {
      return new Response(JSON.stringify({ error: "recipient_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load the recipient (RLS ensures the user owns it).
    const { data: recipient, error: rErr } = await supabase
      .from("giving_recipients")
      .select("id, name, donate_url, website, ein")
      .eq("id", body.recipient_id)
      .maybeSingle();
    if (rErr || !recipient) {
      return new Response(JSON.stringify({ error: "Recipient not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targets: { url: string; role: "website" | "donate" }[] = [];
    if (recipient.website) targets.push({ url: recipient.website, role: "website" });
    if (recipient.donate_url) targets.push({ url: recipient.donate_url, role: "donate" });

    if (targets.length === 0) {
      return new Response(
        JSON.stringify({ error: "Add a website or donate URL before verifying." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const extractionSchema = {
      type: "object",
      properties: {
        official_name: { type: "string", description: "The legal/official organization name shown on the page" },
        ein: { type: "string", description: "EIN / Tax ID in format XX-XXXXXXX, if visible" },
        logo_url: { type: "string", description: "Absolute URL of the org's primary logo image" },
        is_donation_page: { type: "boolean", description: "True if this page is clearly a giving/donation page" },
        mentions_recipient: { type: "boolean", description: `True if the page clearly references the organization "${recipient.name}"` },
      },
    };

    const issues: string[] = [];
    let verifiedName: string | null = null;
    let verifiedEin: string | null = null;
    let verifiedLogo: string | null = null;
    let donateReachable = false;
    let donateMentionsRecipient = false;
    let websiteReachable = false;

    for (const t of targets) {
      const r = await firecrawlScrape(t.url, FIRECRAWL_API_KEY, {
        formats: [
          { type: "json", schema: extractionSchema, prompt: `Extract organization info. The org is "${recipient.name}".` },
          "branding",
        ],
      });

      if (!r.ok) {
        issues.push(`${t.role}: scrape failed (${r.status})`);
        continue;
      }

      // Firecrawl v2 may nest under .data
      const payload = (r.data?.data ?? r.data) as Record<string, unknown>;
      const json = (payload?.json ?? {}) as ExtractedOrg;
      const branding = (payload?.branding ?? {}) as { logo?: string; images?: { logo?: string } };

      if (t.role === "website") {
        websiteReachable = true;
        if (json.official_name) verifiedName = json.official_name;
        if (json.ein && /^\d{2}-?\d{7}$/.test(json.ein.replace(/\s/g, ""))) {
          verifiedEin = json.ein.replace(/\s/g, "");
        }
        verifiedLogo = json.logo_url || branding?.logo || branding?.images?.logo || null;
      }

      if (t.role === "donate") {
        donateReachable = true;
        if (json.is_donation_page === false) issues.push("Donate URL doesn't look like a giving page.");
        if (json.mentions_recipient) donateMentionsRecipient = true;
        if (!verifiedLogo) verifiedLogo = json.logo_url || branding?.logo || branding?.images?.logo || null;
      }
    }

    // Decide overall status
    let status: "verified" | "review" | "failed" = "failed";
    if (donateReachable && (donateMentionsRecipient || websiteReachable)) {
      status = "verified";
    } else if (websiteReachable || donateReachable) {
      status = "review";
    }

    if (recipient.donate_url && !donateReachable) issues.push("Couldn't reach the donate URL.");
    if (recipient.ein && verifiedEin && recipient.ein.replace(/-/g, "") !== verifiedEin.replace(/-/g, "")) {
      issues.push("EIN on file doesn't match the EIN on the org's website.");
      status = "review";
    }

    const update = {
      verification_status: status,
      verified_at: new Date().toISOString(),
      verified_name: verifiedName,
      verified_logo_url: verifiedLogo,
      verified_ein: verifiedEin,
      verification_notes: issues.length ? issues.join(" • ") : null,
    };

    const { error: uErr } = await supabase
      .from("giving_recipients")
      .update(update)
      .eq("id", recipient.id);
    if (uErr) throw new Error(uErr.message);

    return new Response(JSON.stringify({ success: true, status, ...update }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("verify-recipient error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
