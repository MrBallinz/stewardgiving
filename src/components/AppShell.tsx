import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/recipients", label: "Recipients" },
  { to: "/covenant", label: "Covenant" },
  { to: "/report", label: "Report" },
  { to: "/settings", label: "Settings" },
];

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-40 no-print">
        <div className="container flex h-16 items-center justify-between gap-2">
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <Logo />
            <span className="font-serif text-xl font-semibold">Steward</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hidden sm:inline-flex">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Sign out</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden border-t border-border/60 bg-background">
            <nav className="container py-2 flex flex-col">
              {NAV_LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                      isActive ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              <button
                onClick={() => {
                  setOpen(false);
                  signOut();
                }}
                className="px-3 py-3 mt-1 text-left text-sm font-medium text-muted-foreground hover:text-foreground border-t border-border/60 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </nav>
          </div>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
};

export const Logo = ({ className = "h-8 w-8" }: { className?: string }) => (
  <div className={`${className} rounded-lg bg-primary text-primary-foreground grid place-items-center`}>
    <span className="font-serif font-bold text-base leading-none">S</span>
  </div>
);
