CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  template_id TEXT NOT NULL CHECK (template_id IN ('royal-tewahedo', 'addis-modern', 'habesha-romance')),
  bride_name TEXT NOT NULL CHECK (char_length(bride_name) BETWEEN 1 AND 100),
  groom_name TEXT NOT NULL CHECK (char_length(groom_name) BETWEEN 1 AND 100),
  bride_name_am TEXT CHECK (bride_name_am IS NULL OR char_length(bride_name_am) <= 100),
  groom_name_am TEXT CHECK (groom_name_am IS NULL OR char_length(groom_name_am) <= 100),
  wedding_date DATE NOT NULL,
  wedding_time TIME,
  ceremony_type TEXT CHECK (ceremony_type IS NULL OR char_length(ceremony_type) <= 100),
  venue TEXT CHECK (venue IS NULL OR char_length(venue) <= 200),
  venue_am TEXT CHECK (venue_am IS NULL OR char_length(venue_am) <= 200),
  address TEXT CHECK (address IS NULL OR char_length(address) <= 500),
  address_am TEXT CHECK (address_am IS NULL OR char_length(address_am) <= 500),
  story TEXT CHECK (story IS NULL OR char_length(story) <= 5000),
  story_am TEXT CHECK (story_am IS NULL OR char_length(story_am) <= 5000),
  how_we_met TEXT CHECK (how_we_met IS NULL OR char_length(how_we_met) <= 2000),
  phone TEXT CHECK (phone IS NULL OR char_length(phone) <= 40),
  email TEXT CHECK (email IS NULL OR char_length(email) <= 255),
  rsvp_enabled BOOLEAN NOT NULL DEFAULT true,
  rsvp_deadline DATE,
  custom_message TEXT CHECK (custom_message IS NULL OR char_length(custom_message) <= 2000),
  custom_message_am TEXT CHECK (custom_message_am IS NULL OR char_length(custom_message_am) <= 2000),
  primary_photo_url TEXT,
  gallery_photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  maps_url TEXT,
  customization JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.invitations TO anon, authenticated;
GRANT ALL ON public.invitations TO service_role;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published invitations are publicly readable"
ON public.invitations FOR SELECT TO anon, authenticated
USING (is_published = true);
CREATE INDEX invitations_published_slug_idx ON public.invitations (slug) WHERE is_published = true;
CREATE OR REPLACE FUNCTION public.set_invitation_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER set_invitations_updated_at
BEFORE UPDATE ON public.invitations
FOR EACH ROW EXECUTE FUNCTION public.set_invitation_updated_at();