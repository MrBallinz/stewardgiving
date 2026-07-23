import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { db, looksLikeScam } from "@/lib/community";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Flag, MessageCircle, Send, Shield, UserPlus, Ban, Loader2, Globe, Users,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

type Profile = {
  id: string; display_name: string | null; full_name: string | null;
  avatar_url: string | null; bio: string | null; industry: string | null;
  is_public: boolean;
};

const nameOf = (p?: Profile | null) =>
  (p?.display_name || p?.full_name || "Steward member").trim();

// -------------------------------------------------------------
// FEED
// -------------------------------------------------------------
function Feed() {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"public" | "connections">("connections");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await db
      .from("posts")
      .select("id, author_id, content, visibility, status, flag_count, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    const ids = Array.from(new Set((data ?? []).map((p: any) => p.author_id)));
    const { data: profs } = ids.length
      ? await db.from("profiles").select("id, display_name, full_name, avatar_url").in("id", ids)
      : { data: [] };
    const map = new Map<string, any>((profs ?? []).map((p: any) => [p.id, p]));
    setPosts((data ?? []).map((p: any) => ({ ...p, author: map.get(p.author_id) })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    const text = content.trim();
    if (!text || !user) return;
    setPosting(true);
    const { error } = await db.from("posts").insert({
      author_id: user.id, content: text, visibility,
    });
    setPosting(false);
    if (error) return toast({ title: "Couldn't post", description: error.message, variant: "destructive" });
    setContent("");
    if (looksLikeScam(text)) {
      toast({
        title: "Post submitted for review",
        description: "Our filter flagged this content for a quick safety check. It'll appear once approved.",
      });
    } else {
      toast({ title: "Posted" });
    }
    load();
  };

  const report = async (postId: string) => {
    if (!user) return;
    const reason = window.prompt("Briefly, what's wrong with this post?");
    if (!reason) return;
    const { error } = await db.from("community_reports").insert({
      reporter_id: user.id, target_type: "post", target_id: postId, reason,
    });
    if (error) return toast({ title: "Couldn't report", description: error.message, variant: "destructive" });
    toast({ title: "Report received", description: "Thanks — our team will review it." });
    load();
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-3 border-border/60">
        <Textarea
          placeholder="Share a testimony or word of encouragement. Never share dollar amounts or bank details."
          value={content} onChange={(e) => setContent(e.target.value)}
          maxLength={5000} rows={3}
        />
        <div className="flex items-center justify-between gap-3">
          <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="connections"><span className="inline-flex items-center gap-2"><Users className="h-4 w-4" />Connections only</span></SelectItem>
              <SelectItem value="public"><span className="inline-flex items-center gap-2"><Globe className="h-4 w-4" />Public</span></SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={submit} disabled={posting || !content.trim()}>
            {posting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Post
          </Button>
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading feed…</p>
      ) : posts.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          Your feed is quiet. Connect with others or write the first post.
        </Card>
      ) : posts.map((p) => (
        <Card key={p.id} className="p-5 space-y-3 border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{nameOf(p.author)}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(p.created_at).toLocaleString()} · {p.visibility === "public" ? "Public" : "Connections"}
                {p.status === "flagged" && <Badge variant="outline" className="ml-2">Under review</Badge>}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => report(p.id)} className="text-muted-foreground">
              <Flag className="h-4 w-4 mr-1" /> Report
            </Button>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{p.content}</p>
        </Card>
      ))}
    </div>
  );
}

// -------------------------------------------------------------
// CONNECTIONS
// -------------------------------------------------------------
function Connections() {
  const { user } = useAuth();
  const [pending, setPending] = useState<any[]>([]);
  const [accepted, setAccepted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await db
      .from("connections")
      .select("id, requester_id, addressee_id, status, created_at")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    const ids = Array.from(new Set((data ?? []).flatMap((c: any) => [c.requester_id, c.addressee_id])));
    const { data: profs } = ids.length
      ? await db.from("profiles").select("id, display_name, full_name, avatar_url").in("id", ids)
      : { data: [] };
    const map = new Map<string, any>((profs ?? []).map((p: any) => [p.id, p]));
    const withProfiles = (data ?? []).map((c: any) => {
      const otherId = c.requester_id === user.id ? c.addressee_id : c.requester_id;
      return { ...c, other: map.get(otherId), isIncoming: c.addressee_id === user.id };
    });
    setPending(withProfiles.filter((c) => c.status === "pending"));
    setAccepted(withProfiles.filter((c) => c.status === "accepted"));
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const respond = async (id: string, accept: boolean) => {
    const { error } = await db.from("connections").update({
      status: accept ? "accepted" : "declined",
    }).eq("id", id);
    if (error) return toast({ title: "Couldn't update", description: error.message, variant: "destructive" });
    load();
  };

  const startMessage = async (otherId: string) => {
    if (!user) return;
    // Find or create a 1:1 conversation
    const { data: mine } = await db
      .from("conversation_participants").select("conversation_id").eq("user_id", user.id);
    const myConvIds = (mine ?? []).map((c: any) => c.conversation_id);
    let convId: string | null = null;
    if (myConvIds.length) {
      const { data: shared } = await db
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", otherId)
        .in("conversation_id", myConvIds);
      convId = shared?.[0]?.conversation_id ?? null;
    }
    if (!convId) {
      const { data: newConv, error: cErr } = await db
        .from("conversations").insert({ created_by: user.id }).select("id").single();
      if (cErr) return toast({ title: cErr.message, variant: "destructive" });
      convId = newConv.id;
      const { error: pErr } = await db.from("conversation_participants").insert([
        { conversation_id: convId, user_id: user.id },
        { conversation_id: convId, user_id: otherId },
      ]);
      if (pErr) return toast({ title: pErr.message, variant: "destructive" });
    }
    window.location.assign(`/community?tab=messages&conv=${convId}`);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <Card className="p-5 border-border/60">
        <h3 className="font-medium mb-3">Requests</h3>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending requests.</p>
        ) : pending.map((c) => (
          <div key={c.id} className="flex items-center justify-between py-2 border-t first:border-0">
            <div>
              <div className="text-sm font-medium">{nameOf(c.other)}</div>
              <div className="text-xs text-muted-foreground">
                {c.isIncoming ? "Wants to connect" : "You requested"}
              </div>
            </div>
            {c.isIncoming ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => respond(c.id, true)}>Accept</Button>
                <Button size="sm" variant="outline" onClick={() => respond(c.id, false)}>Decline</Button>
              </div>
            ) : (
              <Badge variant="outline">Pending</Badge>
            )}
          </div>
        ))}
      </Card>

      <Card className="p-5 border-border/60">
        <h3 className="font-medium mb-3">Your connections</h3>
        {accepted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No connections yet. Try Discover.</p>
        ) : accepted.map((c) => (
          <div key={c.id} className="flex items-center justify-between py-2 border-t first:border-0">
            <div className="text-sm font-medium">{nameOf(c.other)}</div>
            <Button size="sm" variant="outline" onClick={() => startMessage(c.other.id)}>
              <MessageCircle className="h-4 w-4 mr-1" /> Message
            </Button>
          </div>
        ))}
      </Card>
    </div>
  );
}

// -------------------------------------------------------------
// DISCOVER
// -------------------------------------------------------------
function Discover() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!user) return;
    setLoading(true);
    let query = db.from("profiles").select("id, display_name, full_name, avatar_url, bio, industry, is_public")
      .eq("is_public", true).neq("id", user.id).limit(30);
    if (q.trim()) {
      const s = q.trim().replace(/[,()]/g, " ");
      query = query.or(`display_name.ilike.%${s}%,full_name.ilike.%${s}%,industry.ilike.%${s}%`);
    }
    const { data } = await query;
    setResults(data ?? []);
    setLoading(false);
  };

  useEffect(() => { search(); }, [user?.id]);

  const connect = async (otherId: string) => {
    if (!user) return;
    const { error } = await db.from("connections").insert({
      requester_id: user.id, addressee_id: otherId, status: "pending",
    });
    if (error) return toast({ title: "Couldn't send request", description: error.message, variant: "destructive" });
    toast({ title: "Request sent" });
  };

  const block = async (otherId: string) => {
    if (!user) return;
    const { error } = await db.from("blocks").insert({ blocker_id: user.id, blocked_id: otherId });
    if (error) return toast({ title: error.message, variant: "destructive" });
    toast({ title: "User blocked" });
    setResults((r) => r.filter((p) => p.id !== otherId));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Search public profiles" value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()} />
        <Button onClick={search}>Search</Button>
      </div>
      {loading ? <p className="text-sm text-muted-foreground">Searching…</p>
        : results.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-sm">
            No public profiles found. Ask friends to enable a public profile in Settings.
          </Card>
        ) : results.map((p) => (
          <Card key={p.id} className="p-4 flex items-center justify-between border-border/60">
            <div>
              <div className="font-medium">{nameOf(p)}</div>
              {p.industry && <div className="text-xs text-muted-foreground">{p.industry}</div>}
              {p.bio && <p className="text-sm mt-1 text-muted-foreground line-clamp-2">{p.bio}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" onClick={() => connect(p.id)}>
                <UserPlus className="h-4 w-4 mr-1" /> Connect
              </Button>
              <Button size="sm" variant="ghost" onClick={() => block(p.id)}>
                <Ban className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
    </div>
  );
}

// -------------------------------------------------------------
// MESSAGES
// -------------------------------------------------------------
function Messages({ initialConvId }: { initialConvId?: string | null }) {
  const { user } = useAuth();
  const [convs, setConvs] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(initialConvId ?? null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [dismissed, setDismissed] = useState(false);

  const loadConvs = async () => {
    if (!user) return;
    const { data: parts } = await db.from("conversation_participants")
      .select("conversation_id").eq("user_id", user.id);
    const ids = (parts ?? []).map((p: any) => p.conversation_id);
    if (!ids.length) { setConvs([]); return; }
    const { data: cs } = await db.from("conversations")
      .select("id, last_message_at, created_at").in("id", ids).order("last_message_at", { ascending: false });
    // Get "other" participant
    const { data: allParts } = await db.from("conversation_participants")
      .select("conversation_id, user_id").in("conversation_id", ids);
    const others = new Map<string, string>();
    (allParts ?? []).forEach((p: any) => {
      if (p.user_id !== user.id) others.set(p.conversation_id, p.user_id);
    });
    const otherIds = Array.from(new Set(Array.from(others.values())));
    const { data: profs } = otherIds.length
      ? await db.from("profiles").select("id, display_name, full_name").in("id", otherIds)
      : { data: [] };
    const map = new Map<string, any>((profs ?? []).map((p: any) => [p.id, p]));
    setConvs((cs ?? []).map((c: any) => ({ ...c, other: map.get(others.get(c.id)!) })));
    if (!active && cs && cs[0]) setActive(cs[0].id);
  };

  const loadMessages = async () => {
    if (!active) return;
    const { data } = await db.from("messages")
      .select("id, sender_id, content, created_at, flagged")
      .eq("conversation_id", active).order("created_at").limit(200);
    setMessages(data ?? []);
  };

  useEffect(() => { loadConvs(); }, [user?.id]);
  useEffect(() => { loadMessages(); }, [active]);

  const send = async () => {
    if (!user || !active || !text.trim()) return;
    const body = text.trim();
    setText("");
    const { error } = await db.from("messages").insert({
      conversation_id: active, sender_id: user.id, content: body,
    });
    if (error) return toast({ title: error.message, variant: "destructive" });
    if (looksLikeScam(body)) {
      toast({ title: "Message sent — flagged for review",
        description: "Our safety filter caught keywords. A moderator may review this conversation." });
    }
    loadMessages(); loadConvs();
  };

  const report = async () => {
    if (!user || !active) return;
    const reason = window.prompt("What's wrong with this conversation?");
    if (!reason) return;
    await db.from("community_reports").insert({
      reporter_id: user.id, target_type: "message", target_id: active, reason,
    });
    toast({ title: "Reported" });
  };

  if (!convs.length) return (
    <Card className="p-8 text-center text-sm text-muted-foreground">
      No conversations yet. Accept a connection and message from Connections.
    </Card>
  );

  return (
    <div className="grid md:grid-cols-[220px_1fr] gap-4 min-h-[500px]">
      <Card className="p-2 border-border/60">
        {convs.map((c) => (
          <button key={c.id} onClick={() => setActive(c.id)}
            className={`w-full text-left px-3 py-2 rounded text-sm ${active === c.id ? "bg-secondary" : "hover:bg-secondary/60"}`}>
            {nameOf(c.other)}
          </button>
        ))}
      </Card>
      <Card className="p-4 border-border/60 flex flex-col">
        {!dismissed && (
          <div className="mb-3 flex items-start gap-2 rounded border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
            <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong>Safety reminder:</strong> Steward will never ask you to send money, gift cards, or account access through this app. Report any request like this immediately.
            </div>
            <button onClick={() => setDismissed(true)} className="text-muted-foreground text-xs">Dismiss</button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto space-y-2 mb-3 max-h-[400px]">
          {messages.map((m) => (
            <div key={m.id} className={`max-w-[80%] p-2 rounded text-sm ${
              m.sender_id === user?.id ? "bg-primary text-primary-foreground ml-auto" : "bg-secondary"
            }`}>
              {m.content}
              {m.flagged && <div className="text-[10px] opacity-75 mt-1">⚠ flagged for review</div>}
            </div>
          ))}
        </div>
        <div className="flex gap-2 items-end">
          <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" />
          <div className="flex flex-col gap-1">
            <Button size="sm" onClick={send} disabled={!text.trim()}><Send className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={report}><Flag className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// -------------------------------------------------------------
// PAGE
// -------------------------------------------------------------
export default function Community() {
  const [sp, setSp] = useSearchParams();
  const tab = sp.get("tab") ?? "feed";
  const conv = sp.get("conv");
  return (
    <AppShell>
      <div className="container py-10 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-4xl font-semibold tracking-tight">Community</h1>
            <p className="text-muted-foreground mt-1">Encourage one another. No dollar amounts, no bank details — testimonies only.</p>
          </div>
          <Link to="/settings#privacy" className="text-sm text-muted-foreground underline">Privacy settings</Link>
        </div>
        <Tabs value={tab} onValueChange={(v) => setSp({ tab: v })}>
          <TabsList>
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>
          <TabsContent value="feed" className="mt-6"><Feed /></TabsContent>
          <TabsContent value="connections" className="mt-6"><Connections /></TabsContent>
          <TabsContent value="discover" className="mt-6"><Discover /></TabsContent>
          <TabsContent value="messages" className="mt-6"><Messages initialConvId={conv} /></TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
