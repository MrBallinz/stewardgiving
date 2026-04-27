import { supabase } from "@/integrations/supabase/client";

// Seeds 6 months of realistic monthly summaries + transactions for a new user.
// Idempotent: skips if any summaries already exist for this user.
export async function seedMockMonthsIfEmpty(userId: string) {
  const { data: existing } = await supabase
    .from("monthly_summaries")
    .select("id")
    .eq("user_id", userId)
    .limit(1);
  if (existing && existing.length > 0) return;

  const { data: covenant } = await supabase
    .from("giving_covenants")
    .select("percent_of_profit")
    .eq("user_id", userId)
    .maybeSingle();
  const pct = Number(covenant?.percent_of_profit ?? 10);

  const { data: recipients } = await supabase
    .from("giving_recipients")
    .select("id, allocation_percent")
    .eq("user_id", userId);
  if (!recipients || recipients.length === 0) return;

  const now = new Date();
  // Months 6..1 ago, all completed; current month stays pending.
  const months: { date: Date; status: "pending" | "transferred" }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ date: d, status: i === 0 ? "pending" : "transferred" });
  }

  // Realistic small-business numbers, gentle growth + variance.
  const baseRevenue = 38000;
  const expenseRatio = 0.62;

  for (const { date, status } of months) {
    const growth = 1 + (6 - months.findIndex((m) => m.date === date)) * 0.02;
    const noise = 0.9 + Math.random() * 0.25;
    const revenue = Math.round(baseRevenue * growth * noise);
    const expenses = Math.round(revenue * (expenseRatio + (Math.random() - 0.5) * 0.05));
    const profit = revenue - expenses;
    const giving = Math.max(0, Math.round((profit * pct) / 100));

    const { data: summary, error } = await supabase
      .from("monthly_summaries")
      .insert({
        user_id: userId,
        month: date.toISOString().slice(0, 10),
        total_revenue: revenue,
        total_expenses: expenses,
        net_profit: profit,
        giving_percent: pct,
        giving_amount: giving,
        status,
      })
      .select("id")
      .single();
    if (error || !summary) continue;

    if (status === "transferred" && giving > 0) {
      const txs = recipients.map((r) => ({
        monthly_summary_id: summary.id,
        recipient_id: r.id,
        amount: Math.round((giving * Number(r.allocation_percent)) / 100),
        transferred_at: new Date(date.getFullYear(), date.getMonth(), 5).toISOString(),
        status: "completed" as const,
      }));
      await supabase.from("giving_transactions").insert(txs);
    }
  }
}
