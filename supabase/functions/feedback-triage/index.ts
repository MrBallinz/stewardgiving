// Feedback triage: classifies user feedback and drafts an auto-reply
// for known issue patterns. Requires JWT auth.
import { createClient } from "npm:@supabase/supabase-js@2";

const ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/stewardgiving\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/,
  /^https:\/\/[a-z0-9-]+\.sandbox\.lovable\.dev$/,
  /^http:\/\/localhost(:\d+)?$/,
];

function buildCors(origin: string | null) {
  const allow =
    origin && ORIGIN_PATTERNS.some((r) => r.test(origin))
      ? origin
      : "https://stewardgiving.lovable.app";
  return {
    "Access-Control-Allow-Origin": allow,
    Vary: "Origin",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const SYSTEM = `You are the Steward triage agent. Steward is a faith-rooted giving app
(Plaid bank connections, monthly profit + covenant %, church directory, one-click giving
via each recipient's own platform — Steward never moves money itself).

Given a user's feedback message, respond with STRICT JSON:
{
  "category": "bug" | "ux" | "feature" | "billing" | "data" | "question" | "praise",
  "severity": "low" | "medium" | "high" | "critical",
  "auto_reply": string | null,
  "confident": boolean
}

Set "auto_reply" (a friendly, pastoral 2-4 sentence response with a concrete next step)
ONLY when confident=true AND the issue matches a well-known pattern below. Otherwise
return null and the message goes to an admin.

Known patterns you may auto-reply to:
- Plaid "invalid phone number" → tell them Plaid Sandbox only accepts test numbers
  (415-555-0010, OTP 1234, user_good / pass_good).
- Plaid Link doesn't open / button does nothing → suggest disabling ad-blockers,
  and note the Dashboard "Connect bank" button.
- Church not in directory → point to the "Suggest a church" form on the Recipients page.
- Giving link wrong → ask them to use "Report this link" on the recipient card.
- Can't sign in / forgot password → point to /forgot-password.
- Google sign-in loop → suggest signing in on the published URL (stewardgiving.lovable.app).
- Where are my reports → point to /report.
- Praise / thanks → warmly acknowledge with brief scripture (Prov 3:9 or similar).

Never invent product features. Never promise a fix timeline. Do not answer tax,
legal, or investment specifics — defer to a qualified professional.`;

Deno.serve(async (req) => {
  const cors = buildCors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } =
      await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => null);
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const route = typeof body?.route === "string" ? body.route.slice(0, 200) : null;
    const userAgent =
      typeof body?.userAgent === "string" ? body.userAgent.slice(0, 500) : null;
    const viewport =
      typeof body?.viewport === "string" ? body.viewport.slice(0, 40) : null;

    if (!message || message.length < 3 || message.length > 4000) {
      return new Response(JSON.stringify({ error: "Invalid message" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Service client for writes that bypass RLS predictably.
    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Ask Lovable AI for triage.
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let triage = {
      category: "question",
      severity: "low",
      auto_reply: null as string | null,
      confident: false,
    };

    if (LOVABLE_API_KEY) {
      try {
        const r = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: SYSTEM },
                {
                  role: "user",
                  content: `Route: ${route ?? "unknown"}\nMessage:\n${message}`,
                },
              ],
              response_format: { type: "json_object" },
            }),
          },
        );
        if (r.ok) {
          const j = await r.json();
          const raw = j.choices?.[0]?.message?.content ?? "{}";
          const parsed = JSON.parse(raw);
          triage = {
            category: parsed.category ?? "question",
            severity: parsed.severity ?? "low",
            auto_reply:
              parsed.confident && typeof parsed.auto_reply === "string"
                ? parsed.auto_reply
                : null,
            confident: !!parsed.confident,
          };
        }
      } catch (e) {
        console.error("triage AI error", e);
      }
    }

    const status = triage.auto_reply ? "auto_resolved" : "new";

    const { data: inserted, error: insErr } = await service
      .from("feedback")
      .insert({
        user_id: userId,
        route,
        user_agent: userAgent,
        viewport,
        message,
        category: triage.category,
        severity: triage.severity,
        ai_reply: triage.auto_reply,
        status,
      })
      .select("id")
      .single();

    if (insErr) {
      console.error("feedback insert error", insErr);
      return new Response(JSON.stringify({ error: "Save failed" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // If we have a confident reply, drop a notification for the user too.
    if (triage.auto_reply) {
      await service.from("notifications").insert({
        user_id: userId,
        kind: "feedback_reply",
        title: "Steward Companion replied",
        body: triage.auto_reply,
        action_url: "/settings",
        metadata: { feedback_id: inserted.id, ai: true },
      });
    }

    return new Response(
      JSON.stringify({
        id: inserted.id,
        status,
        auto_reply: triage.auto_reply,
        category: triage.category,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("feedback-triage error", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
