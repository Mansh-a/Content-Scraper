-- Create a table for saved content
create table saved_content (
  id text primary key,
  user_id text not null, -- Added for isolation
  title text not null,
  content text not null,
  source text not null check (source in ('reddit', 'newsletter')),
  source_name text not null,
  url text not null,
  timestamp timestamptz not null,
  image_url text,
  is_saved boolean default true,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table saved_content enable row level security;

-- Create a policy that allows anyone to read/write (for demo purposes)
-- In production, you'd restrict this to authenticated users
create policy "Public Access"
on saved_content
for all
using (true)
with check (true);
