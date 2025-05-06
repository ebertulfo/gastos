-- Add tags and expense_tags tables for tag functionality

-- Tags Table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,           -- normalized lowercase
  display TEXT NOT NULL,        -- original user input
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a functional index for case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS unique_tag_per_user ON tags (user_id, LOWER(name));

-- Expense Tags Junction Table
CREATE TABLE IF NOT EXISTS public.expense_tags (
  expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (expense_id, tag_id)
);

-- Enable RLS on tags table
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Row-level security policies for tags
CREATE POLICY "Users can view their own tags" 
  ON public.tags 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags" 
  ON public.tags 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" 
  ON public.tags 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" 
  ON public.tags 
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on expense_tags table
ALTER TABLE public.expense_tags ENABLE ROW LEVEL SECURITY;

-- Row-level security policies for expense_tags
CREATE POLICY "Users can view their own expense tags" 
  ON public.expense_tags 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.expenses 
      WHERE public.expenses.id = expense_id 
      AND public.expenses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own expense tags" 
  ON public.expense_tags 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses 
      WHERE public.expenses.id = expense_id 
      AND public.expenses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own expense tags" 
  ON public.expense_tags 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.expenses 
      WHERE public.expenses.id = expense_id 
      AND public.expenses.user_id = auth.uid()
    )
  );

-- Indexes for improved performance
CREATE INDEX IF NOT EXISTS idx_expense_tags_expense_id ON public.expense_tags(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_tags_tag_id ON public.expense_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);