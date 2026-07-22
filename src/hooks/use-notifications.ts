import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type Notification = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  action_url: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  dismissed_at: string | null;
  created_at: string;
};

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .is("dismissed_at", null)
      .order("created_at", { ascending: false })
      .limit(20);
    setItems((data ?? []) as Notification[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
    if (!user) return;
    // Realtime: refresh on any insert/update/delete for this user.
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  const dismiss = async (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    await supabase
      .from("notifications")
      .update({ dismissed_at: new Date().toISOString() })
      .eq("id", id);
  };

  const markRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .is("read_at", null);
  };

  return { items, loading, dismiss, markRead, reload: load };
}
