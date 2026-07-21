import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthenticated, dbError } from "../supabase";

export default defineTool({
  name: "get_ytd_summary",
  title: "Get YTD giving summary",
  description:
    "Return a year-to-date rollup for the signed-in user: total revenue, total expenses, net profit, total giving, and per-recipient breakdown. Excludes sample data.",
  inputSchema: {
    year: z.number().int().min(2000).max(2100).nullable().default(null)
      .describe("Calendar year. Defaults to the current year."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ year }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const y = year ?? new Date().getUTCFullYear();
    const sb = supabaseForUser(ctx);
    const uid = ctx.getUserId()!;

    const { data: summaries, error: sErr } = await sb
      .from("monthly_summaries")
      .select("id, month, total_revenue, total_expenses, net_profit, giving_amount, status")
      .eq("user_id", uid)
      .eq("is_sample", false)
      .gte("month", `${y}-01-01`)
      .lt("month", `${y + 1}-01-01`);
    if (sErr) return dbError(sErr.message);

    const summaryIds = (summaries ?? []).map((s) => s.id);
    let byRecipient: Record<string, { amount: number; name?: string }> = {};
    if (summaryIds.length) {
      const { data: txs, error: tErr } = await sb
        .from("giving_transactions")
        .select("amount, status, recipient_id")
        .in("monthly_summary_id", summaryIds)
        .eq("is_sample", false)
        .in("status", ["completed", "transferred"]);
      if (tErr) return dbError(tErr.message);

      const recipientIds = Array.from(new Set((txs ?? []).map((t) => t.recipient_id)));
      const { data: recips } = recipientIds.length
        ? await sb.from("giving_recipients").select("id, name, verified_name").in("id", recipientIds)
        : { data: [] as { id: string; name: string; verified_name: string | null }[] };
      const nameById = new Map((recips ?? []).map((r) => [r.id, r.verified_name || r.name]));

      for (const t of txs ?? []) {
        const key = t.recipient_id;
        if (!byRecipient[key]) byRecipient[key] = { amount: 0, name: nameById.get(key) };
        byRecipient[key].amount += Number(t.amount ?? 0);
      }
    }

    const totals = (summaries ?? []).reduce(
      (acc, s) => ({
        revenue: acc.revenue + Number(s.total_revenue ?? 0),
        expenses: acc.expenses + Number(s.total_expenses ?? 0),
        profit: acc.profit + Number(s.net_profit ?? 0),
        giving_planned: acc.giving_planned + Number(s.giving_amount ?? 0),
      }),
      { revenue: 0, expenses: 0, profit: 0, giving_planned: 0 },
    );
    const giving_sent = Object.values(byRecipient).reduce((s, r) => s + r.amount, 0);

    const result = {
      year: y,
      months_recorded: summaries?.length ?? 0,
      totals: { ...totals, giving_sent },
      by_recipient: Object.entries(byRecipient).map(([id, v]) => ({
        recipient_id: id,
        name: v.name,
        amount: v.amount,
      })),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
