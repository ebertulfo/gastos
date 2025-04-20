-- Create chat_messages table
create table if not exists public.chat_messages (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    content text not null,
    role text not null check (role in ('user', 'assistant')),
    timestamp timestamptz default now() not null,
    action text,
    field text,
    attachment_url text,
    expense_id uuid references public.expenses(id) on delete set null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Add RLS policies
alter table public.chat_messages enable row level security;

create policy "Users can view their own chat messages"
    on public.chat_messages for select
    using (auth.uid() = user_id);

create policy "Users can insert their own chat messages"
    on public.chat_messages for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own chat messages"
    on public.chat_messages for update
    using (auth.uid() = user_id);

create policy "Users can delete their own chat messages"
    on public.chat_messages for delete
    using (auth.uid() = user_id);

-- Add indexes
create index chat_messages_user_id_idx on public.chat_messages(user_id);
create index chat_messages_timestamp_idx on public.chat_messages(timestamp);
create index chat_messages_expense_id_idx on public.chat_messages(expense_id); 