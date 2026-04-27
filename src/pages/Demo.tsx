import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/AppShell";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  Check,
  CheckCircle2,
  FileText,
  HandCoins,
  Heart,
  Loader2,
  Mail,
  Receipt,
  Sparkles,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Connector = {
  name: string;
  category: "Church" | "Missions" | "Bank" | "Accounting";
  initials: string;
  tone: string;
};

const CONNECTORS: Connector[] = [
  // Church management
  { name: "Tithe.ly", category: "Church", initials: "Tl", tone: "from-sky-500/20 to-sky-500/5" },
  { name: "Pushpay", category: "Church", initials: "Pp", tone: "from-blue-500/20 to-blue-500/5" },
  { name: "Planning Center", category: "Church", initials: "PC", tone: "from-indigo-500/20 to-indigo-500/5" },
  { name: "Subsplash", category: "Church", initials: "Sb", tone: "from-cyan-500/20 to-cyan-500/5" },
  // Missions / nonprofits
  { name: "Pure Charity", category: "Missions", initials: "PC", tone: "from-rose-500/20 to-rose-500/5" },
  { name: "Every.org", category: "Missions", initials: "Eo", tone: "from-pink-500/20 to-pink-500/5" },
  { name: "GiveDirectly", category: "Missions", initials: "GD", tone: "from-red-500/20 to-red-500/5" },
  { name: "Compassion", category: "Missions", initials: "Cp", tone: "from-orange-500/20 to-orange-500/5" },
  // Banks
  { name: "Plaid", category: "Bank", initials: "Pl", tone: "from-emerald-500/20 to-emerald-500/5" },
  { name: "Stripe", category: "Bank", initials: "St", tone: "from-violet-500/20 to-violet-500/5" },
  { name: "ACH Network", category: "Bank", initials: "AC", tone: "from-teal-500/20 to-teal-500/5" },
  { name: "Wise", category: "Bank", initials: "Ws", tone: "from-green-500/20 to-green-500/5" },
  // Accounting
  { name: "QuickBooks", category: "Accounting", initials: "QB", tone: "from-lime-500/20 to-lime-500/5" },
  { name: "Xero", category: "Accounting", initials: "Xr", tone: "from-amber-500/20 to-amber-500/5" },
  { name: "Wave", category: "Accounting", initials: "Wv", tone: "from-yellow-500/20 to-yellow-500/5" },
];

const CATEGORY_META: Record<Connector["category"], { icon: typeof Building2; label: string; blurb: string }> = {
  Church: { icon: Building2, label: "Church Management", blurb: "Send gifts directly into your church's giving platform." },
  Missions: { icon: Heart, label: "Missions & Nonprofits", blurb: "Support the global Body and Kingdom causes you love." },
  Bank: { icon: Wallet, label: "Banks & Payment Rails", blurb: "Read profit, move funds — securely, never stored." },
  Accounting: { icon: Receipt, label: "Accounting & Tax", blurb: "Auto-export gifts as tax-ready entries for your CPA." },
};

type Step = {
  id: number;
  title: string;
  subtitle: string;
  scripture?: string;
};

const STEPS: Step[] = [
  { id: 1, title: "Connect your accounts", subtitle: "Link your business bank securely. Read-only — we never hold funds." },
  { id: 2, title: "Set your covenant", subtitle: "Choose your percentage and split it across the recipients God has put on your heart." },
  { id: 3, title: "Profit is calculated", subtitle: "At month-end, Steward computes net profit from your transactions automatically." },
  { id: 4, title: "Review your gift", subtitle: "See the exact amount and split before anything moves. No surprises." },
  { id: 5, title: "One faithful click", subtitle: "Approve once. Steward fans out the gift across every connected platform.", scripture: "“Each of you should give what you have decided in your heart to give.” — 2 Cor. 9:7" },
  { id: 6, title: "Automated everywhere", subtitle: "Gifts post, receipts arrive, books update — all without lifting another finger." },
];

export default function Demo() {
  const [step, setStep] = useState(1);
  const [clicked, setClicked] = useState(false);
  const [stage, setStage] = useState<0 | 1 | 2 | 3 | 4>(0);

  const current = STEPS[step - 1];
  const progress = (step / STEPS.length) * 100;

  const handleFaithfulClick = () => {
    setClicked(true);
    setStage(1);
    [1, 2, 3, 4].forEach((s, i) =>
      setTimeout(() => setStage((s as 1 | 2 | 3 | 4)), (i + 1) * 900)
    );
    setTimeout(() => setStep(6), 4200);
  };

  const next = () => {
    if (step < STEPS.length) setStep(step + 1);
  };
  const prev = () => {
    if (step > 1) setStep(step - 1);
    if (step === 6) {
      setClicked(false);
      setStage(0);
    }
  };
  const reset = () => {
    setStep(1);
    setClicked(false);
    setStage(0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline">
              Back to home
            </Link>
            <Button asChild size="sm">
              <Link to="/auth">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-12 pb-6 text-center max-w-3xl">
        <p className="text-sm font-medium text-gold uppercase tracking-wider mb-3">Interactive demo</p>
        <h1 className="text-4xl md:text-5xl font-serif font-semibold text-foreground mb-4">
          See the <span className="italic">one faithful click</span> in motion
        </h1>
        <p className="text-lg text-muted-foreground">
          Walk through the full Steward workflow — from linking your bank to gifts landing in your church and missions, all from a single approval.
        </p>
      </section>

      {/* Progress */}
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Step {step} of {STEPS.length}</span>
          <span>{current.title}</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-gold transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stage */}
      <section className="container mx-auto px-4 py-10 max-w-4xl">
        <Card className="p-6 md:p-10 min-h-[460px] relative overflow-hidden">
          <div className="mb-6">
            <Badge variant="secondary" className="mb-3">Step {step}</Badge>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold mb-2">{current.title}</h2>
            <p className="text-muted-foreground">{current.subtitle}</p>
          </div>

          <div className="mt-8 animate-fade-in" key={step}>
            {step === 1 && <StepConnect />}
            {step === 2 && <StepCovenant />}
            {step === 3 && <StepCalculate />}
            {step === 4 && <StepReview />}
            {step === 5 && (
              <StepClick clicked={clicked} stage={stage} onClick={handleFaithfulClick} scripture={current.scripture} />
            )}
            {step === 6 && <StepDone />}
          </div>
        </Card>

        {/* Nav */}
        <div className="flex items-center justify-between mt-6">
          <Button variant="outline" onClick={prev} disabled={step === 1}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="flex gap-1">
            {STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => { setStep(s.id); if (s.id !== 6) { setClicked(false); setStage(0); } }}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  s.id === step ? "bg-primary w-6" : "bg-muted hover:bg-muted-foreground/40"
                )}
                aria-label={`Go to step ${s.id}`}
              />
            ))}
          </div>
          {step === STEPS.length ? (
            <Button onClick={reset} variant="secondary">
              Restart demo
            </Button>
          ) : step === 5 ? (
            <Button onClick={next} disabled={!clicked} variant={clicked ? "default" : "outline"}>
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={next}>
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </section>

      {/* Connectors gallery */}
      <section className="bg-muted/30 border-t border-border/60 py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-sm font-medium text-gold uppercase tracking-wider mb-3">Integrations</p>
            <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-3">
              One click. Every platform you already use.
            </h2>
            <p className="text-muted-foreground">
              Steward orchestrates giving across the platforms your church, your missions, and your accountant already trust.
            </p>
          </div>

          {(["Church", "Missions", "Bank", "Accounting"] as const).map((cat) => {
            const meta = CATEGORY_META[cat];
            const Icon = meta.icon;
            const items = CONNECTORS.filter((c) => c.category === cat);
            return (
              <div key={cat} className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{meta.label}</h3>
                    <p className="text-sm text-muted-foreground">{meta.blurb}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {items.map((c) => (
                    <Card key={c.name} className={cn("p-4 flex items-center gap-3 hover:shadow-md transition bg-gradient-to-br", c.tone)}>
                      <div className="w-10 h-10 rounded-md bg-background border border-border/60 flex items-center justify-center font-semibold text-sm">
                        {c.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{c.name}</div>
                        <div className="text-xs text-muted-foreground">Connected via Steward</div>
                      </div>
                      <Check className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-4">Ready for your one faithful click?</h2>
        <p className="text-muted-foreground mb-6">
          Set the covenant once. Let Steward handle the rest, every month, without fail.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild size="lg">
            <Link to="/auth">Start free <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/faith">Read our statement of faith</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

/* ---------- Step views ---------- */

function StepConnect() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {[
        { name: "Chase Business Checking", sub: "•••• 4821", icon: Banknote },
        { name: "Stripe Payouts", sub: "Connected", icon: Wallet },
      ].map((a) => (
        <Card key={a.name} className="p-4 flex items-center gap-3 border-emerald-500/30 bg-emerald-500/5">
          <div className="w-10 h-10 rounded-md bg-background border flex items-center justify-center">
            <a.icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="font-medium">{a.name}</div>
            <div className="text-xs text-muted-foreground">{a.sub}</div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        </Card>
      ))}
      <p className="md:col-span-2 text-xs text-muted-foreground">
        Read-only via Plaid. Bank-grade encryption. Funds never leave your control.
      </p>
    </div>
  );
}

function StepCovenant() {
  const recipients = [
    { name: "Grace Community Church", platform: "Tithe.ly", pct: 60 },
    { name: "Compassion International", platform: "Compassion", pct: 25 },
    { name: "Local Food Pantry", platform: "Every.org", pct: 15 },
  ];
  return (
    <div>
      <Card className="p-5 mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm text-muted-foreground">Of monthly profit</span>
          <span className="text-3xl font-serif font-semibold text-primary">10%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary" style={{ width: "10%" }} />
        </div>
      </Card>
      <div className="space-y-2">
        {recipients.map((r) => (
          <div key={r.name} className="flex items-center justify-between p-3 rounded-md border bg-card">
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="text-xs text-muted-foreground">via {r.platform}</div>
            </div>
            <Badge variant="secondary">{r.pct}%</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepCalculate() {
  return (
    <div className="space-y-3">
      {[
        { label: "Revenue (October)", value: "$48,210.00" },
        { label: "Operating expenses", value: "−$31,640.00" },
        { label: "Taxes withheld", value: "−$4,200.00" },
      ].map((r) => (
        <div key={r.label} className="flex justify-between p-3 rounded-md bg-muted/40 text-sm">
          <span className="text-muted-foreground">{r.label}</span>
          <span className="font-mono">{r.value}</span>
        </div>
      ))}
      <div className="flex justify-between p-4 rounded-md bg-primary/10 border border-primary/30">
        <span className="font-medium">Net profit</span>
        <span className="font-mono font-semibold text-primary">$12,370.00</span>
      </div>
      <div className="flex justify-between p-4 rounded-md bg-gold/10 border border-gold/30">
        <span className="font-medium">10% covenant gift</span>
        <span className="font-mono font-semibold">$1,237.00</span>
      </div>
    </div>
  );
}

function StepReview() {
  const split = [
    { name: "Grace Community Church", amt: "$742.20", platform: "Tithe.ly" },
    { name: "Compassion International", amt: "$309.25", platform: "Compassion" },
    { name: "Local Food Pantry", amt: "$185.55", platform: "Every.org" },
  ];
  return (
    <div className="space-y-2">
      {split.map((s) => (
        <Card key={s.name} className="p-4 flex items-center justify-between">
          <div>
            <div className="font-medium">{s.name}</div>
            <div className="text-xs text-muted-foreground">via {s.platform}</div>
          </div>
          <div className="font-mono font-semibold">{s.amt}</div>
        </Card>
      ))}
      <p className="text-xs text-muted-foreground pt-2">
        Total to send: <span className="font-mono font-semibold text-foreground">$1,237.00</span> — funded from Chase ••4821.
      </p>
    </div>
  );
}

function StepClick({
  clicked,
  stage,
  onClick,
  scripture,
}: {
  clicked: boolean;
  stage: number;
  onClick: () => void;
  scripture?: string;
}) {
  const events = [
    { icon: Wallet, label: "ACH transfer initiated from Chase ••4821" },
    { icon: HandCoins, label: "Gifts dispatched to Tithe.ly, Compassion, Every.org" },
    { icon: Mail, label: "Tax receipts received & filed" },
    { icon: FileText, label: "Entries posted to QuickBooks" },
  ];
  return (
    <div className="flex flex-col items-center text-center">
      {!clicked ? (
        <>
          <button
            onClick={onClick}
            className="group relative w-44 h-44 rounded-full bg-gradient-to-br from-primary to-gold text-primary-foreground shadow-2xl hover:scale-105 transition-transform duration-300"
          >
            <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
            <span className="relative flex flex-col items-center justify-center h-full">
              <Sparkles className="w-8 h-8 mb-2" />
              <span className="font-serif text-lg leading-tight">One<br />faithful<br />click</span>
            </span>
          </button>
          {scripture && (
            <p className="mt-8 italic text-muted-foreground max-w-md font-serif">{scripture}</p>
          )}
        </>
      ) : (
        <div className="w-full max-w-md space-y-3">
          {events.map((e, i) => {
            const done = stage > i;
            const active = stage === i + 1 || (stage === 4 && i === 3);
            const visible = stage >= i;
            return (
              <Card
                key={e.label}
                className={cn(
                  "p-4 flex items-center gap-3 transition-all duration-500",
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
                  done && "border-emerald-500/40 bg-emerald-500/5"
                )}
              >
                <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : active ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <e.icon className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <span className="text-sm text-left">{e.label}</span>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StepDone() {
  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-9 h-9 text-emerald-500" />
      </div>
      <h3 className="text-2xl font-serif font-semibold mb-2">$1,237.00 given. Books updated. Receipts filed.</h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        Three recipients funded across three platforms. Your accountant gets a clean export. You get to focus on the work God has called you to.
      </p>
      <div className="grid sm:grid-cols-3 gap-3 max-w-xl mx-auto text-left">
        {[
          { label: "Time spent", value: "~4 seconds" },
          { label: "Platforms touched", value: "5 services" },
          { label: "Manual steps", value: "Zero" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="font-serif text-lg font-semibold">{s.value}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
