import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, ExternalLink, Copy, ShieldAlert, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatPercent, monthLabel } from "@/lib/format";
import { platformBadgeText, buildDonateUrl, type PlatformId } from "@/lib/giving-platforms";

type Summary = {
  id: string; user_id: string; month: string;
  total_revenue: number; total_expenses: number; net_profit: number;
  giving_percent: number; giving_amount: number; status: string;
  is_sample: boolean;
};

type Recipient = {
  id: string; name: string; type: string; allocation_percent: number;
  ein: string | null; platform: string | null; platform_slug: string | null;
  donate_url: string | null; website: string | null;
};

type Tx = {
  id: string; recipient_id: string; amount: number; status: string;
  marked_paid_at: string | null;
};

const Review = () => {
  const { user } = useAuth();
  const { summary_id } = useParams<{ summary_id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user || !summary_id) return;
    (async () => {
      setLoading(true);
      const { data: s } = await supabase
        .from("monthly_summaries")
        .select("*")
        .eq("id", summary_id)
        .maybeSingle();
      if (!s) { setLoading(false); return; }

      const { data: recs } = await supabase
        .from("giving_recipients")
        .select("id,name,type,allocation_percent,ein,platform,platform_slug,donate_url,website")
        .eq("user_id", s.user_id);

      let { data: existingTxs } = await supabase
        .from("giving_transactions")
        .select("id,recipient_id,amount,status,marked_paid_at")
        .eq("monthly_summary_id", s.id);

      // Materialize transactions if none exist yet.
      if ((!existingTxs || existingTxs.length === 0) && recs && recs.length) {
        const totalAlloc = recs.reduce((sum, r) => sum + Number(r.allocation_percent), 0) || 100;
        const giving = Number(s.giving_amount);
        const toInsert = recs.map((r) => ({
          monthly_summary_id: s.id,
          recipient_id: r.id,
          amount: Math.round((giving * Number(r.allocation_percent)) / totalAlloc),
          status: "pending" as const,
          is_sample: (s as Summary).is_sample,
        }));
        const { data: inserted } = await supabase
          .from("giving_transactions")
          .insert(toInsert as any)
          .select("id,recipient_id,amount,status,marked_paid_at");
        existingTxs = inserted ?? [];
      }

      setSummary(s as Summary);
      setRecipients((recs ?? []) as Recipient[]);
      setTxs((existingTxs ?? []) as Tx[]);
      setChecked(Object.fromEntries(((existingTxs ?? []) as Tx[]).map((t) => [t.id, !!t.marked_paid_at])));
      setLoading(false);
    })();
  }, [user, summary_id]);

  const allChecked = useMemo(
    () => txs.length > 0 && txs.every((t) => checked[t.id]),
    [txs, checked]
  );

  const recipientById = (id: string) => recipients.find((r) => r.id === id);

  const givingUrlFor = (r?: Recipient) => {
    if (!r) return null;
    if (r.donate_url) return r.donate_url;
    if (r.platform && r.platform_slug)
      return buildDonateUrl({ name: r.name, type: (r.type === "other" ? "nonprofit" : r.type) as any, platform: r.platform as PlatformId, slug: r.platform_slug });
    return r.website ?? null;
  };

  const toggle = async (txId: string, value: boolean) => {
    setChecked((c) => ({ ...c, [txId]: value }));
    await supabase
      .from("giving_transactions")
      .update({ marked_paid_at: value ? new Date().toISOString() : null })
      .eq("id", txId);
  };

  const copyDetails = async (r?: Recipient) => {
    if (!r) return;
    const lines = [
      r.name,
      r.ein ? `EIN: ${r.ein}` : null,
      r.website ? `Website: ${r.website}` : null,
      r.donate_url ? `Giving page: ${r.donate_url}` : null,
    ].filter(Boolean);
    await navigator.clipboard.writeText(lines.join("\n"));
    toast({ title: "Copied" });
  };

  const markComplete = async () => {
    if (!summary) return;
    setBusy(true);
    const { error } = await supabase
      .from("monthly_summaries")
      .update({ status: "completed" as any, reviewed_at: new Date().toISOString() })
      .eq("id", summary.id);
    setBusy(false);
    if (error) return toast({ title: "Couldn't update", description: error.message, variant: "destructive" });
    toast({ title: "Month marked complete" });
    navigate("/dashboard");
  };

  if (loading) {
    return <AppShell><div className="container py-10 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div></AppShell>;
  }
  if (!summary) {
    return <AppShell><div className="container py-10">Summary not found.</div></AppShell>;
  }

  return (
    <AppShell>
      <div className="container max-w-3xl py-10 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="-ml-3">
          <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
        </Button>

        {summary.is_sample && (
          <Badge variant="outline" className="border-gold/50 text-foreground bg-gold-soft/40">
            Sample data — not a real gift record
          </Badge>
        )}

        <div className="space-y-1">
          <h1 className="font-serif text-3xl">{monthLabel(summary.month)}</h1>
          <p className="text-muted-foreground text-sm">Review your giving for this month.</p>
        </div>

        <Card className="p-6 space-y-3 shadow-card">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><p className="text-muted-foreground">Profit</p><p className="stat-number text-xl">{formatCurrency(summary.net_profit)}</p></div>
            <div><p className="text-muted-foreground">Giving %</p><p className="stat-number text-xl">{formatPercent(summary.giving_percent)}</p></div>
            <div><p className="text-muted-foreground">Total giving</p><p className="stat-number text-xl text-accent">{formatCurrency(summary.giving_amount)}</p></div>
          </div>
        </Card>

        <div className="space-y-3">
          <h2 className="font-serif text-xl">Split by recipient</h2>
          {txs.map((t) => {
            const r = recipientById(t.recipient_id);
            const url = givingUrlFor(r);
            const isChecked = !!checked[t.id];
            return (
              <Card key={t.id} className="p-5 shadow-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium">{r?.name ?? "Recipient"}</p>
                    <p className="text-xs text-muted-foreground">
                      {platformBadgeText(r?.platform)} · {formatPercent(r?.allocation_percent ?? 0)} allocation
                    </p>
                  </div>
                  <p className="stat-number text-lg whitespace-nowrap">{formatCurrency(t.amount)}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-4">
                  {url ? (
                    <Button asChild size="sm">
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        Open giving page <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                      </a>
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">No giving link — record manually.</span>
                  )}
                  <Button size="sm" variant="outline" onClick={() => copyDetails(r)}>
                    <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy details
                  </Button>
                  <label className="flex items-center gap-2 text-sm ml-auto cursor-pointer">
                    <Checkbox checked={isChecked} onCheckedChange={(v) => toggle(t.id, !!v)} />
                    I've completed this gift
                  </label>
                </div>
              </Card>
            );
          })}
          {txs.length === 0 && (
            <Card className="p-6 text-sm text-muted-foreground">
              No recipients set up yet. Add some on the <a className="text-primary underline" href="/recipients">Recipients</a> page.
            </Card>
          )}
        </div>

        <Card className="p-4 bg-muted/40 border-dashed">
          <div className="flex gap-3 items-start text-xs text-muted-foreground">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              Steward calculates and tracks your giving. You initiate the actual transfers through your bank,
              check, or your church's giving platform. Steward does not custody, move, or process funds.
            </p>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button size="lg" onClick={markComplete} disabled={busy || !allChecked}>
            <CheckCircle2 className="h-4 w-4 mr-2" /> Mark month complete
          </Button>
        </div>
      </div>
    </AppShell>
  );
};

export default Review;
