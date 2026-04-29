import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

const KEY = "steward.cookieConsent.v1";

export const CookieBanner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      // storage unavailable — don't block UI
    }
  }, []);

  const decide = (value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({ value, at: new Date().toISOString() }),
      );
    } catch { /* ignore */ }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="no-print fixed inset-x-3 bottom-3 z-[60] md:left-auto md:right-5 md:bottom-5 md:max-w-md"
    >
      <div className="rounded-2xl border border-border bg-background/95 backdrop-blur shadow-elegant p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h2 className="font-serif text-base font-semibold mb-1">
              We respect your privacy
            </h2>
            <p className="text-sm text-muted-foreground">
              We use essential cookies to keep you signed in and remember your
              preferences. With your permission we may also use analytics
              cookies to improve Steward. See our{" "}
              <Link to="/privacy" className="underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => decide("accepted")}>
                Accept all
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => decide("rejected")}
              >
                Essential only
              </Button>
            </div>
          </div>
          <button
            aria-label="Dismiss"
            onClick={() => decide("rejected")}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
