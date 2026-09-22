-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. BUSINESSES TABLE
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  google_review_url text not null,
  status text not null default 'active' check (status in ('active', 'suspended', 'inactive')),
  created_at timestamptz default now()
);

-- 2. PROFILES TABLE (Tied to Supabase Auth Users)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  business_id uuid references public.businesses(id) on delete set null,
  name text,
  email text not null,
  role text not null default 'business_owner' check (role in ('super_admin', 'business_owner', 'staff')),
  created_at timestamptz default now()
);

-- 3. CARDS TABLE (Physical NFC / QR Cards)
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  card_code text unique not null,
  name text not null,
  status text not null default 'active' check (status in ('active', 'inactive', 'unassigned')),
  created_at timestamptz default now()
);

-- 4. REVIEW SESSIONS TABLE
create table if not exists public.review_sessions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  card_id uuid references public.cards(id) on delete set null,
  rating integer check (rating between 1 and 5),
  feedback text,
  review_text text,
  google_clicked boolean default false,
  completed boolean default false,
  created_at timestamptz default now()
);

-- 5. AI GENERATIONS LOG TABLE
create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  session_id uuid references public.review_sessions(id) on delete cascade,
  input_text text,
  output_text text,
  model text default 'gpt-4o-mini',
  created_at timestamptz default now()
);

-- 6. ANALYTICS EVENTS TABLE
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  card_id uuid references public.cards(id) on delete set null,
  session_id uuid references public.review_sessions(id) on delete set null,
  event_type text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 7. REVIEW REPLIES TABLE (AI Owner Replies)
create table if not exists public.review_replies (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  session_id uuid references public.review_sessions(id) on delete cascade,
  reply_text text not null,
  tone text default 'warm',
  mode text default 'single' check (mode in ('single', 'bundle')),
  created_at timestamptz default now()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.cards enable row level security;
alter table public.review_sessions enable row level security;
alter table public.ai_generations enable row level security;
alter table public.events enable row level security;
alter table public.review_replies enable row level security;

-- Helper Function: Check if user is Super Admin
create or replace function public.is_super_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
end;
$$ language plpgsql security definer;

-- BUSINESSES RLS
create policy "Super admin has full access to businesses"
  on public.businesses for all
  using (public.is_super_admin());

create policy "Business owners can view their own business profile"
  on public.businesses for select
  using (id in (select business_id from public.profiles where id = auth.uid()));

create policy "Public can view business name and logo for active cards"
  on public.businesses for select
  using (true);

create policy "Allow insert for business onboarding"
  on public.businesses for insert
  with check (true);

create policy "Allow update for business admin"
  on public.businesses for update
  using (true);

create policy "Allow delete for business admin"
  on public.businesses for delete
  using (true);

-- CARDS RLS
create policy "Super admin has full access to cards"
  on public.cards for all
  using (public.is_super_admin());

create policy "Business owners can view their assigned cards"
  on public.cards for select
  using (business_id in (select business_id from public.profiles where id = auth.uid()));

create policy "Public can view active card details by card_code"
  on public.cards for select
  using (true);

create policy "Allow insert for card issuance"
  on public.cards for insert
  with check (true);

create policy "Allow update for card management"
  on public.cards for update
  using (true);

create policy "Allow delete for card management"
  on public.cards for delete
  using (true);

-- REVIEW SESSIONS RLS
create policy "Super admin can view all review sessions"
  on public.review_sessions for select
  using (public.is_super_admin());

create policy "Business owners can view review sessions for their business"
  on public.review_sessions for select
  using (business_id in (select business_id from public.profiles where id = auth.uid()));

create policy "Public can create and update review sessions"
  on public.review_sessions for insert
  with check (true);

create policy "Public can update session feedback"
  on public.review_sessions for update
  using (true);

-- AI GENERATIONS RLS
create policy "Super admin can view all AI generations"
  on public.ai_generations for select
  using (public.is_super_admin());

create policy "Business owners can view AI generations for their business"
  on public.ai_generations for select
  using (business_id in (select business_id from public.profiles where id = auth.uid()));

create policy "Server insert AI generations"
  on public.ai_generations for insert
  with check (true);

-- EVENTS RLS
create policy "Super admin can view all events"
  on public.events for select
  using (public.is_super_admin());

create policy "Business owners can view events for their business"
  on public.events for select
  using (business_id in (select business_id from public.profiles where id = auth.uid()));

create policy "Public can create tap/scan events"
  on public.events for insert
  with check (true);

-- REVIEW REPLIES RLS
create policy "Super admin can view all review replies"
  on public.review_replies for select
  using (public.is_super_admin());

create policy "Business owners can manage review replies for their business"
  on public.review_replies for all
  using (business_id in (select business_id from public.profiles where id = auth.uid()));

create policy "Server insert review replies"
  on public.review_replies for insert
  with check (true);

-- SEED DATA FOR DEMO CARDS & TEST BUSINESSES
insert into public.businesses (id, name, slug, logo_url, google_review_url, status)
values
  ('11111111-1111-1111-1111-111111111111', 'Your Café', 'your-cafe', '☕', 'https://www.google.com/search?q=Your+Cafe+Google+reviews', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Your Hotel', 'your-hotel', '🏨', 'https://www.google.com/search?q=Your+Hotel+Google+reviews', 'active')
on conflict (id) do nothing;

insert into public.cards (id, business_id, card_code, name, status)
values
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '1-123ab', 'Counter Top NFC Stand 1', 'active'),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '2-456cd', 'Reception Desk NFC Card', 'active')
on conflict (id) do nothing;
