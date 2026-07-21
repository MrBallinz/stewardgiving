import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthenticated, dbError } from "../supabase";

export default defineTool({
  name: "list_transactions",
  title: "List giving transactions",
  description:
    "List individual gift transactions for the signed-in user. Steward never moves money; each transaction records a gift the user made through the recipient's own giving page.",
  inputSchema: {
    limit: z.number().int().min(1).max(200).default(50),
    status: z.enum(["pending", "completed", "transferred", "all"]).default("all"),
    include_sample: z.boolean().default(false),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, status, include_sample }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    let q = supabaseForUser(ctx)
      .from("giving_transactions")
      .select("id, recipient_id, monthly_summary_id, amount, status, payment_method, marked_paid_at, transferred_at, is_sample, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (status !== "all") q = q.eq("status", status);
    if (!include_sample) q = q.eq("is_sample", false);
    const { data, error } = await q;
    if (error) return dbError(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify({ transactions: data }, null, 2) }],
      structuredContent: { transactions: data ?? [] },
    };
  },
});
