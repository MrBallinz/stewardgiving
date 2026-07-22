
-- Feedback
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  route TEXT,
  user_agent TEXT,
  viewport TEXT,
  message TEXT NOT NULL,
  category TEXT,
  severity TEXT,
  ai_reply TEXT,
  admin_reply TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own feedback" ON public.feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own feedback" ON public.feedback
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update feedback" ON public.feedback
  FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE TRIGGER feedback_updated_at BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  action_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX notifications_user_active_idx ON public.notifications(user_id, created_at DESC)
  WHERE dismissed_at IS NULL;

-- Trigger: create a giving-ready notification when monthly_summaries row appears
CREATE OR REPLACE FUNCTION public.notify_giving_ready()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  amount NUMERIC;
BEGIN
  amount := COALESCE(NEW.giving_amount, 0);
  IF amount > 0 THEN
    INSERT INTO public.notifications (user_id, kind, title, body, action_url, metadata)
    VALUES (
      NEW.user_id,
      'giving_ready',
      'Your giving is ready',
      'Profit for ' || to_char(NEW.month_start, 'Mon YYYY') || ' is calculated. $'
        || to_char(amount, 'FM999,999,990.00') || ' is ready to give.',
      '/review/' || NEW.id::text,
      jsonb_build_object('summary_id', NEW.id, 'amount', amount, 'month', NEW.month_start)
    );
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER monthly_summaries_notify_giving_ready
  AFTER INSERT ON public.monthly_summaries
  FOR EACH ROW EXECUTE FUNCTION public.notify_giving_ready();
