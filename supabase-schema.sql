-- Run this in your Supabase SQL editor (supabase.com > your project > SQL Editor)

-- Submissions table
create extension if not exists pgcrypto;

create table if not exists submissions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  first_name text not null,
  last_name text,
  email text not null,
  experience text,
  issues text[],
  notes text,
  video_path text,
  video_url text,
  status text default 'pending',
  timestamps jsonb,
  overall_feedback text,
  rating integer,
  reviewed_at timestamp with time zone
);

-- Enable Row Level Security
alter table submissions enable row level security;

-- Policies
-- Note: If you already ran this once, re-running will fail unless we drop first.
drop policy if exists "Allow public inserts" on submissions;
drop policy if exists "Allow public selects" on submissions;
drop policy if exists "Allow service role all" on submissions;

-- Allow anonymous inserts (for the submission form)
create policy "Allow public inserts" on submissions
  for insert
  to anon
  with check (true);

-- Allow anonymous selects (review dashboard reads from the browser)
create policy "Allow public selects" on submissions
  for select
  to anon
  using (true);

-- Allow service role full access (for your review dashboard API)
create policy "Allow service role all" on submissions
  for all
  to service_role
  using (true);

-- Storage bucket for videos
-- Go to Storage in your Supabase dashboard and create a bucket called "videos"
-- Set it to Public so video URLs work directly in the browser
--
-- Storage RLS policies (run in SQL editor)
-- These allow anyone with the anon key to upload/read videos in the "videos" bucket.
-- If you want uploads public but reads private later, we can tighten this.

drop policy if exists "Public read videos bucket" on storage.objects;
drop policy if exists "Public upload videos bucket" on storage.objects;

create policy "Public read videos bucket"
  on storage.objects
  for select
  to anon
  using (bucket_id = 'videos');

create policy "Public upload videos bucket"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'videos');
