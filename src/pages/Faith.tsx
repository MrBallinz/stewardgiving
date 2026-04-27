import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/AppShell";
import { ArrowLeft, ArrowRight, Compass, HandCoins, ScrollText, Sprout } from "lucide-react";
import brandTexture from "@/assets/brand-texture.jpg";

const PILLARS = [
  {
    icon: Compass,
    title: "Stewardship, not ownership",
    body: "We believe every dollar that flows through a business is held in trust. The owner is a steward — accountable, attentive, and free. Steward exists to make that posture practical, not abstract.",
  },
  {
    icon: HandCoins,
    title: "Generosity as a discipline",
    body: "Generosity rarely happens by accident. It happens through systems quietly built in seasons of clarity, so that in seasons of pressure, the right thing still happens. We help you build that system once and live inside it.",
  },
  {
    icon: ScrollText,
    title: "Excellence as worship",
    body: "Sloppy books, vague numbers, and end-of-year guesswork dishonor the work. Clean accounting, honest reports, and on-time giving are spiritual acts when done as unto the Lord.",
  },
  {
    icon: Sprout,
    title: "The long obedience",
    body: "Building a business that gives well is a decades-long practice, not a campaign. We're building Steward to be the quiet, faithful tool you'll still be using twenty years from now.",
  },
];

const SCRIPTURES = [
  {
    text: "Honor the Lord with your wealth, with the firstfruits of all your crops; then your barns will be filled to overflowing.",
    ref: "Proverbs 3:9–10",
  },
  {
    text: "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.",
    ref: "2 Corinthians 9:7",
  },
  {
    text: "Whatever you do, work heartily, as for the Lord and not for men.",
    ref: "Colossians 3:23",
  },
];

const Faith = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/40">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-serif text-xl font-semibold">Steward</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back home
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <img
          src={brandTexture}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-multiply pointer-events-none"
          width={1920}
          height={1080}
        />
        <div className="container relative pt-20 pb-20 md:pt-28 md:pb-28 max-w-3xl text-center">
          <p className="text-sm font-medium text-gold uppercase tracking-wider mb-4 animate-fade-up">
            Our statement of faith
          </p>
          <h1 className="font-serif text-5xl md:text-6xl font-semibold tracking-tight animate-fade-up [animation-delay:80ms] opacity-0">
            Why <span className="text-gold italic">Steward</span> exists.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed animate-fade-up [animation-delay:160ms] opacity-0">
            We are building a tool for Christian business owners who want their books to tell the truth and their giving to follow it. This page is the why behind the software.
          </p>
        </div>
      </section>

      {/* Opening letter */}
      <section className="container py-20 md:py-24 max-w-3xl">
        <div className="space-y-6 text-lg leading-relaxed text-foreground/90 font-serif">
          <p>
            Most business owners we know want to be generous. Few of them feel they actually are. Not because they don't care, but because the work of <em>knowing what to give</em> is buried under invoices, payroll, taxes, and the next quarter's runway.
          </p>
          <p>
            Steward exists to lift that weight. To turn the cluttered question of <em>"how much should we give this month?"</em> into a clean number, a clear list of recipients, and a single faithful click.
          </p>
          <p>
            We are not a church. We are not a financial advisor. We are a small team of builders and believers who think the discipline of generosity deserves software as careful as the spreadsheets it replaces.
          </p>
        </div>
      </section>

      {/* Pillars */}
      <section className="border-y border-border/60 bg-card/40">
        <div className="container py-20 md:py-28">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <p className="text-sm font-medium text-gold uppercase tracking-wider mb-3">What we believe</p>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold">
              Four convictions that shape every decision.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {PILLARS.map((p) => (
              <Card key={p.title} className="p-8 shadow-card border-border/60">
                <div className="h-11 w-11 rounded-lg bg-gold-soft grid place-items-center mb-5">
                  <p.icon className="h-5 w-5 text-gold" />
                </div>
                <h3 className="font-serif text-2xl font-semibold mb-3">{p.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{p.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Scriptures */}
      <section className="container py-20 md:py-28">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-sm font-medium text-gold uppercase tracking-wider mb-3">The anchor</p>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold">
            The verses we keep returning to.
          </h2>
        </div>
        <div className="max-w-3xl mx-auto space-y-10">
          {SCRIPTURES.map((s) => (
            <figure key={s.ref} className="border-l-2 border-gold/60 pl-8 py-2">
              <blockquote className="scripture text-2xl md:text-3xl leading-relaxed">
                "{s.text}"
              </blockquote>
              <figcaption className="mt-4 text-sm text-muted-foreground tracking-wider uppercase">
                — {s.ref}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* How it empowers */}
      <section className="border-t border-border/60 bg-card/40">
        <div className="container py-20 md:py-28 max-w-4xl">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-gold uppercase tracking-wider mb-3">In practice</p>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold">
              How faith and discipline meet in the software.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                n: "01",
                title: "Clarity replaces guilt",
                body: "When the number is calculated honestly from your real profit, you stop wondering if you gave enough. You know.",
              },
              {
                n: "02",
                title: "Habit replaces hustle",
                body: "Auto-calculated giving every month builds a rhythm that survives busy seasons, hard quarters, and forgetful weeks.",
              },
              {
                n: "03",
                title: "Witness replaces noise",
                body: "A year-end stewardship report becomes a quiet record — for your accountant, your family, and your own soul.",
              },
            ].map((item) => (
              <div key={item.n}>
                <p className="stat-number text-4xl text-gold mb-3">{item.n}</p>
                <h3 className="font-serif text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="container py-20 md:py-28">
        <Card className="p-10 md:p-16 bg-primary text-primary-foreground border-primary shadow-elevated text-center">
          <p className="scripture text-2xl md:text-3xl leading-relaxed max-w-2xl mx-auto text-primary-foreground">
            "Whoever can be trusted with very little can also be trusted with much."
          </p>
          <p className="mt-4 text-sm text-primary-foreground/70 tracking-wider uppercase">— Luke 16:10</p>
          <div className="mt-10">
            <Button size="lg" asChild className="bg-gold text-gold-foreground hover:bg-gold/90 border-0 h-12 px-6 text-base">
              <Link to="/auth">
                Begin stewarding well
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card/30">
        <div className="container py-8 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} Steward. All rights reserved.</span>
          <Link to="/" className="hover:text-foreground">Back to home</Link>
        </div>
      </footer>
    </div>
  );
};

export default Faith;
