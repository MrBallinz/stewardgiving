import { Link } from "react-router-dom";
import { Logo } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight, MessageCircle } from "lucide-react";

const SECTIONS: {
  title: string;
  scripture: string;
  items: { q: string; a: string }[];
}[] = [
  {
    title: "Stewardship & the heart",
    scripture: "“The earth is the Lord's, and everything in it.” — Psalm 24:1",
    items: [
      {
        q: "What does Steward mean by ‘stewardship’?",
        a: "Stewardship is the conviction that nothing we hold is ultimately ours — we are managers of resources entrusted to us by God. Steward exists to help business owners manage profit with that posture: with clarity, discipline, and joy rather than anxiety or guilt.",
      },
      {
        q: "Is giving a tithe (10%) required?",
        a: "Steward does not require any specific percentage. The tithe is a beautiful historic anchor (Mal. 3:10) and many believers begin there. The New Testament emphasizes freewill, cheerful, proportional giving (2 Cor. 9:7). Set the percentage your conscience can keep faithfully — and grow from there.",
      },
      {
        q: "Why give from profit instead of revenue?",
        a: "Revenue is gross — it includes money owed to suppliers, employees, and tax. Profit is what truly belongs to the business owner. Giving from profit honors both Scripture's principle of firstfruits (Prov. 3:9) and the basic justice of paying what you owe before giving what you choose.",
      },
    ],
  },
  {
    title: "Using the app",
    scripture: "“Whatever you do, work at it with all your heart.” — Col. 3:23",
    items: [
      {
        q: "How do I connect my business bank account?",
        a: "Go to **Settings → Bank Connections**. We use a secure read-only connection to compute monthly profit. Steward never stores funds and never moves money without your explicit approval each month.",
      },
      {
        q: "How do I add or change recipients?",
        a: "Open the **Recipients** page. Add your church, missions agencies, or nonprofits, and set the percentage of giving each one receives. Allocations must total 100%.",
      },
      {
        q: "What is a ‘giving covenant’?",
        a: "Your covenant is the rule you commit to: a percentage of monthly profit, a minimum monthly amount, and whether transfers happen automatically. Set it on the **Covenant** page. You can update it any time the Lord leads.",
      },
      {
        q: "How does the year-end report work?",
        a: "The **Report** page generates a tax-ready summary of every gift made through Steward — recipient, date, amount, and EIN where provided. Download it as a PDF for your CPA.",
      },
    ],
  },
  {
    title: "Faith & freedom",
    scripture:
      "“God loves a cheerful giver.” — 2 Corinthians 9:7",
    items: [
      {
        q: "What if I'm not sure about my faith?",
        a: "You are welcome here. Steward is built on Christian convictions about generosity, but the discipline of giving thoughtfully and consistently blesses anyone who practices it. Use what helps and ignore what doesn't.",
      },
      {
        q: "What if my business has a hard month and there's no profit?",
        a: "Then there is nothing to tithe from that month, and that is okay. The covenant is meant to free you from anxiety, not bind you to impossibility. Your minimum-monthly setting can act as a faith stretch in lean seasons — but you decide.",
      },
      {
        q: "Can I give to non-religious nonprofits?",
        a: "Yes. Steward supports churches, missions, and any 501(c)(3) or recognized nonprofit. Many believers give to a mix — local church first, then mercy and justice causes that reflect God's heart for the poor, the orphan, and the stranger.",
      },
      {
        q: "Will Steward share my financial data?",
        a: "No. Your data is private to you. We do not sell, share, or use it to train external models. Read-only bank access is encrypted end to end.",
      },
    ],
  },
];

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-serif text-xl font-semibold">Steward</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              to="/faith"
              className="px-3 py-1.5 text-muted-foreground hover:text-foreground"
            >
              Statement of faith
            </Link>
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="container py-16 md:py-24 max-w-3xl">
        <p className="text-sm font-medium text-primary tracking-wide uppercase">
          Frequently asked
        </p>
        <h1 className="font-serif text-4xl md:text-5xl font-semibold mt-3 leading-tight">
          Honest answers, rooted in Scripture.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          Practical questions about Steward — and the deeper questions about
          giving, profit, and the freedom of an open hand.
        </p>

        <div className="mt-12 space-y-12">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="font-serif text-2xl font-semibold">
                {section.title}
              </h2>
              <blockquote className="mt-2 text-sm italic text-muted-foreground border-l-2 border-primary/40 pl-3">
                {section.scripture}
              </blockquote>
              <Accordion type="single" collapsible className="mt-4">
                {section.items.map((item, i) => (
                  <AccordionItem key={i} value={`${section.title}-${i}`}>
                    <AccordionTrigger className="text-left font-medium">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {item.a.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                        part.startsWith("**") ? (
                          <strong key={j} className="text-foreground">
                            {part.slice(2, -2)}
                          </strong>
                        ) : (
                          <span key={j}>{part}</span>
                        ),
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-border bg-secondary/40 p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div>
            <h3 className="font-serif text-xl font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Still have a question?
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Chat with the Steward Companion — a faith-rooted AI guide
              available on every page.
            </p>
          </div>
          <Button asChild>
            <Link to="/faith">
              Read our convictions <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
