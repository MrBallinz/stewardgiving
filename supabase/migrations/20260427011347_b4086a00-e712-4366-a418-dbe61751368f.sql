
-- Enums
CREATE TYPE public.recipient_type AS ENUM ('church', 'missions', 'nonprofit', 'other');
CREATE TYPE public.summary_status AS ENUM ('pending', 'transferred', 'skipped');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'failed');

-- Shared updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  business_name TEXT,
  business_type TEXT,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Bank connections
CREATE TABLE public.bank_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_name TEXT NOT NULL,
  account_mask TEXT,
  plaid_item_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own banks select" ON public.bank_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own banks insert" ON public.bank_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own banks update" ON public.bank_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own banks delete" ON public.bank_connections FOR DELETE USING (auth.uid() = user_id);

-- Giving recipients
CREATE TABLE public.giving_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.recipient_type NOT NULL DEFAULT 'church',
  allocation_percent NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (allocation_percent >= 0 AND allocation_percent <= 100),
  ein TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.giving_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own recipients select" ON public.giving_recipients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own recipients insert" ON public.giving_recipients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own recipients update" ON public.giving_recipients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own recipients delete" ON public.giving_recipients FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER recipients_updated_at BEFORE UPDATE ON public.giving_recipients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Giving covenants
CREATE TABLE public.giving_covenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  percent_of_profit NUMERIC(5,2) NOT NULL DEFAULT 10 CHECK (percent_of_profit >= 0 AND percent_of_profit <= 100),
  minimum_monthly NUMERIC(12,2) NOT NULL DEFAULT 0,
  auto_transfer BOOLEAN NOT NULL DEFAULT false,
  scripture_anchor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.giving_covenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own covenant select" ON public.giving_covenants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own covenant insert" ON public.giving_covenants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own covenant update" ON public.giving_covenants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own covenant delete" ON public.giving_covenants FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER covenants_updated_at BEFORE UPDATE ON public.giving_covenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Monthly summaries
CREATE TABLE public.monthly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_expenses NUMERIC(14,2) NOT NULL DEFAULT 0,
  net_profit NUMERIC(14,2) NOT NULL DEFAULT 0,
  giving_percent NUMERIC(5,2) NOT NULL DEFAULT 10,
  giving_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  status public.summary_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, month)
);
ALTER TABLE public.monthly_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own summaries select" ON public.monthly_summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own summaries insert" ON public.monthly_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own summaries update" ON public.monthly_summaries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own summaries delete" ON public.monthly_summaries FOR DELETE USING (auth.uid() = user_id);

-- Giving transactions
CREATE TABLE public.giving_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_summary_id UUID NOT NULL REFERENCES public.monthly_summaries(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.giving_recipients(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  transferred_at TIMESTAMPTZ,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.giving_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own tx select" ON public.giving_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.monthly_summaries ms WHERE ms.id = monthly_summary_id AND ms.user_id = auth.uid())
);
CREATE POLICY "Own tx insert" ON public.giving_transactions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.monthly_summaries ms WHERE ms.id = monthly_summary_id AND ms.user_id = auth.uid())
);
CREATE POLICY "Own tx update" ON public.giving_transactions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.monthly_summaries ms WHERE ms.id = monthly_summary_id AND ms.user_id = auth.uid())
);
CREATE POLICY "Own tx delete" ON public.giving_transactions FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.monthly_summaries ms WHERE ms.id = monthly_summary_id AND ms.user_id = auth.uid())
);

CREATE INDEX idx_summaries_user_month ON public.monthly_summaries(user_id, month DESC);
CREATE INDEX idx_recipients_user ON public.giving_recipients(user_id);
CREATE INDEX idx_tx_summary ON public.giving_transactions(monthly_summary_id);
