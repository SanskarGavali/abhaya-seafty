CREATE TABLE public.custom_safe_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  kind text NOT NULL DEFAULT 'other',
  lat double precision NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng double precision NOT NULL CHECK (lng BETWEEN -180 AND 180),
  address text CHECK (address IS NULL OR char_length(address) <= 300),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 30),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_safe_places TO authenticated;
GRANT ALL ON public.custom_safe_places TO service_role;
ALTER TABLE public.custom_safe_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own safe places" ON public.custom_safe_places FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add own safe places" ON public.custom_safe_places FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own safe places" ON public.custom_safe_places FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own safe places" ON public.custom_safe_places FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX custom_safe_places_user_idx ON public.custom_safe_places(user_id);