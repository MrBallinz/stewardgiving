import { Link, useLocation } from "react-router-dom";
import { Bell, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";

// Global banner shown at the top of authed pages when the user has
// unactioned notifications (giving-ready, feedback replies, etc.).
// The dashboard/settings pages render this via <AppShell> children;
// we mount it once at the app root so it appears above every route.
const HIDDEN_ROUTES = new Set([
  "/", "/auth", "/forgot-password", "/reset-password",
  "/faith", "/demo", "/faq",
  "/privacy", "/terms", "/security", "/legal",
  "/.lovable/oauth/consent",
]);

export const NotificationBanner = () => {
  const { pathname } = useLocation();
  const { items, dismiss, markRead } = useNotifications();

  if (HIDDEN_ROUTES.has(pathname)) return null;
  if (!items.length) return null;

  return (
    <div className="no-print sticky top-16 z-30 border-b border-primary/20 bg-primary/5 backdrop-blur">
      <div className="container py-2 space-y-1.5">
        {items.slice(0, 3).map((n) => (
          <div
            key={n.id}
            className="flex items-start gap-3 rounded-lg bg-background/60 border border-border/60 px-3 py-2"
          >
            <Bell className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">{n.title}</div>
              {n.body && (
                <div className="text-xs text-muted-foreground line-clamp-2">{n.body}</div>
              )}
            </div>
            {n.action_url && (
              <Button
                asChild
                size="sm"
                variant="default"
                className="h-7 text-xs"
                onClick={() => markRead(n.id)}
              >
                <Link to={n.action_url}>
                  Open <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            )}
            <button
              onClick={() => dismiss(n.id)}
              className="p-1 text-muted-foreground hover:text-foreground rounded-md"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {items.length > 3 && (
          <div className="text-xs text-muted-foreground text-center">
            +{items.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
};
