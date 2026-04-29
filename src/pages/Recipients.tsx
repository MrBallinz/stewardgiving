import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { formatPercent } from "@/lib/format";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Plus, Pencil, Trash2, AlertTriangle, ExternalLink, Search, Sparkles, ShieldCheck, ShieldAlert, ShieldQuestion, Loader2 } from "lucide-react";
import {
  PLATFORMS, PLATFORM_BY_ID, buildDonateUrl, type PlatformId,
} from "@/lib/giving-platforms";
import { ChurchSearch, type ChurchRow } from "@/components/ChurchSearch";

type RecipientType = "church" | "missions" | "nonprofit" | "other";
type VerificationStatus = "unverified" | "verified" | "review" | "failed";
type Recipient = {
  id: string;
  name: string;
  type: RecipientType;
  allocation_percent: number;
  ein: string | null;
  platform: PlatformId | null;
  platform_slug: string | null;
  donate_url: string | null;
  website: string | null;
  verification_status: VerificationStatus;
  verified_at: string | null;
  verified_name: string | null;
  verified_logo_url: string | null;
  verified_ein: string | null;
  verification_notes: string | null;
};

const TYPE_LABEL: Record<RecipientType, string> = {
  church: "Church", missions: "Missions", nonprofit: "Nonprofit", other: "Other",
};

const PIE_COLORS = ["hsl(217 51% 12%)", "hsl(41 47% 59%)", "hsl(217 30% 35%)", "hsl(41 30% 45%)", "hsl(217 20% 55%)", "hsl(38 25% 70%)"];

const verificationBadge = (status: VerificationStatus) => {
  switch (status) {
    case "verified":
      return { icon: <ShieldCheck className="h-3 w-3" />, label: "Verified", className: "border-success/40 text-success bg-success/5" };
    case "review":
      return { icon: <ShieldQuestion className="h-3 w-3" />, label: "Needs review", className: "border-gold/50 text-foreground bg-gold-soft/40" };
    case "failed":
      return { icon: <ShieldAlert className="h-3 w-3" />, label: "Unverified", className: "border-destructive/40 text-destructive bg-destructive/5" };
    default:
      return { icon: <ShieldQuestion className="h-3 w-3" />, label: "Unverified", className: "border-border text-muted-foreground" };
  }
};

const Recipients = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Recipient[]>([]);
  const [editing, setEditing] = useState<Recipient | null>(null);
  const [open, setOpen] = useState(false);

  const total = useMemo(() => items.reduce((a, r) => a + Number(r.allocation_percent), 0), [items]);
  const balanced = Math.abs(total - 100) < 0.05;

  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("giving_recipients")
      .select("id, name, type, allocation_percent, ein, platform, platform_slug, donate_url, website, verification_status, verified_at, verified_name, verified_logo_url, verified_ein, verification_notes")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setItems((data as Recipient[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("giving_recipients").delete().eq("id", id);
    if (error) return toast({ title: "Couldn't delete", description: error.message, variant: "destructive" });
    toast({ title: "Recipient removed" });
    refresh();
  };

  const verify = async (r: Recipient) => {
    if (!r.website && !r.donate_url) {
      return toast({ title: "Add a website or donate URL first", variant: "destructive" });
    }
    setVerifyingId(r.id);
    const { data, error } = await supabase.functions.invoke("verify-recipient", {
      body: { recipient_id: r.id },
    });
    setVerifyingId(null);
    if (error) return toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    const status = (data as { status?: string })?.status;
    toast({
      title: status === "verified" ? "Recipient verified" : status === "review" ? "Needs review" : "Could not verify",
      description: (data as { verification_notes?: string })?.verification_notes ?? undefined,
      variant: status === "failed" ? "destructive" : "default",
    });
    refresh();
  };

  const openAdd = () => { setEditing(null); setOpen(true); };
  const openEdit = (r: Recipient) => { setEditing(r); setOpen(true); };

  return (
    <AppShell>
      <div className="container py-10 max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-4xl font-semibold tracking-tight">Recipients</h1>
            <p className="text-muted-foreground mt-1">Where your giving goes, and how it's sent.</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />Add recipient
          </Button>
        </div>

        {!loading && !balanced && items.length > 0 && (
          <Card className="p-4 mb-6 border-gold/50 bg-gold-soft/40 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-foreground mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Allocations don't add up to 100%.</p>
              <p className="text-muted-foreground">Currently {formatPercent(total)}. Adjust your recipients so the split balances.</p>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="grid md:grid-cols-[1fr,300px] gap-6">
            <Skeleton className="h-80" /><Skeleton className="h-80" />
          </div>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <p className="scripture text-lg mb-2">No giving yet — let's set up your first recipient.</p>
            <p className="text-muted-foreground mb-6 text-sm">Search a known church or add one manually.</p>
            <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add recipient</Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-[1fr,300px] gap-6">
            <Card className="shadow-card border-border/60 divide-y divide-border/60">
              {items.map((r, i) => {
                const platform = r.platform ? PLATFORM_BY_ID[r.platform] : null;
                const link = r.donate_url || (r.platform && r.platform_slug
                  ? buildDonateUrl({ name: r.name, type: r.type === "other" ? "nonprofit" : r.type, platform: r.platform, slug: r.platform_slug })
                  : null);
                const vBadge = verificationBadge(r.verification_status);
                const isVerifying = verifyingId === r.id;
                return (
                  <div key={r.id} className="p-5 flex items-center gap-4">
                    {r.verified_logo_url ? (
                      <img src={r.verified_logo_url} alt="" className="h-10 w-10 rounded-lg shrink-0 object-contain bg-card border border-border/60 p-1" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{r.verified_name || r.name}</p>
                        <Badge variant="outline" className="text-xs font-normal">{TYPE_LABEL[r.type]}</Badge>
                        {platform && (
                          <Badge variant="secondary" className="text-xs font-normal">via {platform.name}</Badge>
                        )}
                        <Badge variant="outline" className={`text-xs font-normal inline-flex items-center gap-1 ${vBadge.className}`}>
                          {vBadge.icon}{vBadge.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {link ? (
                          <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground underline-offset-4 hover:underline">
                            Donate page <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : r.ein ? `EIN ${r.ein}` : "No giving link on file"}
                        {r.verification_notes && (
                          <span className="ml-2 text-xs text-destructive/80">· {r.verification_notes}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="stat-number text-2xl font-semibold">{formatPercent(r.allocation_percent)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="icon"
                        title="Verify recipient"
                        disabled={isVerifying || (!r.website && !r.donate_url)}
                        onClick={() => verify(r)}
                      >
                        {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove {r.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Past giving records to this recipient stay on your year-end report. You can always add them back later.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(r.id)}>Remove</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
              <div className="p-5 flex items-center justify-between bg-muted/30">
                <span className="text-sm text-muted-foreground">Total allocation</span>
                <span className={`stat-number text-xl font-semibold ${balanced ? "text-success" : "text-destructive"}`}>
                  {formatPercent(total)}
                </span>
              </div>
            </Card>

            <Card className="shadow-card border-border/60 p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">The split</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={items.map((r) => ({ name: r.name, value: Number(r.allocation_percent) }))}
                      dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} stroke="none"
                    >
                      {items.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => formatPercent(v)}
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2 mt-4">
                {items.map((r, i) => (
                  <li key={r.id} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="flex-1 truncate">{r.name}</span>
                    <span className="stat-number text-muted-foreground">{formatPercent(r.allocation_percent)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </div>

      <RecipientDialog open={open} onOpenChange={setOpen} editing={editing} userId={user?.id} onSaved={refresh} />
    </AppShell>
  );
};

const RecipientDialog = ({
  open, onOpenChange, editing, userId, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Recipient | null;
  userId: string | undefined;
  onSaved: () => void;
}) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<RecipientType>("church");
  const [percent, setPercent] = useState<number>(0);
  const [ein, setEin] = useState("");
  const [platform, setPlatform] = useState<PlatformId | "">("");
  const [platformSlug, setPlatformSlug] = useState("");
  const [donateUrl, setDonateUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [churchId, setChurchId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setType(editing?.type ?? "church");
      setPercent(editing ? Number(editing.allocation_percent) : 0);
      setEin(editing?.ein ?? "");
      setPlatform((editing?.platform as PlatformId) ?? "");
      setPlatformSlug(editing?.platform_slug ?? "");
      setDonateUrl(editing?.donate_url ?? "");
      setWebsite(editing?.website ?? "");
      setChurchId(null);
    }
  }, [open, editing]);

  const applyChurch = (c: ChurchRow) => {
    setName(c.dba_name ?? c.legal_name);
    setChurchId(c.id);
    setEin(c.ein ?? "");
    setWebsite(c.website ?? "");
    setDonateUrl(c.giving_url ?? "");
    if (c.giving_platform) setPlatform(c.giving_platform as PlatformId);
    toast({ title: `Loaded ${c.dba_name ?? c.legal_name}` });
  };

  const previewUrl = useMemo(() => {
    if (donateUrl) return donateUrl;
    if (platform && platformSlug) {
      return buildDonateUrl({ name, type: type === "other" ? "nonprofit" : type, platform, slug: platformSlug });
    }
    return null;
  }, [donateUrl, platform, platformSlug, name, type]);

  const save = async () => {
    if (!userId) return;
    if (!name.trim()) return toast({ title: "Add a name", variant: "destructive" });
    if (percent < 0 || percent > 100) return toast({ title: "Allocation must be between 0 and 100", variant: "destructive" });
    setBusy(true);
    const payload = {
      user_id: userId,
      name: name.trim(),
      type,
      allocation_percent: percent,
      ein: ein.trim() || null,
      platform: platform || null,
      platform_slug: platformSlug.trim() || null,
      donate_url: donateUrl.trim() || null,
      website: website.trim() || null,
    };
    const { error } = editing
      ? await supabase.from("giving_recipients").update(payload).eq("id", editing.id)
      : await supabase.from("giving_recipients").insert(payload);
    setBusy(false);
    if (error) return toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    toast({ title: editing ? "Recipient updated" : "Recipient added" });
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">{editing ? "Edit recipient" : "Add recipient"}</DialogTitle>
          <DialogDescription>
            Search a known church or nonprofit, or enter one manually. Allocations should total 100%.
          </DialogDescription>
        </DialogHeader>

        {!editing && (
          <div className="space-y-2">
            <Label htmlFor="r-search" className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Quick find
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="r-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Try 'Lifepoint', 'Compassion', 'IJM'…"
                className="pl-9"
              />
            </div>
            {matches.length > 0 && (
              <Card className="border-border/60 divide-y divide-border/60 max-h-56 overflow-y-auto">
                {matches.map((d) => (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => applyDirectoryEntry(d)}
                    className="w-full text-left p-3 hover:bg-muted/50 transition flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{d.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {d.city ? `${d.city}, ${d.state} · ` : ""}via {PLATFORM_BY_ID[d.platform].name}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{TYPE_LABEL[d.type]}</Badge>
                  </button>
                ))}
              </Card>
            )}
          </div>
        )}

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="r-name">Name</Label>
            <Input id="r-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Grace Community Church" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="r-type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as RecipientType)}>
                <SelectTrigger id="r-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="church">Church</SelectItem>
                  <SelectItem value="missions">Missions</SelectItem>
                  <SelectItem value="nonprofit">Nonprofit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-pct">Allocation %</Label>
              <Input id="r-pct" type="number" min={0} max={100} step={0.1} value={percent}
                onChange={(e) => setPercent(Number(e.target.value) || 0)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="r-platform">Giving platform</Label>
            <Select value={platform || "none"} onValueChange={(v) => setPlatform(v === "none" ? "" : (v as PlatformId))}>
              <SelectTrigger id="r-platform"><SelectValue placeholder="How is the gift sent?" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None / Not specified —</SelectItem>
                {(["Church", "Missions / Nonprofit", "Direct"] as const).map((cat) => (
                  <div key={cat}>
                    <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">{cat}</div>
                    {PLATFORMS.filter((p) => p.category === cat).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            {platform && (
              <p className="text-xs text-muted-foreground">{PLATFORM_BY_ID[platform as PlatformId].description}</p>
            )}
          </div>

          {platform && PLATFORM_BY_ID[platform as PlatformId].urlPattern && (
            <div className="space-y-2">
              <Label htmlFor="r-slug">Platform handle</Label>
              <Input
                id="r-slug"
                value={platformSlug}
                onChange={(e) => setPlatformSlug(e.target.value)}
                placeholder="e.g. lifepointchurchnc"
              />
              <p className="text-xs text-muted-foreground break-all">
                {PLATFORM_BY_ID[platform as PlatformId].urlPattern?.replace("{slug}", platformSlug || "your-handle")}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="r-url">Donate URL (optional override)</Label>
            <Input id="r-url" value={donateUrl} onChange={(e) => setDonateUrl(e.target.value)} placeholder="https://donate.overflow.co/lifepointchurchnc" />
          </div>

          {previewUrl && (
            <a href={previewUrl} target="_blank" rel="noreferrer"
               className="flex items-center justify-between gap-2 p-3 rounded-md border border-gold/40 bg-gold-soft/30 text-sm hover:bg-gold-soft/50 transition">
              <span className="truncate">Test donate link</span>
              <ExternalLink className="h-4 w-4 shrink-0" />
            </a>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="r-website">Website (optional)</Label>
              <Input id="r-website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-ein">EIN (optional)</Label>
              <Input id="r-ein" value={ein} onChange={(e) => setEin(e.target.value)} maxLength={20} placeholder="12-3456789" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Steward records your gifts for your year-end report. The actual transfer is completed on the recipient's giving platform — we link you straight there.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={busy}>{editing ? "Save changes" : "Add recipient"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Recipients;
