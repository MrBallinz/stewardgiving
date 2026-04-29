import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Service business");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, business_name, business_type")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setFullName(data.full_name ?? "");
        setBusinessName(data.business_name ?? "");
        setBusinessType(data.business_type ?? "Service business");
      }
      setLoading(false);
    })();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName.trim(),
      business_name: businessName.trim(),
      business_type: businessType,
    }).eq("id", user.id);
    setSavingProfile(false);
    if (error) return toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    toast({ title: "Profile saved" });
  };

  const changePassword = async () => {
    if (!user?.email) return;
    if (newPassword.length < 8) {
      return toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
    }
    if (!currentPassword) {
      return toast({ title: "Enter your current password", description: "We need it to confirm it's really you.", variant: "destructive" });
    }
    setSavingPassword(true);
    // Re-authenticate with current password before changing.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (reauthError) {
      setSavingPassword(false);
      return toast({ title: "Current password is incorrect", variant: "destructive" });
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) return toast({ title: "Couldn't change password", description: error.message, variant: "destructive" });
    setNewPassword("");
    setCurrentPassword("");
    toast({ title: "Password updated" });
  };

  const deleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    // Edge function uses the service role to delete the auth.users row,
    // which cascades to all user-owned tables.
    const { error } = await supabase.functions.invoke("account-delete");
    setDeleting(false);
    if (error) {
      return toast({
        title: "Couldn't delete account",
        description: error.message ?? "Please try again or contact support.",
        variant: "destructive",
      });
    }
    await supabase.auth.signOut();
    toast({ title: "Account deleted", description: "Your account and all data have been permanently removed." });
    navigate("/");
  };

  return (
    <AppShell>
      <div className="container py-10 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your profile, business, and account.</p>
        </div>

        {loading ? (
          <div className="space-y-6"><Skeleton className="h-72" /><Skeleton className="h-48" /><Skeleton className="h-32" /></div>
        ) : (
          <div className="space-y-6">
            {/* Profile */}
            <Card className="p-6 shadow-card border-border/60 space-y-5">
              <div>
                <h2 className="font-serif text-xl font-semibold">Profile</h2>
                <p className="text-sm text-muted-foreground">Your name and business details.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email ?? ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full">Full name</Label>
                <Input id="full" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bn">Business name</Label>
                <Input id="bn" value={businessName} onChange={(e) => setBusinessName(e.target.value)} maxLength={120} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bt">Business type</Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger id="bt"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Service business", "Trades & contracting", "Retail / e-commerce", "Professional services", "Real estate", "Other"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save profile
                </Button>
              </div>
            </Card>

            {/* Password */}
            <Card className="p-6 shadow-card border-border/60 space-y-5">
              <div>
                <h2 className="font-serif text-xl font-semibold">Password</h2>
                <p className="text-sm text-muted-foreground">Change your sign-in password. (Not applicable for Google sign-in.)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="np">New password</Label>
                <Input id="np" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
                <p className="text-xs text-muted-foreground">At least 8 characters.</p>
              </div>
              <div className="flex justify-end">
                <Button onClick={changePassword} disabled={savingPassword || !newPassword}>
                  {savingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update password
                </Button>
              </div>
            </Card>

            {/* Danger */}
            <Card className="p-6 shadow-card border-destructive/30 bg-destructive/5">
              <h2 className="font-serif text-xl font-semibold text-destructive">Delete account</h2>
              <p className="text-sm text-muted-foreground mt-1 mb-5">
                Permanently delete your Steward data. This cannot be undone.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />Delete my account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your profile, recipients, covenant, monthly summaries, and giving history will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Settings;
