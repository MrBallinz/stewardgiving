import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { formatPercent } from "@/lib/format";
import { Loader2, Sparkles } from "lucide-react";

const Covenant = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [percent, setPercent] = useState(10);
  const [minimum, setMinimum] = useState(0);
  const [autoTransfer, setAutoTransfer] = useState(false);
  const [scripture, setScripture] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("giving_covenants")
        .select("percent_of_profit, minimum_monthly, auto_transfer, scripture_anchor")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setPercent(Number(data.percent_of_profit));
        setMinimum(Number(data.minimum_monthly));
        setAutoTransfer(Boolean(data.auto_transfer));
        setScripture(data.scripture_anchor ?? "");
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("giving_covenants").upsert(
      {
        user_id: user.id,
        percent_of_profit: percent,
        minimum_monthly: minimum,
        auto_transfer: autoTransfer,
        scripture_anchor: scripture.trim() || null,
      },
      { onConflict: "user_id" }
    );
    setBusy(false);
    if (error) return toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    toast({ title: "Covenant saved", description: "Your stewardship rule is updated." });
  };

  return (
    <AppShell>
      <div className="container py-10 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-semibold tracking-tight">Your covenant</h1>
          <p className="text-muted-foreground mt-1">A simple, faithful rule. Edit anytime.</p>
        </div>

        {loading ? (
          <Skeleton className="h-96" />
        ) : (
          <Card className="p-8 shadow-card border-border/60 space-y-8">
            <div>
              <div className="flex items-baseline justify-between mb-3">
                <Label>Percent of monthly profit</Label>
                <span className="stat-number text-3xl font-semibold">{formatPercent(percent)}</span>
              </div>
              <Slider value={[percent]} onValueChange={(v) => setPercent(v[0])} min={1} max={50} step={0.5} />
              <p className="text-xs text-muted-foreground mt-2">Most users start at 10%.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min">Minimum monthly giving</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input id="min" type="number" min={0} value={minimum} onChange={(e) => setMinimum(Number(e.target.value) || 0)} className="pl-7" />
              </div>
              <p className="text-xs text-muted-foreground">If profit is low, give at least this amount.</p>
            </div>

            <div className="flex items-start justify-between gap-6 p-4 rounded-lg bg-muted/40 border border-border/60">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gold" />
                  <p className="font-medium">Auto-transfer giving</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  When on, monthly giving is transferred automatically. When off, you approve each month.
                </p>
              </div>
              <Switch checked={autoTransfer} onCheckedChange={setAutoTransfer} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sc">Scripture anchor</Label>
              <Textarea id="sc" rows={3} value={scripture} onChange={(e) => setScripture(e.target.value)} maxLength={500} className="font-serif" />
              <p className="text-xs text-muted-foreground">A verse to anchor your stewardship. Appears on your dashboard and year-end report.</p>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={save} disabled={busy} size="lg">
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save covenant
              </Button>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
};

export default Covenant;
