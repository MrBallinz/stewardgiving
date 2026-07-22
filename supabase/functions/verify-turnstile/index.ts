// Cloudflare Turnstile server-side siteverify.
// Frontend posts { token } (the cf-turnstile-response). We call the canonical
// siteverify endpoint with our TURNSTILE_SECRET and return { success }.
// Never call siteverify from the browser — the secret must stay server-side.

const ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/stewardgiving\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/,
  /^https:\/\/[a-z0-9-]+\.sandbox\.lovable\.dev$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

function buildCors(origin: string | null) {
  const allow = origin && ORIGIN_PATTERNS.some((r) => r.test(origin)) ? origin : "https://stewardgiving.lovable.app";
  return {
    "Access-Control-Allow-Origin": allow,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

Deno.serve(async (req) => {
  const cors = buildCors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "method_not_allowed" }), {
      status: 405, headers: { ...cors, "content-type": "application/json" },
    });
  }

  const secret = Deno.env.get("TURNSTILE_SECRET");
  if (!secret) {
    return new Response(JSON.stringify({ success: false, error: "server_not_configured" }), {
      status: 500, headers: { ...cors, "content-type": "application/json" },
    });
  }

  let token = "";
  try {
    const body = await req.json();
    token = typeof body?.token === "string" ? body.token : "";
  } catch {
    // fall through to empty-token check
  }
  if (!token) {
    return new Response(JSON.stringify({ success: false, error: "missing_token" }), {
      status: 400, headers: { ...cors, "content-type": "application/json" },
    });
  }

  const remoteip =
    req.headers.get("cf-connecting-ip") ??
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ??
    "";

  const form = new URLSearchParams({ secret, response: token });
  if (remoteip) form.set("remoteip", remoteip);

  const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const result = await resp.json().catch(() => ({ success: false, "error-codes": ["bad_upstream_response"] }));

  return new Response(
    JSON.stringify({ success: !!result.success, "error-codes": result["error-codes"] ?? [] }),
    { status: result.success ? 200 : 403, headers: { ...cors, "content-type": "application/json" } },
  );
});
