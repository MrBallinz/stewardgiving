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
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
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
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";

type RecipientType = "church" | "missions" | "nonprofit" | "other";
type Recipient = {
  id: string;
  name: string;
  type: RecipientType;
  allocation_percent: number;
  ein: string | null;
};

const TYPE_LABEL: Record<RecipientType, string> = {
  church: "Church", missions: "Missions", nonprofit: "Nonprofit", other: "Other",
};

// Steward palette: navy + gold + warm muted tones for the pie.
const PIE_COLORS = ["hsl(217 51% 12%)", "hsl(41 47% 59%)", "hsl(217 30% 35%)", "hsl(41 30% 45%)", "hsl(217 20% 55%)", "hsl(38 25% 70%)"];

const Recipients = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Recipient[]>([]);
  const [editing, setEditing] = useState<Recipient | null>(null);
  const [open, setOpen] = useState(false);

  const total = useMemo(() => items.reduce((a, r) => a + Number(r.allocation_percent), 0), [items]);
  const balanced = Math.abs(total - 100) < 0.05;

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("giving_recipients")
      .select("id, name, type, allocation_percent, ein")
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

  const openAdd = () => { setEditing(null); setOpen(true); };
  const openEdit = (r: Recipient) => { setEditing(r); setOpen(true); };

  return (
    <AppShell>
      <div className="container py-10 max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-4xl font-semibold tracking-tight">Recipients</h1>
            <p className="text-muted-foreground mt-1">Where your giving goes, and how it's split.</p>
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
            <p className="text-muted-foreground mb-6 text-sm">Add a church, missions org, or nonprofit to begin.</p>
            <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add recipient</Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-[1fr,300px] gap-6">
            <Card className="shadow-card border-border/60 divide-y divide-border/60">
              {items.map((r, i) => (
                <div key={r.id} className="p-5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{r.name}</p>
                      <Badge variant="outline" className="text-xs font-normal">{TYPE_LABEL[r.type]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {r.ein ? `EIN ${r.ein}` : "No EIN on file"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="stat-number text-2xl font-semibold">{formatPercent(r.allocation_percent)}</p>
                  </div>
                  <div className="flex items-center gap-1">
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
              ))}
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
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setType(editing?.type ?? "church");
      setPercent(editing ? Number(editing.allocation_percent) : 0);
      setEin(editing?.ein ?? "");
    }
  }, [open, editing]);

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">{editing ? "Edit recipient" : "Add recipient"}</DialogTitle>
          <DialogDescription>
            Allocations across all your recipients should add up to 100%.
          </DialogDescription>
        </DialogHeader>
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
            <Label htmlFor="r-ein">EIN (optional)</Label>
            <Input id="r-ein" value={ein} onChange={(e) => setEin(e.target.value)} maxLength={20} placeholder="12-3456789" />
            <p className="text-xs text-muted-foreground">Used on your year-end stewardship report.</p>
          </div>
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
