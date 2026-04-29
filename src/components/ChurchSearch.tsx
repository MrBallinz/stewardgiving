import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, MapPin, ShieldCheck, ShieldQuestion, AlertTriangle, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { platformBadgeText, type PlatformId } from "@/lib/giving-platforms";
import { findPossibleDuplicates, type DuplicateMatch } from "@/lib/duplicate-check";

export type ChurchRow = {
  id: string;
  legal_name: string;
  dba_name: string | null;
  city: string | null;
  state: string | null;
  denomination: string | null;
  website: string | null;
  giving_platform: string | null;
  giving_url: string | null;
  verification_status: string;
  ein: string | null;
};

type Props = {
  /** Called when the user picks an existing church from the repository. */
  onSelect: (c: ChurchRow) => void;
  /** Called after a new community-submitted church is inserted. */
  onSubmitted?: (c: ChurchRow) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

const VerificationBadge = ({ status }: { status: string }) => {
  if (status === "verified")
    return <Badge variant="outline" className="border-success/40 text-success bg-success/5 text-[10px] gap-1">
      <ShieldCheck className="h-3 w-3" /> Verified
    </Badge>;
  if (status === "community_submitted")
    return <Badge variant="outline" className="border-gold/50 text-foreground bg-gold-soft/40 text-[10px] gap-1">
      <ShieldQuestion className="h-3 w-3" /> Community submitted
    </Badge>;
  if (status === "needs_review")
    return <Badge variant="outline" className="border-destructive/40 text-destructive bg-destructive/5 text-[10px] gap-1">
      <AlertTriangle className="h-3 w-3" /> Needs review
    </Badge>;
  return <Badge variant="outline" className="text-[10px]">Unverified</Badge>;
};

export function ChurchSearch({ onSelect, onSubmitted, placeholder, autoFocus }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChurchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [submitOpen, setSubmitOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      const q = query.trim();
      const like = `%${q}%`;
      const { data, error } = await supabase
        .from("churches")
        .select("id,legal_name,dba_name,city,state,denomination,website,giving_platform,giving_url,verification_status,ein")
        .or(
          [
            `legal_name.ilike.${like}`,
            `dba_name.ilike.${like}`,
            `city.ilike.${like}`,
            `state.ilike.${like}`,
          ].join(",")
        )
        .limit(10);
      if (!error) setResults((data ?? []) as ChurchRow[]);
      setLoading(false);
    }, 300);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [query]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    if (e.key === "Enter")     { e.preventDefault(); onSelect(results[highlight]); setQuery(""); setResults([]); }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setHighlight(0); }}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? "Search by church name and city"}
          className="pl-9 h-11"
        />
        {loading && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {query.trim() && (
        <Card className="border-border/60 divide-y divide-border/60 max-h-80 overflow-y-auto">
          {results.length === 0 && !loading && (
            <div className="p-4 text-sm text-muted-foreground">
              No results for <span className="font-medium text-foreground">{query}</span>.
            </div>
          )}
          {results.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onMouseEnter={() => setHighlight(i)}
              onClick={() => { onSelect(r); setQuery(""); setResults([]); }}
              className={`w-full text-left p-3 transition flex items-start justify-between gap-3 ${i === highlight ? "bg-muted/60" : "hover:bg-muted/40"}`}
            >
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{r.dba_name ?? r.legal_name}</p>
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {[r.city, r.state].filter(Boolean).join(", ") || "—"}
                  {r.denomination ? ` · ${r.denomination}` : ""}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                  {platformBadgeText(r.giving_platform)}
                </Badge>
                <VerificationBadge status={r.verification_status} />
              </div>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSubmitOpen(true)}
            className="w-full text-left p-3 text-sm text-primary hover:bg-muted/40 flex items-center gap-2 border-t border-border/60"
          >
            <Plus className="h-4 w-4" /> Can't find your church? Add it
          </button>
        </Card>
      )}

      <SubmitChurchDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        defaultName={query}
        onSubmitted={(c) => { onSubmitted?.(c); onSelect(c); }}
      />
    </div>
  );
}

// ---------- "Can't find your church?" dialog ----------

function SubmitChurchDialog(props: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  defaultName?: string;
  onSubmitted: (c: ChurchRow) => void;
}) {
  const { open, onOpenChange, defaultName, onSubmitted } = props;
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [website, setWebsite] = useState("");
  const [givingUrl, setGivingUrl] = useState("");
  const [givingPlatform, setGivingPlatform] = useState<PlatformId | "">("");
  const [ein, setEin] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [confirmedDuplicate, setConfirmedDuplicate] = useState(false);

  useEffect(() => {
    if (open) {
      setName(defaultName ?? ""); setCity(""); setState(""); setWebsite("");
      setGivingUrl(""); setGivingPlatform(""); setEin(""); setNotes("");
      setDuplicates([]); setConfirmedDuplicate(false);
    }
  }, [open, defaultName]);

  const submit = async () => {
    if (!user) return;
    if (!name.trim() || !city.trim() || !state.trim()) {
      return toast({ title: "Name, city, and state are required", variant: "destructive" });
    }

    setBusy(true);
    // Duplicate detection runs first; user must acknowledge before insert.
    if (!confirmedDuplicate) {
      const dups = await findPossibleDuplicates({
        legal_name: name, city, state, website: website || null, giving_url: givingUrl || null,
      });
      if (dups.length > 0) {
        setDuplicates(dups);
        setBusy(false);
        return;
      }
    }

    const insert = {
      legal_name: name.trim(),
      city: city.trim(),
      state: state.trim().toUpperCase().slice(0, 2),
      website: website.trim() || null,
      giving_url: givingUrl.trim() || null,
      giving_platform: (givingPlatform || null) as PlatformId | null,
      ein: ein.trim() || null,
      submitted_by_user_id: user.id,
      source_type: "user_submitted" as const,
      enrichment_status: "user_submitted" as const,
      verification_status: "community_submitted" as const,
    };
    const { data, error } = await supabase
      .from("churches")
      .insert(insert as any)
      .select("id,legal_name,dba_name,city,state,denomination,website,giving_platform,giving_url,verification_status,ein")
      .single();
    setBusy(false);
    if (error) return toast({ title: "Couldn't submit", description: error.message, variant: "destructive" });
    toast({ title: "Submitted", description: "Thanks — your church is now searchable for everyone." });
    onOpenChange(false);
    onSubmitted(data as ChurchRow);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Can't find your church?</DialogTitle>
          <DialogDescription>
            Add it to the public directory. Other Steward users will be able to find it too.
          </DialogDescription>
        </DialogHeader>

        {duplicates.length > 0 && !confirmedDuplicate && (
          <Card className="p-4 border-gold/50 bg-gold-soft/40 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Possible match{duplicates.length > 1 ? "es" : ""} found</p>
                <p className="text-muted-foreground">Pick one of these or confirm yours is different.</p>
              </div>
            </div>
            <div className="space-y-2">
              {duplicates.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onSubmitted({ ...d, dba_name: null, denomination: null, ein: null, giving_platform: null, verification_status: "community_submitted" } as ChurchRow)}
                  className="w-full text-left p-2 rounded-md bg-card hover:bg-muted/60 border border-border/60 text-sm"
                >
                  <p className="font-medium">{d.legal_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[d.city, d.state].filter(Boolean).join(", ")} · matched on {d.reason.replace("_", " ")}
                  </p>
                </button>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmedDuplicate(true)}>
              None of these — submit mine
            </Button>
          </Card>
        )}

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cs-name">Church / organization name *</Label>
            <Input id="cs-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={150} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="cs-city">City *</Label>
              <Input id="cs-city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cs-state">State *</Label>
              <Input id="cs-state" value={state} onChange={(e) => setState(e.target.value.toUpperCase())} maxLength={2} placeholder="CA" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cs-web">Website</Label>
            <Input id="cs-web" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" inputMode="url" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cs-give">Online giving URL</Label>
            <Input id="cs-give" value={givingUrl} onChange={(e) => setGivingUrl(e.target.value)} placeholder="https://" inputMode="url" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cs-platform">Giving platform (if known)</Label>
              <Select value={givingPlatform || "none"} onValueChange={(v) => setGivingPlatform(v === "none" ? "" : (v as PlatformId))}>
                <SelectTrigger id="cs-platform"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Not sure —</SelectItem>
                  <SelectItem value="tithely">Tithe.ly</SelectItem>
                  <SelectItem value="pushpay">Pushpay</SelectItem>
                  <SelectItem value="givelify">Givelify</SelectItem>
                  <SelectItem value="anedot">Anedot</SelectItem>
                  <SelectItem value="subsplash">Subsplash</SelectItem>
                  <SelectItem value="vanco">Vanco</SelectItem>
                  <SelectItem value="planning_center">Planning Center</SelectItem>
                  <SelectItem value="overflow">Overflow</SelectItem>
                  <SelectItem value="stripe_direct">Direct (Stripe)</SelectItem>
                  <SelectItem value="every_org">every.org</SelectItem>
                  <SelectItem value="unknown">Other / not sure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cs-ein">EIN (optional)</Label>
              <Input id="cs-ein" value={ein} onChange={(e) => setEin(e.target.value)} placeholder="XX-XXXXXXX" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cs-notes">Notes (optional)</Label>
            <Textarea id="cs-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {confirmedDuplicate ? "Submit anyway" : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
