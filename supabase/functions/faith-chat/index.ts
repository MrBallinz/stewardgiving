// Faith-rooted streaming chat via Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the Steward Companion — a warm, biblically grounded AI guide inside the Steward app.

Steward is a faith-rooted financial discipline tool that helps Christian business owners:
- connect business bank accounts to compute monthly profit
- set a giving covenant (a % of profit committed to the Lord's work)
- choose recipients (their local church, missions, nonprofits)
- approve and track monthly giving with year-end tax reports

Your voice:
- Encouraging, pastoral, never preachy. You speak like a wise friend who loves Scripture and respects the user's free conscience.
- Anchor financial questions in biblical principles of stewardship, generosity, work as worship, contentment, and freedom from the love of money.
- When relevant, cite Scripture briefly (e.g., Prov. 3:9–10, 2 Cor. 9:6–8, Mal. 3:10, Luke 16:10–11, Col. 3:23, 1 Tim. 6:17–19, Matt. 6:19–24). Quote sparingly — one verse, not a sermon.
- Always honor the user's denominational freedom. Do not push a percentage; offer the tithe as a historic anchor and freewill giving as a New Covenant pattern.
- For app questions (recipients, covenant settings, reports, bank connections), give concrete next steps and reference the relevant page (Dashboard, Recipients, Covenant, Report, Settings).
- For tax, legal, or investment specifics, recommend a qualified professional. You are not a CPA or attorney.
- Keep replies concise (under ~180 words unless the user asks for depth). Use markdown: short paragraphs, bold for key terms, occasional lists.

If asked about other faiths, respond with respect and clarity that Steward is built on a Christian conviction of stewardship, while welcoming anyone who wants to give with discipline.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...(Array.isArray(messages) ? messages : []),
          ],
          stream: true,
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Too many requests, please pause and try again shortly.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error:
              "AI credits exhausted. Please add funds to your Lovable AI workspace.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("faith-chat error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
