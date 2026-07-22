import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, Landmark, RefreshCw, CheckCircle2 } from "lucide-react";

type Connection = {
  id: string;
  institution_name: string | null;
  status: string;
  last_sync_at: string | null;
};

export function ConnectBank({ onChange }: { onChange?: () => void }) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadConnections = useCallback(async () => {
    const { data } = await supabase
      .from("bank_connections")
      .select("id, institution_name, status, last_sync_at")
      .eq("provider", "plaid")
      .order("created_at", { ascending: false });
    setConnections((data as Connection[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadConnections(); }, [loadConnections]);

  const fetchLinkToken = useCallback(async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("plaid-link-token", { body: {} });
    setBusy(false);
    if (error || !data?.link_token) {
      toast({
        title: "Couldn't start bank connect",
        description: error?.message || "Plaid didn't return a link token. Check that PLAID_CLIENT_ID and PLAID_SECRET are set.",
        variant: "destructive",
      });
      return;
    }
    setLinkToken(data.link_token);
  }, []);

  const onSuccess = useCallback(async (public_token: string, metadata: any) => {
    setBusy(true);
    const { error: exErr } = await supabase.functions.invoke("plaid-exchange", {
      body: { public_token, institution: metadata?.institution ?? null },
    });
    if (exErr) {
      setBusy(false);
      toast({ title: "Couldn't save connection", description: exErr.message, variant: "destructive" });
      return;
    }
    // Kick off initial sync
    const { error: syncErr } = await supabase.functions.invoke("plaid-sync", { body: {} });
    setBusy(false);
    if (syncErr) {
      toast({ title: "Connected, but sync failed", description: syncErr.message, variant: "destructive" });
    } else {
      toast({ title: "Bank connected", description: "Transactions imported and monthly summaries updated." });
    }
    setLinkToken(null);
    await loadConnections();
    onChange?.();
  }, [loadConnections, onChange]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit: () => setLinkToken(null),
  });

  useEffect(() => { if (linkToken && ready) open(); }, [linkToken, ready, open]);

  const resync = async () => {
    setBusy(true);
    const { error } = await supabase.functions.invoke("plaid-sync", { body: {} });
    setBusy(false);
    if (error) toast({ title: "Sync failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Synced", description: "Latest transactions imported." });
      await loadConnections();
      onChange?.();
    }
  };

  if (loading) return null;

  if (connections.length === 0) {
    return (
      <Card className="p-6 shadow-card border-border/60 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-gold-soft/60 flex items-center justify-center shrink-0">
            <Landmark className="h-5 w-5 text-gold" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-serif text-lg">Connect your business bank</p>
            <p className="text-sm text-muted-foreground">
              Read-only via Plaid. Steward calculates monthly profit from your transactions and never
              moves money. Access can be revoked any time.
            </p>
          </div>
        </div>
        <Button onClick={fetchLinkToken} disabled={busy} className="w-full sm:w-auto">
          {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Preparing…</> : "Connect a bank account"}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-5 shadow-card border-border/60 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <p className="text-sm min-w-0">
            <span className="font-medium">{connections.length} bank{connections.length > 1 ? "s" : ""} connected</span>
            <span className="text-muted-foreground"> · {connections[0].institution_name ?? "Bank"}</span>
          </p>
          <Badge variant="outline" className="ml-1 text-xs">Plaid</Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={resync} disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
            Resync
          </Button>
          <Button size="sm" variant="ghost" onClick={fetchLinkToken} disabled={busy}>+ Add another</Button>
        </div>
      </div>
      {connections[0].last_sync_at && (
        <p className="text-xs text-muted-foreground">
          Last synced {new Date(connections[0].last_sync_at).toLocaleString()}
        </p>
      )}
    </Card>
  );
}
