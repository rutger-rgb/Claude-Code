-- Hammerhead HQ — Supabase schema
-- Run dit in de SQL editor van je Supabase project (eenmalig).

-- ============================================================
-- MIGRAINES
-- ============================================================
create table if not exists migraines (
  id uuid primary key default gen_random_uuid(),
  ts timestamptz not null,
  created_at timestamptz default now()
);

alter table migraines enable row level security;

drop policy if exists "anon read migraines" on migraines;
drop policy if exists "anon insert migraines" on migraines;
drop policy if exists "anon delete migraines" on migraines;

create policy "anon read migraines"   on migraines for select to anon using (true);
create policy "anon insert migraines" on migraines for insert to anon with check (true);
create policy "anon delete migraines" on migraines for delete to anon using (true);

-- ============================================================
-- ARTICLES (webmaster posts, Jurriën reads)
-- ============================================================
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  description text,
  created_at timestamptz default now()
);

alter table articles enable row level security;

drop policy if exists "anon read articles" on articles;
drop policy if exists "anon insert articles" on articles;

create policy "anon read articles"   on articles for select to anon using (true);
create policy "anon insert articles" on articles for insert to anon with check (true);

-- ============================================================
-- QUOTES (webmaster-added real citations)
-- ============================================================
create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  source text not null,
  created_at timestamptz default now()
);

alter table quotes enable row level security;

drop policy if exists "anon read quotes" on quotes;
drop policy if exists "anon insert quotes" on quotes;

create policy "anon read quotes"   on quotes for select to anon using (true);
create policy "anon insert quotes" on quotes for insert to anon with check (true);

-- ============================================================
-- REALTIME: stream article inserts to connected clients
-- (so Jurriën gets live notifications when webmaster publishes)
-- ============================================================
alter publication supabase_realtime add table articles;
