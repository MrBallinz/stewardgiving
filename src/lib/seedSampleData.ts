// Steward — sample data seeder.
// ONLY runs when the user explicitly clicks "Load sample dashboard data".
// Every row is marked is_sample = true so the year-end report excludes it by default.

import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, subMonths, formatISO } from "date-fns";

export async function seedSampleData(userId: string): Promise<{ inserted: number }> {
  // Pull the user's existing recipients to spread sample giving across them.
  // If they have none, create one labeled sample recipient.
  let { data: recips } = await supabase
    .from("giving_recipients")
    .select("id,allocation_percent")
    .eq("user_id", userId);

  if (!recips || recips.length === 0) {
    const { data, error } = await supabase
      .from("giving_recipients")
      .insert({
        user_id: userId,
        name: "Sample Church (demo)",
        type: "church",
        allocation_percent: 100,
        giving_method: "manual",
      } as any)
      .select("id,allocation_percent")
      .single();
    if (error) throw error;
    recips = [data!];
  }

  const totalAlloc = recips.reduce((s, r) => s + Number(r.allocation_percent || 0), 0) || 100;

  // 6 months of plausible numbers.
  const months = Array.from({ length: 6 }, (_, i) => startOfMonth(subMonths(new Date(), i)));
  let inserted = 0;

  for (const m of months) {
    const revenue = 28000 + Math.round(Math.random() * 14000); // 28k–42k
    const expenses = Math.round(revenue * (0.55 + Math.random() * 0.15)); // 55–70%
    const profit = revenue - expenses;
    const givingPct = 10;
    const giving = Math.round(profit * (givingPct / 100));

    const { data: summary, error: sErr } = await supabase
      .from("monthly_summaries")
      .upsert(
        {
          user_id: userId,
          month: formatISO(m, { representation: "date" }),
          total_revenue: revenue,
          total_expenses: expenses,
          net_profit: profit,
          giving_percent: givingPct,
          giving_amount: giving,
          status: "pending",
          is_sample: true,
          source: "manual",
        } as any,
        { onConflict: "user_id,month" }
      )
      .select("id")
      .single();
    if (sErr) throw sErr;

    // Create sample transactions across recipients.
    const txs = recips.map((r) => ({
      monthly_summary_id: summary!.id,
      recipient_id: r.id,
      amount: Math.round((giving * Number(r.allocation_percent)) / totalAlloc),
      status: "pending",
      is_sample: true,
    }));
    if (txs.length) {
      const { error: txErr } = await supabase.from("giving_transactions").insert(txs as any);
      if (txErr) throw txErr;
      inserted += txs.length;
    }
  }

  return { inserted };
}

export async function clearSampleData(userId: string): Promise<void> {
  // Find sample summaries → delete their transactions, then summaries.
  const { data: summaries } = await supabase
    .from("monthly_summaries")
    .select("id")
    .eq("user_id", userId)
    .eq("is_sample", true);
  const ids = (summaries ?? []).map((s) => s.id);
  if (ids.length === 0) return;
  await supabase.from("giving_transactions").delete().in("monthly_summary_id", ids);
  await supabase.from("monthly_summaries").delete().in("id", ids);
}
