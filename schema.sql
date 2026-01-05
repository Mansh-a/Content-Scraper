-- Create a table for saved content
create table saved_content (
  id text primary key,
  user_id uuid not null, -- Changed to uuid to match auth.users
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

-- Profiles table for legitimacy checks
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table saved_content enable row level security;
alter table profiles enable row level security;

-- Policies
create policy "Users can manage their own saved content"
on saved_content for all using (auth.uid() = user_id);

create policy "Public can check email existence"
on profiles for select using (true);

-- Function and Trigger to sync with auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
