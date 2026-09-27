CREATE TABLE public.evidence_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('photo','video','audio','document','other')),
  mime_type TEXT,
  size_bytes BIGINT,
  storage_path TEXT NOT NULL,
  notes TEXT,
  category TEXT,
  incident_id UUID REFERENCES public.incident_reports(id) ON DELETE SET NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  accuracy_m DOUBLE PRECISION,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidence_items TO authenticated;
GRANT ALL ON public.evidence_items TO service_role;
ALTER TABLE public.evidence_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ev_own_all" ON public.evidence_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER ev_updated_at BEFORE UPDATE ON public.evidence_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX evidence_items_user_idx ON public.evidence_items (user_id, created_at DESC);

ALTER TABLE public.incident_reports
  ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contact_ref TEXT,
  ADD COLUMN IF NOT EXISTS evidence_ids UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS report_code TEXT;

CREATE POLICY "evidence_select_own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'evidence' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "evidence_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidence' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "evidence_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'evidence' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "evidence_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'evidence' AND auth.uid()::text = (storage.foldername(name))[1]);