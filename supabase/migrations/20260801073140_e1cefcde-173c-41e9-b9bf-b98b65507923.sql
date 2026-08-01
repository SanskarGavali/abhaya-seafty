ALTER TABLE public.incident_reports
  ADD COLUMN IF NOT EXISTS device_info jsonb,
  ADD COLUMN IF NOT EXISTS trigger_method text,
  ADD COLUMN IF NOT EXISTS contacts_notified jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS recording_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS recording_path text,
  ADD COLUMN IF NOT EXISTS recording_key text,
  ADD COLUMN IF NOT EXISTS network_status text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS accuracy_m double precision;

CREATE INDEX IF NOT EXISTS incident_reports_user_created_idx ON public.incident_reports (user_id, created_at DESC);