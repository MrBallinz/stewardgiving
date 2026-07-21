import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser, notAuthenticated, dbError } from "../supabase";

export default defineTool({
  name: "get_covenant",
  title: "Get giving covenant",
  description:
    "Return the signed-in user's giving covenant: percent of monthly profit committed, monthly minimum, auto-transfer flag, and their chosen scripture anchor.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("giving_covenants")
      .select("percent_of_profit, minimum_monthly, auto_transfer, scripture_anchor, updated_at")
      .eq("user_id", ctx.getUserId()!)
      .maybeSingle();
    if (error) return dbError(error.message);
    if (!data) {
      return {
        content: [{ type: "text", text: "No covenant set yet." }],
        structuredContent: { covenant: null },
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { covenant: data },
    };
  },
});
