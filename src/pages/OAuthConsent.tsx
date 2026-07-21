import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/AppShell";

// Local typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthClient = { name?: string; client_name?: string; redirect_uris?: string[] };
type OAuthDetails = {
  client?: OAuthClient;
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};
const authOauth = (supabase.auth as unknown as {
  oauth: {
    getAuthorizationDetails: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
    approveAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
    denyAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
  };
}).oauth;

const OAuthConsent = () => {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<OAuthDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) { setError("Missing authorization_id."); setLoading(false); return; }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await authOauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) { setError(error.message); setLoading(false); return; }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) { window.location.href = immediate; return; }
      setDetails(data);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await authOauth.approveAuthorization(authorizationId)
      : await authOauth.denyAuthorization(authorizationId);
    if (error) { setBusy(false); setError(error.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setError("No redirect returned by the authorization server."); return; }
    window.location.href = target;
  }

  const clientName = details?.client?.client_name || details?.client?.name || "an external app";
  const scopes = (details?.scope ?? "").split(/\s+/).filter(Boolean);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Logo />
          <span className="font-serif text-xl font-semibold">Steward</span>
        </Link>

        <Card className="p-8 shadow-card border-border/60 space-y-6">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading authorization…
            </div>
          ) : error ? (
            <div className="space-y-3">
              <h1 className="font-serif text-2xl font-semibold">Authorization error</h1>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" asChild><Link to="/dashboard">Back to Steward</Link></Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gold-soft grid place-items-center">
                  <ShieldCheck className="h-5 w-5 text-gold-foreground" />
                </div>
                <h1 className="font-serif text-2xl font-semibold leading-tight">
                  Connect {clientName} to Steward
                </h1>
              </div>

              <p className="text-sm text-muted-foreground">
                This lets <span className="font-medium text-foreground">{clientName}</span> use
                Steward as you. It can read your covenant, chosen recipients, monthly summaries,
                and giving history — nothing more. Steward's Row-Level Security still governs
                every request; this does not bypass any protection.
              </p>

              {scopes.length > 0 && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="uppercase tracking-wider">Requested identity</div>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {scopes.includes("openid") && <li>Confirm your Steward identity</li>}
                    {scopes.includes("email") && <li>Share your email address</li>}
                    {scopes.includes("profile") && <li>Share your basic profile</li>}
                    {scopes.filter((s) => !["openid", "email", "profile"].includes(s)).map((s) => (
                      <li key={s}>Additional permission: {s}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button className="flex-1" onClick={() => decide(true)} disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Approve
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => decide(false)} disabled={busy}>
                  Cancel
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground text-center pt-2">
                You can revoke access at any time from Settings.
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default OAuthConsent;
