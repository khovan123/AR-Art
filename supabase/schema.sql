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
grant select, insert on table public.user_collection to authenticated;

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

create table if not exists public.creator_collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 500),
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_collections_owner_id_idx
  on public.creator_collections (owner_id);

create table if not exists public.creator_collection_artworks (
  collection_id uuid not null references public.creator_collections(id) on delete cascade,
  artwork_id uuid not null references public.artworks(id) on delete cascade,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  primary key (collection_id, artwork_id)
);

create index if not exists creator_collection_artworks_artwork_id_idx
  on public.creator_collection_artworks (artwork_id);

alter table public.creator_collections enable row level security;
alter table public.creator_collection_artworks enable row level security;

revoke all privileges on table public.creator_collections from anon;
revoke all privileges on table public.creator_collection_artworks from anon;
revoke all privileges on table public.creator_collections from authenticated;
revoke all privileges on table public.creator_collection_artworks from authenticated;
grant select, insert, update, delete on table public.creator_collections to authenticated;
grant select, insert, update, delete on table public.creator_collection_artworks to authenticated;

create policy "Creators can view their own collections" on public.creator_collections
for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Creators can create their own collections" on public.creator_collections
for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Creators can update their own collections" on public.creator_collections
for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Creators can delete their own collections" on public.creator_collections
for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "Creators can view collection artworks" on public.creator_collection_artworks
for select to authenticated using (exists (select 1 from public.creator_collections c where c.id = collection_id and c.owner_id = (select auth.uid())));
create policy "Creators can add collection artworks" on public.creator_collection_artworks
for insert to authenticated with check (
  exists (select 1 from public.creator_collections c where c.id = collection_id and c.owner_id = (select auth.uid()))
  and exists (select 1 from public.artworks a where a.id = artwork_id and (a.owner_id = (select auth.uid()) or a.owner_id is null))
);
create policy "Creators can update collection artworks" on public.creator_collection_artworks
for update to authenticated
using (exists (select 1 from public.creator_collections c where c.id = collection_id and c.owner_id = (select auth.uid())))
with check (
  exists (select 1 from public.creator_collections c where c.id = collection_id and c.owner_id = (select auth.uid()))
  and exists (select 1 from public.artworks a where a.id = artwork_id and (a.owner_id = (select auth.uid()) or a.owner_id is null))
);
create policy "Creators can remove collection artworks" on public.creator_collection_artworks
for delete to authenticated using (exists (select 1 from public.creator_collections c where c.id = collection_id and c.owner_id = (select auth.uid())));
