import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser, notAuthenticated, dbError } from "../supabase";

export default defineTool({
  name: "get_profile",
  title: "Get profile",
  description:
    "Return the signed-in Steward user's profile: full name, business name, business type, and onboarding status.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("profiles")
      .select("full_name, business_name, business_type, onboarded, created_at")
      .eq("id", ctx.getUserId()!)
      .maybeSingle();
    if (error) return dbError(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? {}, null, 2) }],
      structuredContent: { profile: data },
    };
  },
});
