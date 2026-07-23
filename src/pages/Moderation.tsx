import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/community";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert } from "lucide-react";

export default function Moderation() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await db.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!data);
    })();
  }, [user?.id]);

  const load = async () => {
    setLoading(true);
    const { data } = await db.from("community_reports")
      .select("id, reporter_id, target_type, target_id, reason, status, created_at")
      .in("status", ["pending", "reviewed"])
      .order("created_at", { ascending: false }).limit(100);
    // Fetch target previews
    const posts = (data ?? []).filter((r: any) => r.target_type === "post").map((r: any) => r.target_id);
    const comments = (data ?? []).filter((r: any) => r.target_type === "comment").map((r: any) => r.target_id);
    const messages = (data ?? []).filter((r: any) => r.target_type === "message").map((r: any) => r.target_id);
    const [postsData, commentsData, messagesData] = await Promise.all([
      posts.length ? db.from("posts").select("id, content, author_id, status").in("id", posts) : { data: [] },
      comments.length ? db.from("comments").select("id, content, author_id, status").in("id", comments) : { data: [] },
      messages.length ? db.from("messages").select("id, content, sender_id").in("id", messages) : { data: [] },
    ]);
    const pMap = new Map<string, any>((postsData.data ?? []).map((x: any) => [x.id, x]));
    const cMap = new Map<string, any>((commentsData.data ?? []).map((x: any) => [x.id, x]));
    const mMap = new Map<string, any>((messagesData.data ?? []).map((x: any) => [x.id, x]));
    setReports((data ?? []).map((r: any) => {
      let target: any = null;
      if (r.target_type === "post") target = pMap.get(r.target_id);
      else if (r.target_type === "comment") target = cMap.get(r.target_id);
      else if (r.target_type === "message") target = mMap.get(r.target_id);
      return { ...r, target };
    }));
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const act = async (report: any, action: "approve" | "remove" | "warn" | "suspend_community" | "ban") => {
    if (!user) return;
    const notes = window.prompt(`Optional notes for "${action}":`) ?? "";
    let err: any = null;
    if (action === "remove") {
      if (report.target_type === "post") ({ error: err } = await db.from("posts").update({ status: "removed" }).eq("id", report.target_id));
      else if (report.target_type === "comment") ({ error: err } = await db.from("comments").update({ status: "removed" }).eq("id", report.target_id));
      else if (report.target_type === "message") ({ error: err } = await db.from("messages").update({ status: "removed" }).eq("id", report.target_id));
    } else if (action === "approve" && report.target) {
      if (report.target_type === "post") ({ error: err } = await db.from("posts").update({ status: "visible" }).eq("id", report.target_id));
      else if (report.target_type === "comment") ({ error: err } = await db.from("comments").update({ status: "visible" }).eq("id", report.target_id));
    } else if (action === "suspend_community" || action === "ban") {
      const authorId = report.target?.author_id ?? report.target?.sender_id;
      if (authorId) {
        ({ error: err } = await db.from("profiles").update({
          community_suspended_at: new Date().toISOString(),
          ...(action === "ban" ? { financial_suspended_at: new Date().toISOString() } : {}),
        }).eq("id", authorId));
      }
    }
    if (err) return toast({ title: err.message, variant: "destructive" });
    await db.from("moderation_actions").insert({
      admin_id: user.id, target_type: report.target_type, target_id: report.target_id, action, notes,
    });
    await db.from("community_reports").update({ status: action === "approve" ? "dismissed" : "actioned" }).eq("id", report.id);
    toast({ title: "Action recorded" });
    load();
  };

  if (isAdmin === null) return <AppShell><div className="container py-10"><Loader2 className="h-5 w-5 animate-spin" /></div></AppShell>;
  if (!isAdmin) return (
    <AppShell><div className="container py-10 max-w-lg">
      <Card className="p-8 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <h1 className="text-xl font-semibold">Admin access required</h1>
        <p className="text-sm text-muted-foreground mt-1">Sign in with an admin account.</p>
      </Card>
    </div></AppShell>
  );

  return (
    <AppShell>
      <div className="container py-10 max-w-4xl">
        <h1 className="font-serif text-4xl font-semibold tracking-tight mb-6">Moderation queue</h1>
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p>
          : reports.length === 0 ? <Card className="p-10 text-center text-muted-foreground">Nothing pending. 🎉</Card>
          : reports.map((r) => (
            <Card key={r.id} className="p-5 mb-4 space-y-3 border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                  <Badge variant="outline">{r.target_type}</Badge>
                  <Badge>{r.status}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                </div>
              </div>
              <div className="text-sm">
                <div className="text-muted-foreground text-xs mb-1">Reason:</div>
                <div>{r.reason}</div>
              </div>
              {r.target && (
                <div className="text-sm bg-secondary/40 p-3 rounded">
                  <div className="text-muted-foreground text-xs mb-1">Content preview:</div>
                  <div className="whitespace-pre-wrap">{r.target.content}</div>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => act(r, "approve")}>Approve (restore)</Button>
                <Button size="sm" variant="destructive" onClick={() => act(r, "remove")}>Remove content</Button>
                <Button size="sm" variant="outline" onClick={() => act(r, "warn")}>Warn user</Button>
                <Button size="sm" variant="outline" onClick={() => act(r, "suspend_community")}>Suspend community</Button>
                <Button size="sm" variant="destructive" onClick={() => act(r, "ban")}>Ban (community + financial)</Button>
              </div>
            </Card>
          ))}
      </div>
    </AppShell>
  );
}
