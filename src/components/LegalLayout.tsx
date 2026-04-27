import { Link } from "react-router-dom";
import { Logo } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NAV = [
  { to: "/legal", label: "Overview" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
  { to: "/security", label: "Security" },
];

export const LegalLayout = ({
  title,
  updated,
  children,
  current,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
  current: string;
}) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-serif text-xl font-semibold">Steward</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back home
            </Link>
          </Button>
        </div>
      </header>

      <div className="container py-10 md:py-16 max-w-6xl">
        <div className="grid lg:grid-cols-[220px_1fr] gap-10">
          <aside className="lg:sticky lg:top-24 self-start">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
              Legal
            </p>
            <nav className="flex lg:flex-col gap-1 overflow-x-auto">
              {NAV.map((item) => {
                const active = item.to === current;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <article className="min-w-0">
            <p className="text-sm font-medium text-primary tracking-wide uppercase">
              {title}
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-semibold mt-2 leading-tight">
              {title}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Last updated: {updated}
            </p>
            <div className="legal-prose mt-10">{children}</div>
          </article>
        </div>
      </div>
    </div>
  );
};
