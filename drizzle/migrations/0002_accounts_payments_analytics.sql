-- Accounts, guest tracking, RSVPs, and Chapa payments.
-- Extends public.invitations with ownership + analytics columns.

-- ===== profiles =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL CHECK (char_length(email) <= 255),
  full_name TEXT CHECK (full_name IS NULL OR char_length(full_name) <= 120),
  phone TEXT CHECK (phone IS NULL OR char_length(phone) <= 40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can read their profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Owners can update their profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Owners can insert their profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- ===== invitations: ownership + analytics =====
ALTER TABLE public.invitations
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN is_paid BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  ADD COLUMN target_guest_count INTEGER NOT NULL DEFAULT 50
    CHECK (target_guest_count BETWEEN 0 AND 2000);

CREATE INDEX invitations_user_id_idx ON public.invitations (user_id);
CREATE INDEX invitations_user_created_idx ON public.invitations (user_id, created_at DESC);

-- Owners see and manage their own invitations (published or not).
CREATE POLICY "Owners can read their invitations"
  ON public.invitations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Owners can update their invitations"
  ON public.invitations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can delete their invitations"
  ON public.invitations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ===== guests: one per invitation, each with its own share token =====
CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE CHECK (char_length(share_token) BETWEEN 8 AND 64),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  phone TEXT CHECK (phone IS NULL OR char_length(phone) <= 40),
  email TEXT CHECK (email IS NULL OR char_length(email) <= 255),
  channel TEXT NOT NULL DEFAULT 'link' CHECK (channel IN ('link', 'whatsapp', 'telegram', 'sms', 'email', 'other')),
  sent_at TIMESTAMPTZ,
  first_viewed_at TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guests TO authenticated;
GRANT SELECT, UPDATE ON public.guests TO anon;
GRANT ALL ON public.guests TO service_role;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage guests"
  ON public.guests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.invitations i WHERE i.id = guests.invitation_id AND i.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.invitations i WHERE i.id = guests.invitation_id AND i.user_id = auth.uid()));

-- ===== rsvps =====
CREATE TABLE public.rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  attending BOOLEAN NOT NULL,
  party_size INTEGER NOT NULL DEFAULT 1 CHECK (party_size BETWEEN 0 AND 20),
  message TEXT CHECK (message IS NULL OR char_length(message) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.rsvps TO authenticated;
GRANT INSERT ON public.rsvps TO anon, authenticated;
GRANT ALL ON public.rsvps TO service_role;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can read rsvps"
  ON public.rsvps FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.invitations i WHERE i.id = rsvps.invitation_id AND i.user_id = auth.uid()));
CREATE POLICY "Owners can delete rsvps"
  ON public.rsvps FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.invitations i WHERE i.id = rsvps.invitation_id AND i.user_id = auth.uid()));
CREATE INDEX rsvps_invitation_idx ON public.rsvps (invitation_id);
CREATE INDEX rsvps_guest_idx ON public.rsvps (guest_id);

CREATE TRIGGER set_rsvps_updated_at
  BEFORE UPDATE ON public.rsvps
  FOR EACH ROW EXECUTE FUNCTION public.set_invitation_updated_at();

-- ===== payments (Chapa) =====
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitation_id UUID REFERENCES public.invitations(id) ON DELETE SET NULL,
  template_id TEXT NOT NULL CHECK (template_id IN ('royal-tewahedo', 'addis-modern', 'habesha-romance')),
  tx_ref TEXT NOT NULL UNIQUE CHECK (char_length(tx_ref) BETWEEN 4 AND 120),
  chapa_ref_id TEXT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'ETB' CHECK (currency IN ('ETB', 'USD')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
  mode TEXT CHECK (mode IS NULL OR mode IN ('test', 'live')),
  fulfilled_at TIMESTAMPTZ,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can read their payments"
  ON public.payments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE INDEX payments_user_idx ON public.payments (user_id, created_at DESC);
CREATE INDEX payments_invitation_idx ON public.payments (invitation_id);

CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_invitation_updated_at();

-- ===== auto-create a profile for every new auth user =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== guest view tracking (anon may bump the counter, nothing else) =====
CREATE OR REPLACE FUNCTION public.record_guest_view(token TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.guests
  SET view_count = view_count + 1,
      first_viewed_at = COALESCE(first_viewed_at, now())
  WHERE share_token = token;
END;
$$;
GRANT EXECUTE ON FUNCTION public.record_guest_view(TEXT) TO anon, authenticated;
