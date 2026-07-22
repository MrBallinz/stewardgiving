// Steward — admin control room for populating the church registry.
// Gated server-side by ADMIN_EMAILS env in the edge functions; the UI
// simply invokes them and streams progress.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, Play, Search, ShieldCheck, LogOut, Check, X, ExternalLink, Flag } from "lucide-react";
import { TOP_METROS } from "@/lib/top-metros";
import { Textarea } from "@/components/ui/textarea";

type QueueRow = {
  id: string;
  legal_name: string;
  dba_name: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  giving_url: string | null;
  giving_platform: string | null;
  listing_status: "pending" | "approved" | "rejected" | "flagged";
  source_type: string;
  submitted_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

type ReportRow = {
  id: string;
  church_id: string;
  reason: string;
  details: string | null;
  status: "open" | "reviewed" | "dismissed" | "actioned";
  created_at: string;
  churches?: { legal_name: string; dba_name: string | null; giving_url: string | null } | null;
};


type Counts = { total: number; with_website: number; with_giving_url: number; verified: number };

export default function AdminRegistry() {
  const { user, loading: authLoading } = useAuth();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [limit, setLimit] = useState(20);
  const [enrichLimit, setEnrichLimit] = useState(15);
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [queueBusy, setQueueBusy] = useState<string | null>(null);
  const [rejectFor, setRejectFor] = useState<QueueRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const appendLog = (line: string) => setLog((l) => [`${new Date().toLocaleTimeString()} · ${line}`, ...l].slice(0, 200));

  const refresh = async () => {
    const [{ count: total }, { count: withSite }, { count: withGive }, { count: verified }, { data: q }, { data: rep }] = await Promise.all([
      supabase.from("churches").select("*", { count: "exact", head: true }),
      supabase.from("churches").select("*", { count: "exact", head: true }).not("website", "is", null),
      supabase.from("churches").select("*", { count: "exact", head: true }).not("giving_url", "is", null),
      supabase.from("churches").select("*", { count: "exact", head: true }).eq("verification_status", "verified"),
      supabase.from("churches")
        .select("id, legal_name, dba_name, city, state, website, giving_url, giving_platform, listing_status, source_type, submitted_by_user_id, created_at, updated_at")
        .in("listing_status", ["pending", "flagged"])
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("church_reports")
        .select("id, church_id, reason, details, status, created_at, churches(legal_name, dba_name, giving_url)")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    setCounts({
      total: total ?? 0,
      with_website: withSite ?? 0,
      with_giving_url: withGive ?? 0,
      verified: verified ?? 0,
    });
    setQueue((q as QueueRow[]) ?? []);
    setReports((rep as unknown as ReportRow[]) ?? []);
  };


  useEffect(() => { refresh(); }, []);

  const discover = async (c: string, s: string, n: number) => {
    setBusy(`discover:${c}`);
    appendLog(`Discovering churches in ${c}, ${s}…`);
    const { data, error } = await supabase.functions.invoke("registry-discover", {
      body: { city: c, state: s, limit: n },
    });
    setBusy(null);
    if (error) { appendLog(`✗ ${c}, ${s}: ${error.message}`); toast({ title: "Discover failed", description: error.message, variant: "destructive" }); return; }
    appendLog(`✓ ${c}, ${s}: +${data?.inserted ?? 0} new (${data?.discovered ?? 0} scanned, ${data?.skipped ?? 0} skipped)`);
    await refresh();
  };

  const enrich = async () => {
    setBusy("enrich");
    appendLog(`Enriching next ${enrichLimit} churches…`);
    const { data, error } = await supabase.functions.invoke("registry-enrich", {
      body: { limit: enrichLimit },
    });
    setBusy(null);
    if (error) { appendLog(`✗ enrich: ${error.message}`); toast({ title: "Enrich failed", description: error.message, variant: "destructive" }); return; }
    const results: any[] = data?.results ?? [];
    const withGive = results.filter((r) => r.giving_url).length;
    const verified = results.filter((r) => r.verification_status === "verified").length;
    appendLog(`✓ enriched ${results.length} · ${withGive} giving link${withGive === 1 ? "" : "s"} · ${verified} auto-verified`);
    await refresh();
  };

  const runAllMetros = async () => {
    for (const m of TOP_METROS) {
      // eslint-disable-next-line no-await-in-loop
      await discover(m.city, m.state, limit);
    }
    toast({ title: "Backfill complete", description: `Ran ${TOP_METROS.length} metros.` });
  };

  const approve = async (row: QueueRow) => {
    setQueueBusy(row.id);
    const { error } = await supabase
      .from("churches")
      .update({
        listing_status: "approved",
        approved_by_admin_id: user!.id,
        last_verified_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    setQueueBusy(null);
    if (error) return toast({ title: "Approve failed", description: error.message, variant: "destructive" });
    appendLog(`✓ approved ${row.dba_name ?? row.legal_name}`);
    toast({ title: "Listing approved" });
    await refresh();
  };

  const reject = async () => {
    if (!rejectFor) return;
    setQueueBusy(rejectFor.id);
    const { error } = await supabase
      .from("churches")
      .update({
        listing_status: "rejected",
        verification_notes: rejectReason || "Rejected by admin.",
      })
      .eq("id", rejectFor.id);
    setQueueBusy(null);
    if (error) return toast({ title: "Reject failed", description: error.message, variant: "destructive" });
    appendLog(`✗ rejected ${rejectFor.dba_name ?? rejectFor.legal_name}`);
    toast({ title: "Listing rejected" });
    setRejectFor(null);
    setRejectReason("");
    await refresh();
  };

  const resolveReport = async (r: ReportRow, action: "dismissed" | "actioned") => {
    setQueueBusy(r.id);
    const patchReport = supabase
      .from("church_reports")
      .update({ status: action, reviewed_at: new Date().toISOString(), reviewed_by: user!.id })
      .eq("id", r.id);
    const patchChurch = action === "actioned"
      ? supabase.from("churches").update({ listing_status: "flagged" }).eq("id", r.church_id)
      : Promise.resolve({ error: null } as { error: null });
    const [{ error: e1 }, { error: e2 }] = await Promise.all([patchReport, patchChurch]);
    setQueueBusy(null);
    if (e1 || e2) return toast({ title: "Update failed", description: (e1 ?? e2)?.message, variant: "destructive" });
    appendLog(`report ${action}: ${r.churches?.dba_name ?? r.churches?.legal_name ?? r.church_id}`);
    await refresh();
  };


  const stat = (label: string, n: number | undefined) => (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{n ?? "—"}</div>
    </div>
  );

  // Gate: require a signed-in session before showing admin controls. Offer
  // Google sign-in directly (no password) — server still enforces ADMIN_EMAILS.
  // Gate: require a signed-in session before showing admin controls. Offer
  // Google sign-in directly (no password) — server still enforces ADMIN_EMAILS.
  if (authLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    const signInWithGoogle = async () => {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/admin/registry`,
      });
      if (result.error) {
        toast({
          title: "Google sign-in failed",
          description: String((result.error as Error).message ?? result.error),
          variant: "destructive",
        });
      }
    };
    return (
      <div className="mx-auto max-w-md p-6 pt-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-4 w-4" /> Admin sign-in required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The Church Registry admin is gated by your Google account. Sign in
              with an email on the approved admin list — no password needed.
            </p>
            <Button className="w-full" onClick={signInWithGoogle}>
              <GoogleIcon /> Continue with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Church registry — admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Signed in as <span className="font-medium text-foreground">{user.email}</span>.
            Server-side calls are gated by <code className="text-xs">ADMIN_EMAILS</code>.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => { await supabase.auth.signOut(); }}
        >
          <LogOut className="h-4 w-4 mr-1.5" /> Sign out
        </Button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stat("Total churches", counts?.total)}
        {stat("With website", counts?.with_website)}
        {stat("With giving link", counts?.with_giving_url)}
        {stat("Verified", counts?.verified)}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Review queue
            <Badge variant="outline" className="ml-2">{queue.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing pending. Every listing users can see has been approved.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {queue.map((r) => (
                <li key={r.id} className="py-3 flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-[220px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{r.dba_name ?? r.legal_name}</span>
                      <Badge variant="outline" className="text-[10px]">{r.listing_status}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{r.source_type}</Badge>
                      {r.giving_platform && <Badge variant="outline" className="text-[10px]">{r.giving_platform}</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {[r.city, r.state].filter(Boolean).join(", ") || "—"}
                    </div>
                    {r.giving_url && (
                      <a href={r.giving_url} target="_blank" rel="noreferrer"
                         className="text-xs inline-flex items-center gap-1 mt-1 underline underline-offset-2 break-all">
                        {r.giving_url} <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    )}
                    {r.website && (
                      <a href={r.website} target="_blank" rel="noreferrer"
                         className="block text-xs text-muted-foreground mt-0.5 underline underline-offset-2 break-all">
                        {r.website}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" onClick={() => approve(r)} disabled={queueBusy === r.id}>
                      {queueBusy === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRejectFor(r)} disabled={queueBusy === r.id}>
                      <X className="h-3.5 w-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Flag className="h-4 w-4" /> Open reports
            <Badge variant="outline" className="ml-2">{reports.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open reports.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {reports.map((r) => (
                <li key={r.id} className="py-3 flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-[220px]">
                    <div className="font-medium">{r.churches?.dba_name ?? r.churches?.legal_name ?? r.church_id}</div>
                    <div className="text-xs mt-0.5"><span className="text-muted-foreground">Reason:</span> {r.reason}</div>
                    {r.details && <div className="text-xs text-muted-foreground mt-0.5">{r.details}</div>}
                    {r.churches?.giving_url && (
                      <a href={r.churches.giving_url} target="_blank" rel="noreferrer"
                         className="text-xs inline-flex items-center gap-1 mt-1 underline underline-offset-2 break-all">
                        {r.churches.giving_url} <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => resolveReport(r, "actioned")} disabled={queueBusy === r.id}>
                      Flag listing
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => resolveReport(r, "dismissed")} disabled={queueBusy === r.id}>
                      Dismiss
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>



      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Search className="h-4 w-4" /> Discover churches in a metro</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1.5 md:col-span-2">
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Charlotte" />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input value={state} maxLength={2} onChange={(e) => setState(e.target.value.toUpperCase())} placeholder="NC" />
            </div>
            <div className="space-y-1.5">
              <Label>Limit</Label>
              <Input type="number" min={1} max={40} value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => discover(city, state, limit)} disabled={!city || !state || !!busy}>
              {busy === `discover:${city}` ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Discover this metro
            </Button>
            <Button variant="outline" onClick={runAllMetros} disabled={!!busy}>
              Run all {TOP_METROS.length} metros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Enrich giving links</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Scrapes each church's homepage, detects the giving link, and auto-verifies
            when it resolves to a known processor (Overflow, Tithe.ly, Pushpay, Givelify, Subsplash, Pushpay/Church Center, Donorbox, and more).
          </p>
          <div className="flex items-end gap-3">
            <div className="space-y-1.5 max-w-[140px]">
              <Label>Batch size</Label>
              <Input type="number" min={1} max={50} value={enrichLimit} onChange={(e) => setEnrichLimit(Number(e.target.value))} />
            </div>
            <Button onClick={enrich} disabled={!!busy}>
              {busy === "enrich" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Run enrichment batch
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Activity</CardTitle></CardHeader>
        <CardContent>
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="text-xs font-mono space-y-1 max-h-80 overflow-y-auto">
              {log.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          )}
        </CardContent>
      </Card>

      {rejectFor && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur p-4"
             onClick={() => { setRejectFor(null); setRejectReason(""); }}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-base">Reject {rejectFor.dba_name ?? rejectFor.legal_name}?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="reject-reason">Reason (stored on the listing)</Label>
              <Textarea id="reject-reason" value={rejectReason} maxLength={500}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="e.g. Could not verify 501(c)(3) status; giving link redirected off-domain." />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => { setRejectFor(null); setRejectReason(""); }}>Cancel</Button>
                <Button variant="destructive" onClick={reject} disabled={queueBusy === rejectFor.id}>
                  {queueBusy === rejectFor.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Reject listing
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1A6.99 6.99 0 0 1 5.47 12c0-.73.13-1.44.36-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
  </svg>
);
