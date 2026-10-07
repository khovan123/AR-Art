-- AR Art / Everie MVP persistence.
-- Keep this schema aligned with the migrations applied to the Supabase project.

create table if not exists public.artworks (
  id uuid primary key,
  owner_id uuid references auth.users(id) on delete set null,
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

-- Artwork writes remain server-side. Authenticated creators may only read their own
-- artworks (plus legacy rows created before owner_id was introduced).
revoke all privileges on table public.artworks from anon;
revoke all privileges on table public.artworks from authenticated;
grant select on table public.artworks to authenticated;

drop policy if exists "Creators can view their own artworks" on public.artworks;
create policy "Creators can view their own artworks"
on public.artworks
for select
to authenticated
using ((select auth.uid()) = owner_id or owner_id is null);

-- A collection is now the authenticated user's automatic discovery archive.
-- Recognized artworks are inserted by the client after a successful AR scan.
create table if not exists public.user_collection (
  user_id uuid not null references auth.users(id) on delete cascade,
  artwork_id uuid not null references public.artworks(id) on delete cascade,
  collected_at timestamptz not null default now(),
  primary key (user_id, artwork_id)
);

create index if not exists user_collection_artwork_id_idx
  on public.user_collection (artwork_id);

alter table public.user_collection enable row level security;

revoke all privileges on table public.user_collection from anon;
revoke all privileges on table public.user_collection from authenticated;
grant select, insert, delete on table public.user_collection to authenticated;

drop policy if exists "Users can view their own collection" on public.user_collection;
create policy "Users can view their own collection"
on public.user_collection
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can collect items for themselves" on public.user_collection;
create policy "Users can collect items for themselves"
on public.user_collection
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove items from their own collection" on public.user_collection;
create policy "Users can remove items from their own collection"
on public.user_collection
for delete
to authenticated
using ((select auth.uid()) = user_id);

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

create index if not exists artworks_owner_id_idx
  on public.artworks (owner_id);

-- Legacy creator-managed collections are no longer part of the product model.
drop table if exists public.creator_collection_artworks;
drop table if exists public.creator_collections;