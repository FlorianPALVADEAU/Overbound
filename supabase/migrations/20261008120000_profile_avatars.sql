-- Profile photos.
--   profiles.avatar_url    : the photo shown everywhere (account, group members, QR sheet, header).
--   profiles.avatar_source : 'provider' = copied from the sign-in provider (Google), refreshed at login;
--                            'upload'   = chosen by the user, never overwritten by the provider.
-- Uploads are written by the API (service role) to the public `avatars` bucket under {user_id}/.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS avatar_source text;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_avatar_source_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_avatar_source_check CHECK (avatar_source IS NULL OR avatar_source IN ('provider', 'upload'));

-- Existing Google accounts get their photo without having to log in again.
UPDATE public.profiles p
SET avatar_url = COALESCE(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture'),
    avatar_source = 'provider'
FROM auth.users u
WHERE u.id = p.id
  AND p.avatar_url IS NULL
  AND COALESCE(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture') IS NOT NULL;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/webp', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
