import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { plaidFetch } from "../_shared/plaid.ts";

type PlaidTx = {
  transaction_id: string;
  account_id: string;
  amount: number;                // positive = money leaving account
  iso_currency_code: string | null;
  date: string;                  // YYYY-MM-DD
  name: string | null;
  merchant_name: string | null;
  pending: boolean;
  personal_finance_category?: { primary?: string; detailed?: string } | null;
};

// Plaid: positive amount = outflow (expense). Negative = inflow (revenue).
function classify(t: PlaidTx): "revenue" | "expense" | "transfer" {
  const primary = (t.personal_finance_category?.primary ?? "").toUpperCase();
  if (primary === "TRANSFER_IN" || primary === "TRANSFER_OUT" || primary === "LOAN_PAYMENTS" || primary === "BANK_FEES") {
    // treat internal transfers as neutral by default
    if (primary.startsWith("TRANSFER")) return "transfer";
  }
  return t.amount < 0 ? "revenue" : "expense";
}

async function fetchDefaultGivingPercent(admin: any, userId: string): Promise<number> {
  const { data } = await admin.from("giving_covenants").select("percent").eq("user_id", userId).maybeSingle();
  const p = Number(data?.percent ?? 10);
  return isFinite(p) && p > 0 ? p : 10;
}

async function recomputeMonthlySummaries(admin: any, userId: string, affectedMonths: Set<string>) {
  if (affectedMonths.size === 0) return;
  const givingPct = await fetchDefaultGivingPercent(admin, userId);

  for (const monthStart of affectedMonths) {
    // Sum revenue and expenses for the month, excluding user-marked "excluded" / "transfer" rows.
    const nextMonth = new Date(monthStart + "T00:00:00Z");
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
    const endDate = nextMonth.toISOString().slice(0, 10);

    const { data: rows, error } = await admin
      .from("plaid_transactions")
      .select("amount_cents, classification, excluded")
      .eq("user_id", userId)
      .gte("posted_date", monthStart)
      .lt("posted_date", endDate);
    if (error) throw error;

    let revenueCents = 0;
    let expenseCents = 0;
    for (const r of rows ?? []) {
      if (r.excluded || r.classification === "transfer" || r.classification === "excluded") continue;
      const cls = r.classification === "auto"
        ? (Number(r.amount_cents) < 0 ? "revenue" : "expense")
        : r.classification;
      if (cls === "revenue") revenueCents += Math.abs(Number(r.amount_cents));
      else if (cls === "expense") expenseCents += Math.abs(Number(r.amount_cents));
    }
    const revenue = revenueCents / 100;
    const expenses = expenseCents / 100;
    const netProfit = Math.max(0, revenue - expenses);
    const givingAmount = Math.round(netProfit * (givingPct / 100) * 100) / 100;

    // Preserve status if user has already reviewed/completed.
    const { data: existing } = await admin
      .from("monthly_summaries")
      .select("id, status")
      .eq("user_id", userId)
      .eq("month", monthStart)
      .maybeSingle();

    const status = existing?.status && ["transferred", "completed", "reviewed", "skipped"].includes(existing.status)
      ? existing.status
      : "pending";

    const payload = {
      user_id: userId,
      month: monthStart,
      total_revenue: revenue,
      total_expenses: expenses,
      net_profit: netProfit,
      giving_percent: givingPct,
      giving_amount: givingAmount,
      status,
      is_sample: false,
      source: "plaid",
    };
    if (existing?.id) {
      await admin.from("monthly_summaries").update(payload).eq("id", existing.id);
    } else {
      await admin.from("monthly_summaries").insert(payload);
    }
  }
}

async function syncConnection(admin: any, conn: any) {
  const accessToken = conn.plaid_access_token as string;
  let cursor: string | null = conn.sync_cursor ?? null;
  let hasMore = true;
  const affectedMonths = new Set<string>();

  while (hasMore) {
    const res: any = await plaidFetch("/transactions/sync", {
      access_token: accessToken,
      cursor: cursor ?? undefined,
      count: 500,
    });

    const added: PlaidTx[] = res.added ?? [];
    const modified: PlaidTx[] = res.modified ?? [];
    const removed: { transaction_id: string }[] = res.removed ?? [];

    const upserts = [...added, ...modified].map((t) => {
      const monthStart = t.date.slice(0, 7) + "-01";
      affectedMonths.add(monthStart);
      return {
        user_id: conn.user_id,
        bank_connection_id: conn.id,
        plaid_transaction_id: t.transaction_id,
        account_id: t.account_id,
        posted_date: t.date,
        amount_cents: Math.round(Number(t.amount) * 100),
        iso_currency_code: t.iso_currency_code ?? "USD",
        name: t.name,
        merchant_name: t.merchant_name,
        pf_category_primary: t.personal_finance_category?.primary ?? null,
        pf_category_detailed: t.personal_finance_category?.detailed ?? null,
        pending: !!t.pending,
        classification: classify(t),
      };
    });

    if (upserts.length) {
      const { error } = await admin
        .from("plaid_transactions")
        .upsert(upserts, { onConflict: "plaid_transaction_id" });
      if (error) throw error;
    }

    if (removed.length) {
      const ids = removed.map((r) => r.transaction_id);
      // Find months of removed rows before deleting
      const { data: toRemove } = await admin
        .from("plaid_transactions")
        .select("posted_date")
        .in("plaid_transaction_id", ids);
      for (const r of toRemove ?? []) affectedMonths.add(String(r.posted_date).slice(0, 7) + "-01");
      await admin.from("plaid_transactions").delete().in("plaid_transaction_id", ids);
    }

    cursor = res.next_cursor;
    hasMore = !!res.has_more;
  }

  await admin
    .from("bank_connections")
    .update({ sync_cursor: cursor, last_sync_at: new Date().toISOString(), status: "active" })
    .eq("id", conn.id);

  await recomputeMonthlySummaries(admin, conn.user_id, affectedMonths);
  return { months: [...affectedMonths] };
}

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
    const { data: claims, error } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (error || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claims.claims.sub as string;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: connections, error: connErr } = await admin
      .from("bank_connections")
      .select("id, user_id, plaid_access_token, sync_cursor")
      .eq("user_id", userId)
      .not("plaid_access_token", "is", null);
    if (connErr) throw connErr;

    const results: any[] = [];
    for (const conn of connections ?? []) {
      try {
        const r = await syncConnection(admin, conn);
        results.push({ id: conn.id, ...r });
      } catch (e: any) {
        results.push({ id: conn.id, error: e?.message ?? "sync failed" });
        await admin.from("bank_connections").update({ status: "error" }).eq("id", conn.id);
      }
    }

    return new Response(JSON.stringify({ ok: true, synced: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
