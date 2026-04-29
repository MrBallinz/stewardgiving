import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/AppShell";

const schema = z
  .object({
    password: z.string().min(8, "At least 8 characters").max(100),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase places a recovery token in the URL hash; the SDK consumes it
    // automatically and emits PASSWORD_RECOVERY. We just gate the form on it.
    const hash = window.location.hash || "";
    if (hash.includes("type=recovery")) setReady(true);

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      toast({
        title: "Check your password",
        description: parsed.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    setBusy(false);
    if (error) {
      toast({
        title: "Couldn't update password",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Password updated", description: "You're all set." });
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <Logo />
          <span className="font-serif text-xl font-semibold">Steward</span>
        </Link>
        <h1 className="font-serif text-3xl font-semibold mb-2">
          Choose a new password
        </h1>
        <p className="text-muted-foreground mb-8">
          {ready
            ? "Set a strong password you'll remember."
            : "Open this page from the reset link in your email."}
        </p>
        <Card className="p-6 shadow-card border-border/60">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rp-pass">New password</Label>
              <Input
                id="rp-pass"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={!ready}
              />
              <p className="text-xs text-muted-foreground">
                At least 8 characters.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rp-confirm">Confirm password</Label>
              <Input
                id="rp-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                disabled={!ready}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy || !ready}>
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
