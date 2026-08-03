ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS firebase_uid text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_firebase_uid_key
  ON public.profiles (firebase_uid)
  WHERE firebase_uid IS NOT NULL;

GRANT ALL ON public.profiles TO service_role;