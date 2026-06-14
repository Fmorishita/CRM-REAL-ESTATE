-- Add DEFAULT now() to every updated_at column so raw inserts (seeds, SQL imports)
-- don't violate NOT NULL. Prisma still sets updated_at from the client on updates.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT table_name FROM information_schema.columns
    WHERE table_schema='public' AND column_name='updated_at'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN updated_at SET DEFAULT now();', r.table_name);
  END LOOP;
END $$;
