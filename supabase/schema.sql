-- AR Art MVP persistence.
-- Run this once in the Supabase SQL editor.

create table if not exists public.artworks (
  id uuid primary key,
  slug text not null unique,
  title text not null check (char_length(title) between 1 and 120),
  artist_name text not null check (char_length(artist_name) between 1 and 120),
  description text not null default '' check (char_length(description) <= 1200),
  status text not null default 'draft' check (status in ('draft', 'published')),
  target_image_path text not null,
  target_file_path text not null,
  overlay_path text not null,
  overlay_type text not null default 'video' check (overlay_type in ('video')),
  overlay_aspect_ratio double precision not null check (overlay_aspect_ratio between 0.2 and 5),
  created_at timestamptz not null default now(),
  published_at timestamptz
);

alter table public.artworks enable row level security;

-- Application reads/writes metadata through the server-side service-role client,
-- so no anonymous table policies are required for the MVP.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'ar-art-assets',
  'ar-art-assets',
  true,
  6291456,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'application/octet-stream'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
