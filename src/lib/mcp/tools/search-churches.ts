import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon, dbError } from "../supabase";

/**
 * Public church directory search. RLS on `churches` allows read for
 * authenticated users; this tool acts as the signed-in Steward user.
 */
export default defineTool({
  name: "search_churches",
  title: "Search church directory",
  description:
    "Search Steward's public church directory by name, alias, city, state, or pastor. Returns basic identity plus known giving platform info so the caller can point users toward the right giving page.",
  inputSchema: {
    query: z.string().trim().min(2).max(120).describe("Search text — name, alias, or pastor name."),
    state: z.string().trim().length(2).nullable().default(null).describe("Optional 2-letter US state filter."),
    limit: z.number().int().min(1).max(25).default(10),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ query, state, limit }) => {
    const sb = supabaseAnon();
    // Escape special PostgREST or() chars in the user query.
    const q = query.replace(/[,()"']/g, " ").trim();
    const pattern = `%${q}%`;
    let req = sb
      .from("churches")
      .select("id, legal_name, dba_name, aliases, city, state, denomination, website, giving_platform, giving_url, pastor_name, verification_status")
      .or(
        `legal_name.ilike.${pattern},dba_name.ilike.${pattern},pastor_name.ilike.${pattern},aliases.cs.{${q}}`,
      )
      .limit(limit);
    if (state) req = req.eq("state", state.toUpperCase());
    const { data, error } = await req;
    if (error) return dbError(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify({ churches: data }, null, 2) }],
      structuredContent: { churches: data ?? [] },
    };
  },
});
