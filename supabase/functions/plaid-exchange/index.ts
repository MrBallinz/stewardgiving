import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { plaidFetch } from "../_shared/plaid.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const publicToken = body?.public_token;
    const institution = body?.institution ?? {};
    if (!publicToken || typeof publicToken !== "string") {
      return new Response(JSON.stringify({ error: "public_token required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const exchange = await plaidFetch<{ access_token: string; item_id: string }>(
      "/item/public_token/exchange",
      { public_token: publicToken }
    );

    // Service-role client so we can write the access token (locked from clients)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const row = {
      user_id: userId,
      provider: "plaid",
      plaid_item_id: exchange.item_id,
      plaid_access_token: exchange.access_token,
      institution_name: institution?.name ?? null,
      institution_id: institution?.institution_id ?? null,
      status: "active",
    };

    const { data: upserted, error: upsertErr } = await admin
      .from("bank_connections")
      .upsert(row, { onConflict: "plaid_item_id" })
      .select("id")
      .single();
    if (upsertErr) throw upsertErr;

    return new Response(
      JSON.stringify({ ok: true, bank_connection_id: upserted?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
