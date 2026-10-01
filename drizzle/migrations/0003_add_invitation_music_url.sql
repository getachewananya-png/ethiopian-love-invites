-- Background music for the public invitation page.
-- Stores the YouTube link the couple pasted; the video id is derived at render
-- time, so every YouTube URL shape keeps working without a data migration.
--
-- IF NOT EXISTS keeps this safe to run against databases that already received
-- an earlier build of this migration.
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS music_url TEXT
  CHECK (music_url IS NULL OR char_length(music_url) <= 1000);
