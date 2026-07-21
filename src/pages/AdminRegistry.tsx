// Steward — admin control room for populating the church registry.
// Gated server-side by ADMIN_EMAILS env in the edge functions; the UI
// simply invokes them and streams progress.
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, Play, Search, ShieldCheck, LogOut } from "lucide-react";
import { TOP_METROS } from "@/lib/top-metros";

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

  const appendLog = (line: string) => setLog((l) => [`${new Date().toLocaleTimeString()} · ${line}`, ...l].slice(0, 200));

  const refresh = async () => {
    const [{ count: total }, { count: withSite }, { count: withGive }, { count: verified }] = await Promise.all([
      supabase.from("churches").select("*", { count: "exact", head: true }),
      supabase.from("churches").select("*", { count: "exact", head: true }).not("website", "is", null),
      supabase.from("churches").select("*", { count: "exact", head: true }).not("giving_url", "is", null),
      supabase.from("churches").select("*", { count: "exact", head: true }).eq("verification_status", "verified"),
    ]);
    setCounts({
      total: total ?? 0,
      with_website: withSite ?? 0,
      with_giving_url: withGive ?? 0,
      verified: verified ?? 0,
    });
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

  const stat = (label: string, n: number | undefined) => (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{n ?? "—"}</div>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <header>
        <h1 className="font-serif text-3xl">Church registry — admin</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Populate the public church directory and auto-detect online giving links.
          Server-side calls are gated by <code className="text-xs">ADMIN_EMAILS</code>.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stat("Total churches", counts?.total)}
        {stat("With website", counts?.with_website)}
        {stat("With giving link", counts?.with_giving_url)}
        {stat("Verified", counts?.verified)}
      </div>

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
    </div>
  );
}
