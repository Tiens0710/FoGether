-- Create a table for storing food journal posts
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  title text,
  location text,
  rating float8,
  image_url text not null,
  note text
);

-- Set up Row Level Security (RLS)
-- For now, allow public access to simplify development. 
-- In a real app, you would restrict this to authenticated users.
alter table public.posts enable row level security;

create policy "Enable read access for all users"
on public.posts for select
using (true);

create policy "Enable insert access for all users"
on public.posts for insert
with check (true);

-- ==========================================
-- UPDATE FOR GEOLOCATION
-- Run this if you already created the table
-- ==========================================
alter table public.posts 
add column latitude float8, 
add column longitude float8;
