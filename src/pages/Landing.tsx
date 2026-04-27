import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/AppShell";
import {
  ArrowRight,
  Banknote,
  HandCoins,
  LineChart,
  Check,
  ShieldCheck,
} from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/40">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-serif text-xl font-semibold">Steward</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
            <a href="#faith" className="hover:text-foreground transition">Our statement</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">Start free trial</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="container relative pt-20 pb-24 md:pt-28 md:pb-32 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground mb-8 animate-fade-up">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Built for business owners who want to give well
          </div>
          <h1 className="font-serif text-5xl md:text-7xl font-semibold tracking-tight text-foreground animate-fade-up [animation-delay:80ms] opacity-0">
            Run your business.
            <br />
            <span className="text-gold italic">Steward</span> your profit.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-up [animation-delay:160ms] opacity-0">
            The financial OS for Christian business owners. Automated giving,
            beautiful stewardship reports, total clarity.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up [animation-delay:240ms] opacity-0">
            <Button size="lg" asChild className="h-12 px-6 text-base">
              <Link to="/auth">
                Start your 14-day trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" asChild className="h-12 px-6 text-base">
              <a href="#features">See how it works</a>
            </Button>
          </div>
          <p className="mt-8 text-sm text-muted-foreground/80 animate-fade-up [animation-delay:320ms] opacity-0">
            Join 500+ Christian business owners stewarding well.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-20 md:py-28">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-sm font-medium text-gold uppercase tracking-wider mb-3">How it works</p>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold">
            From profit to purpose, in three steps.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Banknote,
              title: "Connect your accounts",
              body: "Securely link your business bank in seconds. We read transactions to compute monthly profit — never store funds, never move money without your consent.",
            },
            {
              icon: HandCoins,
              title: "Set your covenant",
              body: "Choose a percentage of profit to give each month. Pick your recipients — your church, missions, nonprofits — and set the split that reflects your calling.",
            },
            {
              icon: LineChart,
              title: "Give with clarity",
              body: "Approve giving each month with one click. Get a beautiful, tax-ready year-end statement that turns numbers into a record of stewardship.",
            },
          ].map((f) => (
            <Card key={f.title} className="p-8 shadow-card hover:shadow-elevated transition-shadow border-border/60">
              <div className="h-11 w-11 rounded-lg bg-gold-soft text-gold-foreground grid place-items-center mb-5">
                <f.icon className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="font-serif text-2xl font-semibold mb-2">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Scripture pull-quote */}
      <section className="border-y border-border/60 bg-card/50">
        <div className="container py-20 md:py-24 text-center max-w-3xl">
          <p className="scripture text-2xl md:text-3xl leading-relaxed">
            "Honor the Lord with your wealth, with the firstfruits of all your crops."
          </p>
          <p className="mt-4 text-sm text-muted-foreground tracking-wider uppercase">— Proverbs 3:9</p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container py-20 md:py-28">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-sm font-medium text-gold uppercase tracking-wider mb-3">Pricing</p>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold">
            Simple plans. No surprises.
          </h2>
          <p className="mt-4 text-muted-foreground">
            14 days free. Cancel anytime. All plans include automated giving and year-end reports.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              name: "Starter",
              price: "$19",
              tag: "For solopreneurs",
              features: ["1 business entity", "Up to 3 recipients", "Monthly summaries", "Year-end PDF report"],
            },
            {
              name: "Steward",
              price: "$49",
              tag: "Most popular",
              features: ["1 business entity", "Unlimited recipients", "Auto-transfer giving", "Year-end PDF report", "Priority support"],
              highlighted: true,
            },
            {
              name: "Kingdom",
              price: "$99",
              tag: "For multi-entity",
              features: ["Up to 5 entities", "Unlimited recipients", "Custom giving rules", "Dedicated advisor calls", "Tax-pro export"],
            },
          ].map((p) => (
            <Card
              key={p.name}
              className={`p-8 shadow-card flex flex-col ${
                p.highlighted ? "border-gold/60 ring-1 ring-gold/30 shadow-gold" : "border-border/60"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-serif text-2xl font-semibold">{p.name}</h3>
                {p.highlighted && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gold-soft text-foreground">
                    {p.tag}
                  </span>
                )}
              </div>
              {!p.highlighted && <p className="text-sm text-muted-foreground">{p.tag}</p>}
              <div className="mt-6 mb-6">
                <span className="stat-number text-5xl font-semibold">{p.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant={p.highlighted ? "default" : "outline"} className="w-full">
                <Link to="/auth">Start free trial</Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="container pb-20">
        <Card className="p-8 md:p-12 bg-primary text-primary-foreground border-primary shadow-elevated">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
            <div className="max-w-xl">
              <ShieldCheck className="h-8 w-8 text-gold mb-4" />
              <h3 className="font-serif text-3xl font-semibold mb-2">
                Built like a bank. Designed like Linear.
              </h3>
              <p className="text-primary-foreground/80">
                Bank-grade encryption, read-only connections, and you approve every transfer. Your money stays your money.
              </p>
            </div>
            <Button size="lg" variant="secondary" asChild className="bg-gold text-gold-foreground hover:bg-gold/90 border-0">
              <Link to="/auth">
                Start free trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer id="faith" className="border-t border-border/60 bg-card/30">
        <div className="container py-12 grid md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <Logo />
              <span className="font-serif text-lg font-semibold">Steward</span>
            </Link>
            <p className="text-sm text-muted-foreground">Built for the long obedience of doing business well.</p>
          </div>
          <div>
            <p className="text-sm font-medium mb-3">Product</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
              <li><Link to="/auth" className="hover:text-foreground">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium mb-3">Company</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Statement of faith</a></li>
              <li><a href="#" className="hover:text-foreground">Contact</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium mb-3">Legal</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Privacy</a></li>
              <li><a href="#" className="hover:text-foreground">Terms</a></li>
              <li><a href="#" className="hover:text-foreground">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="container border-t border-border/60 py-6 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} Steward. All rights reserved.</span>
          <span className="scripture">"Whatever you do, work heartily, as for the Lord." — Col. 3:23</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
