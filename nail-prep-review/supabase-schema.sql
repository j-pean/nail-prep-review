-- Run this in your Supabase SQL editor (supabase.com > your project > SQL Editor)

-- Submissions table
create table submissions (
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

-- Allow anonymous inserts (for the submission form)
create policy "Allow public inserts" on submissions
  for insert to anon with check (true);

-- Allow service role full access (for your review dashboard API)
create policy "Allow service role all" on submissions
  for all to service_role using (true);

-- Storage bucket for videos
-- Go to Storage in your Supabase dashboard and create a bucket called "videos"
-- Set it to Public so video URLs work directly in the browser
-- Then add this storage policy in the Supabase dashboard under Storage > Policies:
--   Allow anon uploads: bucket_id = 'videos'
