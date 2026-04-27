import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatPercent, monthLabel } from "@/lib/format";
import { Download, Printer } from "lucide-react";

type Summary = {
  id: string; month: string; total_revenue: number; total_expenses: number;
  net_profit: number; giving_amount: number; status: string;
};
type Recipient = { id: string; name: string; type: string; ein: string | null };
type Tx = { monthly_summary_id: string; recipient_id: string; amount: number; status: string };

const Report = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [businessName, setBusinessName] = useState("");
  const [scripture, setScripture] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      const [{ data: prof }, { data: cov }, { data: sums }, { data: recs }] = await Promise.all([
        supabase.from("profiles").select("business_name, full_name").eq("id", user.id).maybeSingle(),
        supabase.from("giving_covenants").select("scripture_anchor").eq("user_id", user.id).maybeSingle(),
        supabase.from("monthly_summaries").select("*").eq("user_id", user.id).gte("month", start).lte("month", end).order("month"),
        supabase.from("giving_recipients").select("id, name, type, ein").eq("user_id", user.id),
      ]);
      const summaryList = (sums as Summary[]) ?? [];
      setBusinessName(prof?.business_name || prof?.full_name || "");
      setScripture(cov?.scripture_anchor ?? null);
      setSummaries(summaryList);
      setRecipients((recs as Recipient[]) ?? []);

      if (summaryList.length > 0) {
        const ids = summaryList.map((s) => s.id);
        const { data: tx } = await supabase
          .from("giving_transactions")
          .select("monthly_summary_id, recipient_id, amount, status")
          .in("monthly_summary_id", ids);
        setTxs((tx as Tx[]) ?? []);
      } else {
        setTxs([]);
      }
      setLoading(false);
    })();
  }, [user, year]);

  const transferred = summaries.filter((s) => s.status === "transferred");
  const totals = useMemo(() => {
    return transferred.reduce(
      (a, s) => ({
        revenue: a.revenue + Number(s.total_revenue),
        expenses: a.expenses + Number(s.total_expenses),
        profit: a.profit + Number(s.net_profit),
        given: a.given + Number(s.giving_amount),
      }),
      { revenue: 0, expenses: 0, profit: 0, given: 0 }
    );
  }, [transferred]);
  const effectivePct = totals.profit > 0 ? (totals.given / totals.profit) * 100 : 0;

  const givenByRecipient = useMemo(() => {
    const summaryIds = new Set(transferred.map((s) => s.id));
    const map = new Map<string, number>();
    for (const t of txs) {
      if (t.status !== "completed" || !summaryIds.has(t.monthly_summary_id)) continue;
      map.set(t.recipient_id, (map.get(t.recipient_id) ?? 0) + Number(t.amount));
    }
    return recipients
      .map((r) => ({ ...r, total: map.get(r.id) ?? 0 }))
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [recipients, txs, transferred]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <AppShell>
      <div className="container py-10 max-w-4xl">
        {/* Toolbar — hidden when printing */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6 print:hidden">
          <div>
            <h1 className="font-serif text-4xl font-semibold tracking-tight">Year-end report</h1>
            <p className="text-muted-foreground mt-1">A printable, tax-ready record of your stewardship.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />Print
            </Button>
            <Button onClick={() => window.print()}>
              <Download className="h-4 w-4 mr-2" />Save as PDF
            </Button>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-[600px]" />
        ) : transferred.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <p className="scripture text-lg mb-2">No giving recorded for {year} yet.</p>
            <p className="text-muted-foreground text-sm">Once you approve monthly giving, it will appear here.</p>
          </Card>
        ) : (
          <Card className="p-10 md:p-14 shadow-elevated border-border/60 bg-card print:shadow-none print:border-0 print:p-0">
            {/* Letterhead */}
            <div className="flex items-start justify-between border-b border-border/60 pb-8 mb-10">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gold mb-2">Stewardship Report</p>
                <h2 className="font-serif text-4xl font-semibold">{businessName || "Your business"}</h2>
                <p className="text-muted-foreground mt-1">Tax year {year}</p>
              </div>
              <div className="text-right">
                <div className="h-12 w-12 rounded-lg bg-primary text-primary-foreground grid place-items-center ml-auto">
                  <span className="font-serif font-bold text-xl">S</span>
                </div>
                <p className="font-serif text-sm font-semibold mt-2">Steward</p>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <ReportStat label="Total revenue" value={formatCurrency(totals.revenue)} />
              <ReportStat label="Total expenses" value={formatCurrency(totals.expenses)} />
              <ReportStat label="Total profit" value={formatCurrency(totals.profit)} />
              <ReportStat label="Total given" value={formatCurrency(totals.given)} accent
                sub={`${formatPercent(effectivePct)} of profit`} />
            </div>

            {/* Recipients table */}
            <div className="mb-10">
              <h3 className="font-serif text-2xl font-semibold mb-4">Giving by recipient</h3>
              <div className="border border-border/60 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Recipient</th>
                      <th className="text-left px-4 py-3 font-medium">Type</th>
                      <th className="text-left px-4 py-3 font-medium">EIN</th>
                      <th className="text-right px-4 py-3 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {givenByRecipient.map((r) => (
                      <tr key={r.id} className="border-t border-border/60">
                        <td className="px-4 py-3 font-medium">{r.name}</td>
                        <td className="px-4 py-3 text-muted-foreground capitalize">{r.type}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.ein || "—"}</td>
                        <td className="px-4 py-3 text-right stat-number font-medium">{formatCurrency(r.total)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-foreground/20 bg-muted/30">
                      <td colSpan={3} className="px-4 py-3 font-medium">Total</td>
                      <td className="px-4 py-3 text-right stat-number font-semibold text-lg">{formatCurrency(totals.given)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Where available, EINs are provided to support tax-deductible contribution records. Consult your tax professional.
              </p>
            </div>

            {/* Monthly breakdown */}
            <div className="mb-10">
              <h3 className="font-serif text-2xl font-semibold mb-4">Month by month</h3>
              <div className="border border-border/60 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Month</th>
                      <th className="text-right px-4 py-3 font-medium">Profit</th>
                      <th className="text-right px-4 py-3 font-medium">Given</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transferred.map((s) => (
                      <tr key={s.id} className="border-t border-border/60">
                        <td className="px-4 py-3">{monthLabel(s.month)}</td>
                        <td className="px-4 py-3 text-right stat-number">{formatCurrency(s.net_profit)}</td>
                        <td className="px-4 py-3 text-right stat-number">{formatCurrency(s.giving_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Closing */}
            <div className="border-t border-border/60 pt-8 text-center">
              <p className="scripture text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
                {scripture
                  ? `"${scripture}"`
                  : "Thank you for stewarding well. May your firstfruits bear fruit a hundredfold."}
              </p>
              <p className="text-xs text-muted-foreground mt-6">
                Generated by Steward on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.
              </p>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
};

const ReportStat = ({
  label, value, sub, accent,
}: { label: string; value: string; sub?: string; accent?: boolean }) => (
  <div>
    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">{label}</p>
    <p className={`stat-number text-3xl font-semibold ${accent ? "text-gold" : ""}`}>{value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </div>
);

export default Report;
