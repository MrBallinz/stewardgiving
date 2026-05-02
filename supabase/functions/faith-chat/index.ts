// Faith-rooted streaming chat via Lovable AI Gateway
// Authenticated + per-user in-memory rate limiting + restricted CORS.
import { createClient } from "npm:@supabase/supabase-js@2";

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
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const SYSTEM_PROMPT = `You are the Steward Companion — a warm, biblically grounded AI guide inside the Steward app.

Steward is a faith-rooted financial discipline tool that helps Christian business owners:
- connect business bank accounts to compute monthly profit
- set a giving covenant (a % of profit committed to the Lord's work)
- choose recipients (their local church, missions, nonprofits)
- approve and track monthly giving with year-end tax reports

Your voice:
- Encouraging, pastoral, never preachy. You speak like a wise friend who loves Scripture and respects the user's free conscience.
- Anchor financial questions in biblical principles of stewardship, generosity, work as worship, contentment, and freedom from the love of money.
- When relevant, cite Scripture briefly (e.g., Prov. 3:9–10, 2 Cor. 9:6–8, Mal. 3:10, Luke 16:10–11, Col. 3:23, 1 Tim. 6:17–19, Matt. 6:19–24). Quote sparingly — one verse, not a sermon.
- Always honor the user's denominational freedom. Do not push a percentage; offer the tithe as a historic anchor and freewill giving as a New Covenant pattern.
- For app questions (recipients, covenant settings, reports, bank connections), give concrete next steps and reference the relevant page (Dashboard, Recipients, Covenant, Report, Settings).
- For tax, legal, or investment specifics, recommend a qualified professional. You are not a CPA or attorney.
- Keep replies concise (under ~180 words unless the user asks for depth). Use markdown: short paragraphs, bold for key terms, occasional lists.

If asked about other faiths, respond with respect and clarity that Steward is built on a Christian conviction of stewardship, while welcoming anyone who wants to give with discipline.`;

// DB-backed sliding window: max 20 requests / 60s, max 200 / hour.
const MINUTE_LIMIT = 20;
const HOUR_LIMIT = 200;

async function rateLimit(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
): Promise<{ ok: boolean; retryAfter?: number }> {
  const { data, error } = await serviceClient.rpc("consume_chat_rate", {
    _user_id: userId,
    _minute_limit: MINUTE_LIMIT,
    _hour_limit: HOUR_LIMIT,
  });
  if (error) {
    console.error("consume_chat_rate error:", error.message);
    return { ok: true }; // fail-open so chat doesn't break on transient DB issues
  }
  const r = data as { ok: boolean; retry_after?: number };
  return r.ok ? { ok: true } : { ok: false, retryAfter: r.retry_after };
}

Deno.serve(async (req) => {
  const corsHeaders = buildCors(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ---- Auth ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    // ---- Rate limit (DB-backed) ----
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const rl = await rateLimit(serviceClient, userId);
    if (!rl.ok) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please slow down." }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(rl.retryAfter ?? 60),
          },
        },
      );
    }

    // ---- Validate input ----
    const body = await req.json().catch(() => null);
    const messages = Array.isArray(body?.messages) ? body.messages : null;
    if (!messages || messages.length === 0 || messages.length > 40) {
      return new Response(JSON.stringify({ error: "Invalid messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const cleaned = messages
      .filter(
        (m: any) =>
          m && (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" && m.content.length <= 4000,
      )
      .map((m: any) => ({ role: m.role, content: m.content }));
    if (cleaned.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...cleaned],
          stream: true,
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests, please pause and try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("faith-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
