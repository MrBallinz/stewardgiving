import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/AppShell";
import { toast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, Sparkles } from "lucide-react";
import { formatPercent } from "@/lib/format";

const DEFAULT_SCRIPTURE =
  'Honor the Lord with your wealth, with the firstfruits of all your crops. — Proverbs 3:9';

const Onboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);

  // Step 1
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Service business");
  // Step 2
  const [percent, setPercent] = useState(10);
  const [minimum, setMinimum] = useState(0);
  const [scripture, setScripture] = useState(DEFAULT_SCRIPTURE);
  // Step 3
  const [recipientName, setRecipientName] = useState("");
  const [recipientType, setRecipientType] = useState<"church" | "missions" | "nonprofit" | "other">("church");
  const [recipientEin, setRecipientEin] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(1, s - 1));

  const saveStep1 = async () => {
    if (!user) return;
    if (!businessName.trim()) {
      toast({ title: "What's your business called?", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ business_name: businessName.trim(), business_type: businessType })
      .eq("id", user.id);
    setBusy(false);
    if (error) return toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    next();
  };

  const saveStep2 = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("giving_covenants").upsert(
      {
        user_id: user.id,
        percent_of_profit: percent,
        minimum_monthly: minimum,
        scripture_anchor: scripture.trim() || null,
        auto_transfer: false,
      },
      { onConflict: "user_id" }
    );
    setBusy(false);
    if (error) return toast({ title: "Couldn't save covenant", description: error.message, variant: "destructive" });
    next();
  };

  const saveStep3 = async () => {
    if (!user) return;
    if (!recipientName.trim()) {
      toast({ title: "Add a recipient name", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("giving_recipients").insert({
      user_id: user.id,
      name: recipientName.trim(),
      type: recipientType,
      allocation_percent: 100,
      ein: recipientEin.trim() || null,
    });
    setBusy(false);
    if (error) return toast({ title: "Couldn't save recipient", description: error.message, variant: "destructive" });
    next();
  };

  const finish = async () => {
    if (!user) return;
    setBusy(true);
    // Mark onboarded. We do NOT seed any historical data — the dashboard starts
    // empty until the user adds real monthly summaries themselves. (Bank/Plaid
    // integration is not yet shipped; the onboarding step is informational only.)
    await supabase.from("profiles").update({ onboarded: true }).eq("id", user.id);
    setBusy(false);
    toast({ title: "You're all set", description: "Welcome to Steward." });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="font-serif text-xl font-semibold">Steward</span>
          </div>
          <span className="text-sm text-muted-foreground">Step {step} of 4</span>
        </div>
      </header>

      <div className="container max-w-xl py-12">
        <Progress value={(step / 4) * 100} className="h-1.5 mb-10" />

        {step === 1 && (
          <Card className="p-8 shadow-card border-border/60 animate-fade-up">
            <p className="text-sm font-medium text-gold uppercase tracking-wider mb-2">The basics</p>
            <h1 className="font-serif text-3xl font-semibold mb-2">Tell us about your business.</h1>
            <p className="text-muted-foreground mb-8">We'll use this on your year-end stewardship report.</p>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="bn">Business name</Label>
                <Input id="bn" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Acme Roofing Co." maxLength={120} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bt">Type</Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger id="bt"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Service business", "Trades & contracting", "Retail / e-commerce", "Professional services", "Real estate", "Other"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <Button onClick={saveStep1} disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-8 shadow-card border-border/60 animate-fade-up">
            <p className="text-sm font-medium text-gold uppercase tracking-wider mb-2">Your covenant</p>
            <h1 className="font-serif text-3xl font-semibold mb-2">How much will you give?</h1>
            <p className="text-muted-foreground mb-8">A simple, faithful rule. You can change this anytime.</p>

            <div className="space-y-8">
              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <Label>Percent of monthly profit</Label>
                  <span className="stat-number text-3xl font-semibold text-foreground">{formatPercent(percent)}</span>
                </div>
                <Slider value={[percent]} onValueChange={(v) => setPercent(v[0])} min={1} max={50} step={0.5} />
                <p className="text-xs text-muted-foreground mt-2">Most users start at 10%.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min">Minimum monthly giving (optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input id="min" type="number" min={0} value={minimum} onChange={(e) => setMinimum(Number(e.target.value) || 0)} className="pl-7" />
                </div>
                <p className="text-xs text-muted-foreground">If profit is low, give at least this much.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sc">Scripture anchor (optional)</Label>
                <Textarea id="sc" rows={3} value={scripture} onChange={(e) => setScripture(e.target.value)} maxLength={500} className="font-serif" />
                <p className="text-xs text-muted-foreground">A verse to anchor your stewardship.</p>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="ghost" onClick={back}>Back</Button>
              <Button onClick={saveStep2} disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-8 shadow-card border-border/60 animate-fade-up">
            <p className="text-sm font-medium text-gold uppercase tracking-wider mb-2">Your first recipient</p>
            <h1 className="font-serif text-3xl font-semibold mb-2">Where will your giving go?</h1>
            <p className="text-muted-foreground mb-8">You can add more recipients and split allocations after onboarding.</p>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="rn">Name</Label>
                <Input id="rn" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Grace Community Church" maxLength={120} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rt">Type</Label>
                <Select value={recipientType} onValueChange={(v) => setRecipientType(v as typeof recipientType)}>
                  <SelectTrigger id="rt"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="church">Church</SelectItem>
                    <SelectItem value="missions">Missions</SelectItem>
                    <SelectItem value="nonprofit">Nonprofit</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ein">EIN (optional)</Label>
                <Input id="ein" value={recipientEin} onChange={(e) => setRecipientEin(e.target.value)} placeholder="12-3456789" maxLength={20} />
                <p className="text-xs text-muted-foreground">Used on your tax-ready year-end report.</p>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="ghost" onClick={back}>Back</Button>
              <Button onClick={saveStep3} disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {step === 4 && (
          <Card className="p-8 shadow-card border-border/60 animate-fade-up">
            <p className="text-sm font-medium text-gold uppercase tracking-wider mb-2">You're ready</p>
            <h1 className="font-serif text-3xl font-semibold mb-2">Step in with clear eyes.</h1>
            <p className="text-muted-foreground mb-8">
              Your dashboard starts empty. As you record monthly profit, we'll compute your covenant giving and build your year-end report. Bank connections (Plaid) and automated transfers are on our roadmap — for now, you'll log monthly numbers yourself.
            </p>

            <div className="rounded-xl border border-border bg-muted/40 p-6 flex items-start gap-4 mb-8">
              <div className="h-10 w-10 rounded-lg bg-gold-soft grid place-items-center shrink-0">
                <Sparkles className="h-5 w-5 text-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Want to explore with sample data first?</p>
                <p className="text-sm text-muted-foreground">
                  Try the interactive demo at <strong>/demo</strong> — it shows what Steward looks like with a year of activity, without touching your real account.
                </p>
              </div>
            </div>

            <p className="scripture text-sm mb-8">
              You're stewarding {formatPercent(percent)} of profit. We'll do the math from here.
            </p>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={back}>Back</Button>
              <Button onClick={finish} disabled={busy} size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90">
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enter Steward <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enter Steward <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
