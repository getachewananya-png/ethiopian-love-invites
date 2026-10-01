-- Adds the `wonderland` template (free).
--
-- Widens the template_id CHECK on both `invitations` and `payments` to include
-- it. Postgres cannot ALTER a CHECK in place, so each is dropped and re-added
-- with the full list. DROP ... IF EXISTS keeps this re-runnable.
--
-- Run this in one transaction (the Supabase SQL Editor does by default) so a
-- failure cannot leave a table with no constraint.

ALTER TABLE public.invitations
  DROP CONSTRAINT IF EXISTS invitations_template_id_check;
ALTER TABLE public.invitations
  ADD CONSTRAINT invitations_template_id_check
  CHECK (template_id IN (
    'royal-tewahedo', 'addis-modern', 'habesha-romance',
    'lalibela-stone', 'buna-coffee', 'wonderland'
  ));

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_template_id_check;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_template_id_check
  CHECK (template_id IN (
    'royal-tewahedo', 'addis-modern', 'habesha-romance',
    'lalibela-stone', 'buna-coffee', 'wonderland'
  ));