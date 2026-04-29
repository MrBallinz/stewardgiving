import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/AppShell";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
});

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      toast({
        title: "Check your email",
        description: parsed.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      { redirectTo: `${window.location.origin}/reset-password` },
    );
    setBusy(false);
    if (error) {
      toast({
        title: "Couldn't send reset email",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <Logo />
          <span className="font-serif text-xl font-semibold">Steward</span>
        </Link>
        <h1 className="font-serif text-3xl font-semibold mb-2">
          Reset your password
        </h1>
        <p className="text-muted-foreground mb-8">
          Enter your email and we'll send you a secure link to set a new password.
        </p>
        <Card className="p-6 shadow-card border-border/60">
          {sent ? (
            <div className="space-y-4">
              <p className="text-sm">
                If an account exists for <strong>{email}</strong>, a reset link
                is on its way. Check your inbox (and spam folder).
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/auth">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fp-email">Email</Label>
                <Input
                  id="fp-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send reset link
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/auth">Back to sign in</Link>
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
