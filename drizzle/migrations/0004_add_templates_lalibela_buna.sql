-- Adds two templates: lalibela-stone (free) and buna-coffee (paid, 350 ETB).
--
-- Both `invitations` and `payments` carry a CHECK constraint listing the
-- allowed template ids. Postgres cannot ALTER a CHECK in place, so each one is
-- dropped and re-added with the wider list.
--
-- `DROP ... IF EXISTS` makes this safe to re-run. Run the whole file in one
-- transaction (the Supabase SQL Editor does this by default) so a failure
-- cannot leave a table with no constraint at all.

ALTER TABLE public.invitations
  DROP CONSTRAINT IF EXISTS invitations_template_id_check;
ALTER TABLE public.invitations
  ADD CONSTRAINT invitations_template_id_check
  CHECK (template_id IN (
    'royal-tewahedo', 'addis-modern', 'habesha-romance',
    'lalibela-stone', 'buna-coffee'
  ));

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_template_id_check;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_template_id_check
  CHECK (template_id IN (
    'royal-tewahedo', 'addis-modern', 'habesha-romance',
    'lalibela-stone', 'buna-coffee'
  ));
