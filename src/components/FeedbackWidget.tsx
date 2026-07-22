import { useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquarePlus, X, Loader2, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const HIDDEN_ROUTES = new Set([
  "/", "/auth", "/forgot-password", "/reset-password",
  "/faith", "/demo", "/faq",
  "/privacy", "/terms", "/security", "/legal",
  "/.lovable/oauth/consent",
]);

export const FeedbackWidget = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState<string | null>(null);

  if (HIDDEN_ROUTES.has(pathname) || !user) return null;

  const submit = async () => {
    const text = message.trim();
    if (!text || sending) return;
    setSending(true);
    setReply(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Please sign in first.");
        setSending(false);
        return;
      }
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/feedback-triage`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          message: text,
          route: pathname,
          userAgent: navigator.userAgent,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
        }),
      });
      if (!resp.ok) {
        toast.error("Couldn't send feedback. Please try again.");
        setSending(false);
        return;
      }
      const data = await resp.json();
      setMessage("");
      if (data.auto_reply) {
        setReply(data.auto_reply);
      } else {
        toast.success("Thank you — we've received your feedback.");
        setOpen(false);
      }
    } catch (e) {
      console.error(e);
      toast.error("Connection error.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="no-print fixed bottom-5 left-5 z-50 h-12 rounded-full bg-secondary text-secondary-foreground border border-border shadow-md px-4 flex items-center gap-2 hover:scale-105 transition-transform text-sm font-medium"
          aria-label="Send feedback or report an issue"
        >
          <MessageSquarePlus className="h-4 w-4" />
          Feedback
        </button>
      )}

      {open && (
        <div className={cn(
          "no-print fixed z-50 bg-background border border-border rounded-2xl shadow-elegant flex flex-col overflow-hidden",
          "bottom-5 left-5 w-[calc(100vw-2.5rem)] max-w-sm",
        )}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/40">
            <div>
              <div className="font-serif font-semibold leading-tight">Send feedback</div>
              <div className="text-xs text-muted-foreground">Bug, idea, or question</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => { setOpen(false); setReply(null); }} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {reply ? (
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm text-foreground whitespace-pre-wrap">{reply}</div>
              </div>
              <p className="text-xs text-muted-foreground">
                If this didn't answer your question, click below and we'll route it to a human.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setReply(null)}>
                  Ask something else
                </Button>
                <Button size="sm" onClick={() => { setOpen(false); setReply(null); }}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What went wrong, or what would help you? We capture your current page automatically."
                className="min-h-[100px] resize-none"
                maxLength={4000}
                disabled={sending}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Route: <code className="text-[10px]">{pathname}</code>
                </span>
                <Button size="sm" onClick={submit} disabled={sending || message.trim().length < 3}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1" /> Send</>}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
