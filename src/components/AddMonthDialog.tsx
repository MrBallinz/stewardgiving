import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { Loader2, Plus } from "lucide-react";

/** Quick-add modal so users can produce a real monthly_summary without bank linking. */
export function AddMonthDialog({ onCreated }: { onCreated?: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [revenue, setRevenue] = useState("");
  const [expenses, setExpenses] = useState("");

  const rev = Number(revenue) || 0;
  const exp = Number(expenses) || 0;
  const profit = Math.max(0, rev - exp);

  const submit = async () => {
    if (!user) return;
    if (!month || rev <= 0) {
      return toast({ title: "Add a month and revenue", variant: "destructive" });
    }
    setBusy(true);
    const { data: cov } = await supabase
      .from("giving_covenants")
      .select("percent_of_profit")
      .eq("user_id", user.id)
      .maybeSingle();
    const pct = Number(cov?.percent_of_profit ?? 10);
    const giving = Math.max(0, Math.round((profit * pct) / 100));

    const { data, error } = await supabase
      .from("monthly_summaries")
      .insert({
        user_id: user.id,
        month: `${month}-01`,
        total_revenue: rev,
        total_expenses: exp,
        net_profit: rev - exp,
        giving_percent: pct,
        giving_amount: giving,
        status: "pending",
        source: "manual",
        is_sample: false,
      })
      .select("id")
      .single();
    setBusy(false);
    if (error) {
      return toast({
        title: error.message.includes("unique") ? "That month already exists" : "Couldn't add month",
        description: error.message,
        variant: "destructive",
      });
    }
    toast({ title: "Month added", description: `${formatCurrency(giving)} giving calculated.` });
    setOpen(false);
    setRevenue(""); setExpenses("");
    onCreated?.();
    if (data?.id) navigate(`/review/${data.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Add this month
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Add a month</DialogTitle>
          <DialogDescription>
            Enter your real revenue and expenses. Steward computes profit and the giving amount your covenant calls for.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="am-month">Month</Label>
            <Input id="am-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="am-rev">Revenue</Label>
              <Input id="am-rev" inputMode="decimal" placeholder="0.00" value={revenue} onChange={(e) => setRevenue(e.target.value.replace(/[^\d.]/g, ""))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="am-exp">Expenses</Label>
              <Input id="am-exp" inputMode="decimal" placeholder="0.00" value={expenses} onChange={(e) => setExpenses(e.target.value.replace(/[^\d.]/g, ""))} />
            </div>
          </div>
          <div className="rounded-lg bg-muted/40 p-3 text-sm flex justify-between">
            <span className="text-muted-foreground">Profit</span>
            <span className="stat-number font-semibold">{formatCurrency(rev - exp)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add month
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
