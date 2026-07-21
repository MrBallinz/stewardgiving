import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthenticated, dbError } from "../supabase";

export default defineTool({
  name: "list_monthly_summaries",
  title: "List monthly summaries",
  description:
    "List monthly profit/giving summaries for the signed-in user. Excludes sample data by default.",
  inputSchema: {
    limit: z.number().int().min(1).max(60).default(12).describe("Max months to return (default 12)."),
    include_sample: z.boolean().default(false).describe("Include sample/demo data. Defaults to false."),
    year: z.number().int().min(2000).max(2100).nullable().default(null)
      .describe("Filter to a specific calendar year, or null for all years."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, include_sample, year }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    let q = supabaseForUser(ctx)
      .from("monthly_summaries")
      .select("id, month, total_revenue, total_expenses, net_profit, giving_percent, giving_amount, status, source, is_sample, reviewed_at, created_at")
      .eq("user_id", ctx.getUserId()!)
      .order("month", { ascending: false })
      .limit(limit);
    if (!include_sample) q = q.eq("is_sample", false);
    if (year != null) q = q.gte("month", `${year}-01-01`).lt("month", `${year + 1}-01-01`);
    const { data, error } = await q;
    if (error) return dbError(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify({ summaries: data }, null, 2) }],
      structuredContent: { summaries: data ?? [] },
    };
  },
});
