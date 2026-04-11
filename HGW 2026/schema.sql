-- HGW 2026 — Supabase schema
-- Plak dit in de Supabase SQL editor (eenmalig) om alle tabellen aan te maken.
-- Maak daarna een public storage bucket met de naam "photos".

-- Smoelenboek
create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nickname text,
  partner text,
  kids_count int default 0,
  avatar_url text,
  created_at timestamptz default now()
);

-- Programma
create table if not exists program (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz not null,
  created_at timestamptz default now()
);

-- Kamerindeling
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  number text not null,
  occupants text,
  note text,
  created_at timestamptz default now()
);

-- Kids
create table if not exists kids (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age int not null,
  parent text,
  allergies text,
  notes text,
  created_at timestamptz default now()
);

-- Pubquiz
create table if not exists quiz (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  options jsonb not null,
  correct int not null,
  created_at timestamptz default now()
);

-- Quotes
create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  said_by text not null,
  context text,
  created_at timestamptz default now()
);

-- Foto's
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  caption text,
  uploader text,
  created_at timestamptz default now()
);

-- Row Level Security — voor nu simpel: iedereen met de anon key mag alles
-- lezen en schrijven. Later kun je dit aanscherpen met auth-gebaseerde rules.
alter table people enable row level security;
alter table program enable row level security;
alter table rooms enable row level security;
alter table kids enable row level security;
alter table quiz enable row level security;
alter table quotes enable row level security;
alter table photos enable row level security;

do $$
declare t text;
begin
  for t in select unnest(array['people','program','rooms','kids','quiz','quotes','photos'])
  loop
    execute format('drop policy if exists "allow_all_%1$s" on %1$s', t);
    execute format('create policy "allow_all_%1$s" on %1$s for all using (true) with check (true)', t);
  end loop;
end $$;

-- Realtime voor alle tabellen aanzetten (zodat subscribe() live updates geeft)
alter publication supabase_realtime add table people;
alter publication supabase_realtime add table program;
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table kids;
alter publication supabase_realtime add table quiz;
alter publication supabase_realtime add table quotes;
alter publication supabase_realtime add table photos;

-- Storage: maak handmatig via de UI een public bucket 'photos' aan,
-- of run dit als je het in SQL wilt:
-- insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
-- on conflict (id) do nothing;
