import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthenticated, dbError } from "../supabase";

export default defineTool({
  name: "list_recipients",
  title: "List giving recipients",
  description:
    "List the signed-in user's chosen giving recipients (church, missions, nonprofits) with allocation percentages, verification status, and their giving-page URL when known.",
  inputSchema: {
    include_unverified: z
      .boolean()
      .default(true)
      .describe("Include recipients that have not been verified yet. Defaults to true."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ include_unverified }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    let query = supabaseForUser(ctx)
      .from("giving_recipients")
      .select(
        "id, name, type, allocation_percent, ein, platform, donate_url, website, verification_status, verified_name, church_id, notes, created_at",
      )
      .eq("user_id", ctx.getUserId()!)
      .order("allocation_percent", { ascending: false });
    if (!include_unverified) query = query.eq("verification_status", "verified");
    const { data, error } = await query;
    if (error) return dbError(error.message);
    const total = (data ?? []).reduce((s, r) => s + Number(r.allocation_percent ?? 0), 0);
    return {
      content: [
        { type: "text", text: JSON.stringify({ recipients: data, allocation_total: total }, null, 2) },
      ],
      structuredContent: { recipients: data ?? [], allocation_total: total },
    };
  },
});
