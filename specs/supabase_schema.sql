-- Supabase Schema Setup (Updated: 2025-05-09)

-- Enable RLS (Row-Level Security) for all tables
alter table auth.users enable row level security;

-- User Profiles Table
create table if not exists public.user_profiles (
  id uuid references auth.users(id) primary key,
  updated_at timestamptz default (now() AT TIME ZONE 'utc'),
  username text unique check (char_length(username) >= 3),
  full_name text,
  avatar_url text,
  website text,
  telegram_id integer,
  is_onboarded boolean default false not null,
  created_at timestamptz default (now() AT TIME ZONE 'utc'),
  country text,
  currency text,
  timezone text,
  is_anonymous boolean
);

-- Enable RLS on user_profiles
alter table public.user_profiles enable row level security;

-- Row-level security policy for user_profiles (users can only see their own profile)
create policy "Users can view their own profile" 
  on public.user_profiles 
  for select using (auth.uid() = id);

create policy "Users can update their own profile" 
  on public.user_profiles 
  for update using (auth.uid() = id);

-- Expenses Table
create table if not exists public.expenses (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid references auth.users(id),
  amount numeric not null,
  description text,
  category text,
  date timestamptz default now(),
  created_at timestamptz default now(),
  currency text default 'USD',
  telegram_user_id text,
  exchange_rate numeric,
  is_travel_expense boolean default false,
  travel_currency text,
  original_amount numeric
);

-- Enable RLS on expenses
alter table public.expenses enable row level security;

-- Row-level security policy for expenses (users can only see their own expenses)
create policy "Users can view their own expenses" 
  on public.expenses 
  for select using (auth.uid() = user_id);

create policy "Users can insert their own expenses" 
  on public.expenses 
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own expenses" 
  on public.expenses 
  for update using (auth.uid() = user_id);

create policy "Users can delete their own expenses" 
  on public.expenses 
  for delete using (auth.uid() = user_id);

-- Auth Codes Table (for Telegram integration)
create table if not exists public.auth_codes (
  code text primary key,
  telegram_user_id text not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null
);

-- Auth Tokens Table (for API authentication)
create table if not exists public.auth_tokens (
  token text primary key,
  telegram_user_id text not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null
);

-- Chat Messages Table
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  content text not null,
  role text check (role = ANY (ARRAY['user', 'assistant'])) not null,
  timestamp timestamptz default now() not null,
  action text,
  field text,
  attachment_url text,
  expense_id uuid references public.expenses(id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Tags Table
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id),
  name text not null,
  display text not null,
  created_at timestamp default now()
);

-- Expense Tags Table (many-to-many for expenses and tags)
create table if not exists public.expense_tags (
  expense_id uuid references public.expenses(id) not null,
  tag_id uuid references public.tags(id) not null,
  primary key (expense_id, tag_id)
);

-- Index for faster lookup
create index if not exists idx_expenses_user_id on public.expenses(user_id);
create index if not exists idx_expenses_date on public.expenses(date);
create index if not exists idx_expenses_category on public.expenses(category);
create index if not exists idx_expenses_telegram_user_id on public.expenses(telegram_user_id);

-- Function to update the updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for user_profiles
create trigger handle_updated_at
before update on public.user_profiles
for each row
execute function public.handle_updated_at();