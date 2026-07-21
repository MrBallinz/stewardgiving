import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getCovenantTool from "./tools/get-covenant";
import listRecipientsTool from "./tools/list-recipients";
import listMonthlySummariesTool from "./tools/list-monthly-summaries";
import listTransactionsTool from "./tools/list-transactions";
import getYtdSummaryTool from "./tools/get-ytd-summary";
import searchChurchesTool from "./tools/search-churches";
import getProfileTool from "./tools/get-profile";

// The OAuth issuer MUST be the direct Supabase host, built from the project ref
// (never SUPABASE_URL — that may be a proxy). VITE_SUPABASE_PROJECT_ID is inlined
// by Vite at build time so this stays import-safe.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "steward-mcp",
  title: "Steward",
  version: "0.1.0",
  instructions:
    "Read-only tools for a Steward user's stewardship data: giving covenant, chosen recipients, monthly summaries, individual gift transactions, YTD totals, and the public church directory. All per-user tools act as the signed-in user and are scoped by RLS. Steward never moves money — use these tools for reporting, analysis, and pastoral encouragement, not to initiate transfers.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getProfileTool,
    getCovenantTool,
    listRecipientsTool,
    listMonthlySummariesTool,
    listTransactionsTool,
    getYtdSummaryTool,
    searchChurchesTool,
  ],
});
