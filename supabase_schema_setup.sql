-- Supabase Schema Setup

-- Enable RLS (Row-Level Security) for all tables
alter table auth.users enable row level security;

-- User Profiles Table
create table if not exists public.user_profiles (
  id uuid references auth.users(id) primary key,
  email text,
  telegram_id text,
  telegramLinked boolean default false,
  onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  amount decimal not null,
  description text,
  category text,
  date timestamptz default now(),
  createdAt timestamptz default now(),
  currency text default 'USD',
  telegram_user_id text
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