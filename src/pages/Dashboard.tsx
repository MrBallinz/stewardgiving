import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, CheckCircle2, Clock, Sparkles, Loader2, Trash2 } from "lucide-react";
import { formatCurrency, formatPercent, monthLabel } from "@/lib/format";
import { toast } from "@/hooks/use-toast";
import { seedSampleData, clearSampleData } from "@/lib/seedSampleData";

type Summary = {
  id: string;
  month: string;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  giving_percent: number;
  giving_amount: number;
  status: "pending" | "transferred" | "skipped" | "reviewed" | "completed";
  is_sample?: boolean;
};

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [businessName, setBusinessName] = useState<string>("");
  const [scripture, setScripture] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [{ data: prof }, { data: cov }, { data: sums }] = await Promise.all([
        supabase.from("profiles").select("business_name, full_name, onboarded").eq("id", user.id).maybeSingle(),
        supabase.from("giving_covenants").select("scripture_anchor").eq("user_id", user.id).maybeSingle(),
        supabase.from("monthly_summaries").select("*").eq("user_id", user.id).order("month", { ascending: false }),
      ]);
      if (prof && !prof.onboarded) {
        navigate("/onboarding", { replace: true });
        return;
      }
      setBusinessName(prof?.business_name || prof?.full_name || "");
      setScripture(cov?.scripture_anchor ?? null);
      setSummaries((sums as Summary[]) ?? []);
      setLoading(false);
    })();
  }, [user, navigate]);

  const realSummaries = summaries.filter((s) => !s.is_sample);
  const sampleSummaries = summaries.filter((s) => s.is_sample);
  const showingSample = realSummaries.length === 0 && sampleSummaries.length > 0;
  const visible = showingSample ? sampleSummaries : realSummaries;

  const current = visible.find((s) => s.status === "pending") ?? visible[0];
  const ytdBase = visible.filter((s) => s.status === "transferred" || s.status === "completed");
  const ytd = ytdBase.reduce(
    (acc, s) => {
      acc.revenue += Number(s.total_revenue);
      acc.profit += Number(s.net_profit);
      acc.given += Number(s.giving_amount);
      return acc;
    },
    { revenue: 0, profit: 0, given: 0 }
  );
  const ytdPercent = ytd.profit > 0 ? (ytd.given / ytd.profit) * 100 : 0;

  const approveCurrent = async () => {
    if (!current || !user) return;
    setApproving(true);
    // Allocate by recipient %
    const { data: recipients } = await supabase
      .from("giving_recipients")
      .select("id, allocation_percent")
      .eq("user_id", user.id);
    const giving = Number(current.giving_amount);
    if (recipients && recipients.length > 0 && giving > 0) {
      await supabase.from("giving_transactions").insert(
        recipients.map((r) => ({
          monthly_summary_id: current.id,
          recipient_id: r.id,
          amount: Math.round((giving * Number(r.allocation_percent)) / 100),
          transferred_at: new Date().toISOString(),
          status: "completed" as const,
        }))
      );
    }
    const { error } = await supabase
      .from("monthly_summaries")
      .update({ status: "transferred" })
      .eq("id", current.id);
    setApproving(false);
    if (error) {
      toast({ title: "Couldn't approve", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Giving approved", description: `${formatCurrency(giving)} marked as transferred.` });
    setSummaries((prev) => prev.map((s) => (s.id === current.id ? { ...s, status: "transferred" } : s)));
  };

  return (
    <AppShell>
      <div className="container py-10 max-w-6xl">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-semibold tracking-tight">
            {businessName ? `Welcome back, ${businessName.split(" ")[0]}.` : "Welcome back."}
          </h1>
          <p className="text-muted-foreground mt-1">Here's how you're stewarding this month.</p>
        </div>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <div className="grid md:grid-cols-3 gap-4">
              <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* This month */}
            {current && (
              <Card className="p-8 md:p-10 shadow-elevated border-border/60 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-hero opacity-60 pointer-events-none" />
                <div className="relative flex flex-wrap items-start justify-between gap-4 mb-8">
                  <div>
                    <p className="text-sm font-medium text-gold uppercase tracking-wider mb-1">This month at a glance</p>
                    <h2 className="font-serif text-2xl font-semibold">{monthLabel(current.month)}</h2>
                  </div>
                  <StatusBadge status={current.status} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  <Stat label="Estimated revenue" value={formatCurrency(current.total_revenue)} muted />
                  <Stat label="Estimated expenses" value={formatCurrency(current.total_expenses)} muted />
                  <Stat label="Estimated profit" value={formatCurrency(current.net_profit)} />
                  <Stat
                    label={`Your giving (${formatPercent(current.giving_percent)} of profit)`}
                    value={formatCurrency(current.giving_amount)}
                    accent
                  />
                </div>

                {current.status === "pending" && (
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-border/60">
                    <p className="text-sm text-muted-foreground">
                      Approving will mark this giving as transferred and allocate to your recipients.
                    </p>
                    <Button onClick={approveCurrent} disabled={approving} size="lg">
                      Review and approve
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {/* YTD */}
            <div>
              <h3 className="font-serif text-2xl font-semibold mb-4">Year to date</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="p-6 shadow-card border-border/60">
                  <p className="text-sm text-muted-foreground mb-2">Total revenue</p>
                  <p className="stat-number text-4xl font-semibold">{formatCurrency(ytd.revenue)}</p>
                </Card>
                <Card className="p-6 shadow-card border-border/60">
                  <p className="text-sm text-muted-foreground mb-2">Total profit</p>
                  <p className="stat-number text-4xl font-semibold">{formatCurrency(ytd.profit)}</p>
                </Card>
                <Card className="p-6 shadow-card border-gold/40 bg-gold-soft/40">
                  <p className="text-sm text-muted-foreground mb-2">Total given</p>
                  <p className="stat-number text-4xl font-semibold">{formatCurrency(ytd.given)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatPercent(ytdPercent)} of profit
                  </p>
                </Card>
              </div>
            </div>

            {/* Recent activity */}
            <div>
              <h3 className="font-serif text-2xl font-semibold mb-4">Recent activity</h3>
              <Card className="shadow-card border-border/60 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Given</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaries.slice(0, 5).map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{monthLabel(s.month)}</TableCell>
                        <TableCell className="text-right stat-number">{formatCurrency(s.net_profit)}</TableCell>
                        <TableCell className="text-right stat-number">{formatCurrency(s.giving_amount)}</TableCell>
                        <TableCell><StatusBadge status={s.status} compact /></TableCell>
                      </TableRow>
                    ))}
                    {summaries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                          No giving yet — your first month will appear here.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {scripture && (
              <Card className="p-8 bg-card border-border/60 shadow-card text-center">
                <p className="scripture text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
                  "{scripture}"
                </p>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
};

const Stat = ({
  label,
  value,
  muted,
  accent,
}: {
  label: string;
  value: string;
  muted?: boolean;
  accent?: boolean;
}) => (
  <div>
    <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">{label}</p>
    <p
      className={`stat-number text-3xl md:text-4xl font-semibold ${
        accent ? "text-gold" : muted ? "text-foreground/80" : "text-foreground"
      }`}
    >
      {value}
    </p>
  </div>
);

const StatusBadge = ({
  status,
  compact,
}: {
  status: "pending" | "transferred" | "skipped";
  compact?: boolean;
}) => {
  if (status === "transferred") {
    return (
      <Badge variant="outline" className="border-success/40 bg-success/10 text-success gap-1.5">
        <CheckCircle2 className="h-3 w-3" />
        {compact ? "Transferred" : "Transferred"}
      </Badge>
    );
  }
  if (status === "skipped") {
    return <Badge variant="outline" className="text-muted-foreground">Skipped</Badge>;
  }
  return (
    <Badge variant="outline" className="border-gold/50 bg-gold-soft text-foreground gap-1.5">
      <Clock className="h-3 w-3" />
      Pending review
    </Badge>
  );
};

export default Dashboard;
