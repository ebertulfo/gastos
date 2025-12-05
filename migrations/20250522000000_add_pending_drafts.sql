-- Add pending_expense_drafts table for multi-turn conversation
CREATE TABLE IF NOT EXISTS public.pending_expense_drafts (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  description TEXT,
  amount NUMERIC,
  currency TEXT,
  category TEXT,
  tags TEXT[],
  date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  context_messages JSONB DEFAULT '[]'::JSONB NOT NULL,
  awaiting_field TEXT, -- Which field we're waiting for: 'amount', 'description', etc.
  is_travel_expense BOOLEAN DEFAULT FALSE,
  travel_currency TEXT,
  original_amount NUMERIC,
  exchange_rate NUMERIC
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_expense_drafts_user_id ON public.pending_expense_drafts(user_id);

-- Add RLS policies
ALTER TABLE public.pending_expense_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drafts" 
  ON public.pending_expense_drafts 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drafts" 
  ON public.pending_expense_drafts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts" 
  ON public.pending_expense_drafts 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts" 
  ON public.pending_expense_drafts 
  FOR DELETE USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER handle_pending_drafts_updated_at
  BEFORE UPDATE ON public.pending_expense_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create a new column in chat_messages to link to pending drafts
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS draft_id UUID REFERENCES public.pending_expense_drafts(id);
