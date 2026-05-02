CREATE OR REPLACE FUNCTION public.consume_chat_rate(_user_id uuid, _minute_limit int, _hour_limit int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.chat_rate_buckets;
  now_ts timestamptz := now();
  m_start timestamptz;
  h_start timestamptz;
  m_count int;
  h_count int;
BEGIN
  SELECT * INTO rec FROM public.chat_rate_buckets WHERE user_id = _user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.chat_rate_buckets(user_id, minute_window_start, minute_count, hour_window_start, hour_count, updated_at)
    VALUES (_user_id, now_ts, 1, now_ts, 1, now_ts);
    RETURN jsonb_build_object('ok', true, 'minute_count', 1, 'hour_count', 1);
  END IF;

  m_start := rec.minute_window_start;
  h_start := rec.hour_window_start;
  m_count := rec.minute_count;
  h_count := rec.hour_count;

  IF now_ts - m_start >= interval '1 minute' THEN
    m_start := now_ts; m_count := 0;
  END IF;
  IF now_ts - h_start >= interval '1 hour' THEN
    h_start := now_ts; h_count := 0;
  END IF;

  IF m_count >= _minute_limit THEN
    RETURN jsonb_build_object('ok', false, 'retry_after',
      GREATEST(1, ceil(extract(epoch from (m_start + interval '1 minute' - now_ts)))::int));
  END IF;
  IF h_count >= _hour_limit THEN
    RETURN jsonb_build_object('ok', false, 'retry_after',
      GREATEST(1, ceil(extract(epoch from (h_start + interval '1 hour' - now_ts)))::int));
  END IF;

  UPDATE public.chat_rate_buckets
  SET minute_window_start = m_start,
      minute_count = m_count + 1,
      hour_window_start = h_start,
      hour_count = h_count + 1,
      updated_at = now_ts
  WHERE user_id = _user_id;

  RETURN jsonb_build_object('ok', true, 'minute_count', m_count + 1, 'hour_count', h_count + 1);
END;
$$;

REVOKE ALL ON FUNCTION public.consume_chat_rate(uuid, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_chat_rate(uuid, int, int) TO service_role;

ALTER TABLE public.chat_rate_buckets ENABLE ROW LEVEL SECURITY;
