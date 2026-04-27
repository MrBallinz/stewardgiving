import { Link, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Logo />
            <span className="font-serif text-xl font-semibold">Steward</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {[
              { to: "/dashboard", label: "Dashboard" },
              { to: "/recipients", label: "Recipients" },
              { to: "/covenant", label: "Covenant" },
              { to: "/report", label: "Report" },
              { to: "/settings", label: "Settings" },
            ].map((l) => (
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
          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Sign out</span>
          </Button>
        </div>
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
