
-- =========================================================
-- 1. PROFILES EXTENSIONS
-- =========================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS community_suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS financial_suspended_at timestamptz;

-- Allow signed-in users to view profiles that opted into public discovery.
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;
CREATE POLICY "Public profiles are viewable" ON public.profiles
  FOR SELECT TO authenticated
  USING (is_public = true OR auth.uid() = id);

-- =========================================================
-- 2. HELPER: admin check (reuse private.has_role if present)
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, private
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role = 'admin');
$$;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

-- =========================================================
-- 3. BLOCKS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own blocks" ON public.blocks
  FOR ALL TO authenticated
  USING (auth.uid() = blocker_id) WITH CHECK (auth.uid() = blocker_id);

CREATE OR REPLACE FUNCTION public.is_blocked(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = _a AND blocked_id = _b)
       OR (blocker_id = _b AND blocked_id = _a)
  );
$$;
REVOKE ALL ON FUNCTION public.is_blocked(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_blocked(uuid,uuid) TO authenticated, service_role;

-- =========================================================
-- 4. CONNECTIONS
-- =========================================================
CREATE TYPE public.connection_status AS ENUM ('pending','accepted','declined');

CREATE TABLE IF NOT EXISTS public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.connection_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);
CREATE INDEX IF NOT EXISTS connections_addressee_idx ON public.connections(addressee_id, status);
CREATE INDEX IF NOT EXISTS connections_requester_idx ON public.connections(requester_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connections TO authenticated;
GRANT ALL ON public.connections TO service_role;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "See own connection rows" ON public.connections
  FOR SELECT TO authenticated
  USING (auth.uid() IN (requester_id, addressee_id));
CREATE POLICY "Send connection request" ON public.connections
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = requester_id
    AND status = 'pending'
    AND NOT public.is_blocked(requester_id, addressee_id)
  );
CREATE POLICY "Respond to own request" ON public.connections
  FOR UPDATE TO authenticated
  USING (auth.uid() = addressee_id OR auth.uid() = requester_id)
  WITH CHECK (auth.uid() = addressee_id OR auth.uid() = requester_id);
CREATE POLICY "Delete own connection" ON public.connections
  FOR DELETE TO authenticated
  USING (auth.uid() IN (requester_id, addressee_id));

CREATE TRIGGER connections_updated_at BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.are_connected(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connections
    WHERE status = 'accepted'
      AND ((requester_id = _a AND addressee_id = _b)
        OR (requester_id = _b AND addressee_id = _a))
  );
$$;
REVOKE ALL ON FUNCTION public.are_connected(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.are_connected(uuid,uuid) TO authenticated, service_role;

-- =========================================================
-- 5. SCAM KEYWORD FLAGGING
-- =========================================================
CREATE OR REPLACE FUNCTION public.contains_scam_pattern(_text text)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE t text := lower(coalesce(_text,''));
BEGIN
  IF t ~ '(send me|wire (transfer|me)|western union|money ?gram|gift ?card|cash ?app|\$cashtag|venmo|zelle|paypal\.me|bitcoin|crypto|btc|eth|usdt|investment opportunity|guaranteed return|double your|forex|binary option|dm me|whatsapp)'
     OR t ~ '(\+?\d[\s\-\.]?){10,}'
  THEN RETURN true;
  END IF;
  RETURN false;
END $$;

-- =========================================================
-- 6. POSTS
-- =========================================================
CREATE TYPE public.post_visibility AS ENUM ('public','connections');
CREATE TYPE public.moderation_status AS ENUM ('visible','flagged','hidden','removed');

CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
  image_url text,
  visibility public.post_visibility NOT NULL DEFAULT 'connections',
  status public.moderation_status NOT NULL DEFAULT 'visible',
  flag_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS posts_author_idx ON public.posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_feed_idx ON public.posts(created_at DESC) WHERE status = 'visible';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Author sees own posts" ON public.posts
  FOR SELECT TO authenticated
  USING (author_id = auth.uid());
CREATE POLICY "Feed visibility" ON public.posts
  FOR SELECT TO authenticated
  USING (
    status IN ('visible','flagged')
    AND NOT public.is_blocked(auth.uid(), author_id)
    AND (
      visibility = 'public'
      OR (visibility = 'connections' AND public.are_connected(auth.uid(), author_id))
    )
  );
CREATE POLICY "Author writes posts" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.community_suspended_at IS NOT NULL)
  );
CREATE POLICY "Author updates own posts" ON public.posts
  FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "Author deletes own posts" ON public.posts
  FOR DELETE TO authenticated USING (author_id = auth.uid());
CREATE POLICY "Admins manage all posts" ON public.posts
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 7. COMMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  status public.moderation_status NOT NULL DEFAULT 'visible',
  flag_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS comments_post_idx ON public.comments(post_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read comments on visible posts" ON public.comments
  FOR SELECT TO authenticated
  USING (
    status IN ('visible','flagged')
    AND NOT public.is_blocked(auth.uid(), author_id)
    AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id)
  );
CREATE POLICY "Write own comments" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.community_suspended_at IS NOT NULL)
  );
CREATE POLICY "Update own comments" ON public.comments
  FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "Delete own comments" ON public.comments
  FOR DELETE TO authenticated USING (author_id = auth.uid());
CREATE POLICY "Admins manage comments" ON public.comments
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================
-- 8. CONVERSATIONS + PARTICIPANTS + MESSAGES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX IF NOT EXISTS cp_user_idx ON public.conversation_participants(user_id);
GRANT SELECT, INSERT, DELETE ON public.conversation_participants TO authenticated;
GRANT ALL ON public.conversation_participants TO service_role;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conv uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_participants
                 WHERE conversation_id = _conv AND user_id = _uid);
$$;
REVOKE ALL ON FUNCTION public.is_conversation_participant(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid,uuid) TO authenticated, service_role;

CREATE POLICY "See own conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (public.is_conversation_participant(id, auth.uid()));
CREATE POLICY "Create conversation" ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "See participants of own conversations" ON public.conversation_participants
  FOR SELECT TO authenticated
  USING (public.is_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY "Add participants to conversation you created" ON public.conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid())
    AND (user_id = auth.uid() OR public.are_connected(auth.uid(), user_id))
    AND NOT public.is_blocked(auth.uid(), user_id)
  );

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
  status public.moderation_status NOT NULL DEFAULT 'visible',
  flagged boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_conv_idx ON public.messages(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read messages in own conversations" ON public.messages
  FOR SELECT TO authenticated
  USING (
    public.is_conversation_participant(conversation_id, auth.uid())
    AND NOT public.is_blocked(auth.uid(), sender_id)
  );
CREATE POLICY "Send messages in own conversations" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_conversation_participant(conversation_id, auth.uid())
    AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.community_suspended_at IS NOT NULL)
  );
CREATE POLICY "Mark own read state" ON public.messages
  FOR UPDATE TO authenticated
  USING (public.is_conversation_participant(conversation_id, auth.uid()))
  WITH CHECK (public.is_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY "Admins read all messages" ON public.messages
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Rate-limit new conversations to 10/hour per user
CREATE OR REPLACE FUNCTION public.enforce_conversation_rate()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt
  FROM public.conversations
  WHERE created_by = NEW.created_by
    AND created_at > now() - interval '1 hour';
  IF cnt >= 10 THEN
    RAISE EXCEPTION 'Conversation rate limit reached. Try again later.';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS conversations_rate_limit ON public.conversations;
CREATE TRIGGER conversations_rate_limit BEFORE INSERT ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_conversation_rate();

-- Auto-flag scam patterns on messages/posts/comments
CREATE OR REPLACE FUNCTION public.flag_scam_content()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.contains_scam_pattern(NEW.content) THEN
    IF TG_TABLE_NAME = 'messages' THEN
      NEW.flagged := true;
    ELSE
      NEW.status := 'flagged';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER posts_scam_flag BEFORE INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.flag_scam_content();
CREATE TRIGGER comments_scam_flag BEFORE INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.flag_scam_content();
CREATE TRIGGER messages_scam_flag BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.flag_scam_content();

-- =========================================================
-- 9. REPORTS
-- =========================================================
CREATE TYPE public.report_target AS ENUM ('post','comment','message','profile');
CREATE TYPE public.report_status AS ENUM ('pending','reviewed','actioned','dismissed');

CREATE TABLE IF NOT EXISTS public.community_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type public.report_target NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 2000),
  status public.report_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.community_reports(status, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.community_reports TO authenticated;
GRANT ALL ON public.community_reports TO service_role;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "File a report" ON public.community_reports
  FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "See own reports" ON public.community_reports
  FOR SELECT TO authenticated USING (reporter_id = auth.uid());
CREATE POLICY "Admins manage reports" ON public.community_reports
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Auto-hide posts/comments after 3+ distinct reports
CREATE OR REPLACE FUNCTION public.auto_hide_on_reports()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cnt int;
BEGIN
  IF NEW.target_type = 'post' THEN
    SELECT count(DISTINCT reporter_id) INTO cnt FROM public.community_reports
      WHERE target_type='post' AND target_id = NEW.target_id;
    UPDATE public.posts SET flag_count = cnt WHERE id = NEW.target_id;
    IF cnt >= 3 THEN
      UPDATE public.posts SET status = 'hidden' WHERE id = NEW.target_id AND status <> 'removed';
    END IF;
  ELSIF NEW.target_type = 'comment' THEN
    SELECT count(DISTINCT reporter_id) INTO cnt FROM public.community_reports
      WHERE target_type='comment' AND target_id = NEW.target_id;
    UPDATE public.comments SET flag_count = cnt WHERE id = NEW.target_id;
    IF cnt >= 3 THEN
      UPDATE public.comments SET status = 'hidden' WHERE id = NEW.target_id AND status <> 'removed';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER reports_auto_hide AFTER INSERT ON public.community_reports
  FOR EACH ROW EXECUTE FUNCTION public.auto_hide_on_reports();

-- =========================================================
-- 10. MODERATION ACTIONS AUDIT
-- =========================================================
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  action text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.moderation_actions TO authenticated;
GRANT ALL ON public.moderation_actions TO service_role;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage moderation log" ON public.moderation_actions
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()) AND admin_id = auth.uid());

-- =========================================================
-- 11. NOTIFICATION PREFERENCES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_requests boolean NOT NULL DEFAULT true,
  connection_accepted boolean NOT NULL DEFAULT true,
  new_message boolean NOT NULL DEFAULT true,
  comment_on_post boolean NOT NULL DEFAULT true,
  giving_ready boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notification prefs" ON public.notification_preferences
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER notif_prefs_updated_at BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 12. NOTIFICATION EMITTERS
-- =========================================================
CREATE OR REPLACE FUNCTION public.notify_connection_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pref_on boolean;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    SELECT COALESCE(connection_requests, true) INTO pref_on FROM public.notification_preferences WHERE user_id = NEW.addressee_id;
    IF pref_on IS NOT FALSE THEN
      INSERT INTO public.notifications(user_id, kind, title, body, action_url)
      VALUES (NEW.addressee_id, 'connection_request', 'New connection request', 'Someone wants to connect with you.', '/community/connections');
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
    SELECT COALESCE(connection_accepted, true) INTO pref_on FROM public.notification_preferences WHERE user_id = NEW.requester_id;
    IF pref_on IS NOT FALSE THEN
      INSERT INTO public.notifications(user_id, kind, title, body, action_url)
      VALUES (NEW.requester_id, 'connection_accepted', 'Connection accepted', 'Your connection request was accepted.', '/community/connections');
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER connections_notify AFTER INSERT OR UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.notify_connection_event();

CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE author uuid; pref_on boolean;
BEGIN
  SELECT author_id INTO author FROM public.posts WHERE id = NEW.post_id;
  IF author IS NOT NULL AND author <> NEW.author_id THEN
    SELECT COALESCE(comment_on_post, true) INTO pref_on FROM public.notification_preferences WHERE user_id = author;
    IF pref_on IS NOT FALSE THEN
      INSERT INTO public.notifications(user_id, kind, title, body, action_url)
      VALUES (author, 'new_comment', 'New comment on your post', left(NEW.content, 140), '/community/post/' || NEW.post_id::text);
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER comments_notify AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_comment();

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; pref_on boolean;
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  FOR r IN SELECT user_id FROM public.conversation_participants
           WHERE conversation_id = NEW.conversation_id AND user_id <> NEW.sender_id LOOP
    SELECT COALESCE(new_message, true) INTO pref_on FROM public.notification_preferences WHERE user_id = r.user_id;
    IF pref_on IS NOT FALSE THEN
      INSERT INTO public.notifications(user_id, kind, title, body, action_url)
      VALUES (r.user_id, 'new_message', 'New message', left(NEW.content, 140), '/community/messages/' || NEW.conversation_id::text);
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
CREATE TRIGGER messages_notify AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();
