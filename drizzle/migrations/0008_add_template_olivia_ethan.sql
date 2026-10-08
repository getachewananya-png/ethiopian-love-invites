-- Adds the `olivia-ethan` template (free).
--
-- Widens the template_id CHECK on both `invitations` and `payments` to include
-- it.

ALTER TABLE public.invitations
  DROP CONSTRAINT IF EXISTS invitations_template_id_check;
ALTER TABLE public.invitations
  ADD CONSTRAINT invitations_template_id_check
  CHECK (template_id IN (
    'royal-tewahedo', 'addis-modern', 'habesha-romance',
    'lalibela-stone', 'buna-coffee', 'wonderland', 'traditional', 'olivia-ethan'
  ));

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_template_id_check;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_template_id_check
  CHECK (template_id IN (
    'royal-tewahedo', 'addis-modern', 'habesha-romance',
    'lalibela-stone', 'buna-coffee', 'wonderland', 'traditional', 'olivia-ethan'
  ));

