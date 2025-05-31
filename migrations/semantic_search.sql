-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column to tags table if it doesn't exist
ALTER TABLE public.tags 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Function to generate embeddings via Supabase Edge Functions
-- Note: This requires setting up a Supabase Edge Function that calls OpenAI's embedding API
CREATE OR REPLACE FUNCTION public.generate_tag_embedding(tag_name text)
RETURNS vector
LANGUAGE plpgsql
AS $$
DECLARE
  result vector;
BEGIN
  -- In production, this would call a Supabase Edge Function
  -- For now, we'll use a placeholder that you'll need to replace with actual implementation
  -- The real implementation would call OpenAI's embedding API
  -- This is just a placeholder to define the structure
  result := NULL;
  RETURN result;
END;
$$;

-- Function to update tag embeddings when tags are created or updated
CREATE OR REPLACE FUNCTION public.update_tag_embedding()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- In production, this would generate an actual embedding
  -- For now, we're just defining the structure
  NEW.embedding = public.generate_tag_embedding(NEW.name);
  RETURN NEW;
END;
$$;

-- Create a trigger to update embeddings when tags are inserted or updated
DROP TRIGGER IF EXISTS update_tag_embedding_trigger ON public.tags;
CREATE TRIGGER update_tag_embedding_trigger
BEFORE INSERT OR UPDATE ON public.tags
FOR EACH ROW
EXECUTE FUNCTION public.update_tag_embedding();

-- Create function for semantic search of tags
CREATE OR REPLACE FUNCTION public.search_tags_by_text(
  query_text TEXT,
  user_id_param UUID,
  match_threshold FLOAT DEFAULT 0.75,
  max_results INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  display TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_embedding vector;
BEGIN
  -- Generate embedding for the query text
  query_embedding := public.generate_tag_embedding(query_text);
  
  -- If we couldn't generate an embedding, fall back to text search
  IF query_embedding IS NULL THEN
    RETURN QUERY
    SELECT t.id, t.name, t.display, 1.0::float as similarity
    FROM public.tags t
    WHERE t.user_id = user_id_param
      AND (t.name ILIKE '%' || query_text || '%' OR t.display ILIKE '%' || query_text || '%')
    ORDER BY similarity DESC
    LIMIT max_results;
  ELSE
    -- Use vector similarity search if embedding is available
    RETURN QUERY
    SELECT t.id, t.name, t.display, 1 - (t.embedding <=> query_embedding) as similarity
    FROM public.tags t
    WHERE t.user_id = user_id_param
      AND 1 - (t.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT max_results;
  END IF;
END;
$$;

-- Create a function that returns expenses matching a semantic search query
CREATE OR REPLACE FUNCTION public.find_expenses_by_semantic_search(
  query_text TEXT,
  user_id_param UUID,
  start_date TIMESTAMPTZ DEFAULT NULL,
  end_date TIMESTAMPTZ DEFAULT NULL,
  category_param TEXT DEFAULT NULL,
  max_results INT DEFAULT 100
)
RETURNS TABLE (
  expense_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- First find matching tags
  RETURN QUERY
  WITH matching_tags AS (
    SELECT t.id
    FROM public.search_tags_by_text(query_text, user_id_param) t
    LIMIT 20
  ),
  -- Then find expenses linked to those tags
  matching_expenses AS (
    SELECT DISTINCT et.expense_id
    FROM public.expense_tags et
    JOIN matching_tags mt ON et.tag_id = mt.id
  )
  -- Return expenses that match date/category filters
  SELECT e.id
  FROM public.expenses e
  JOIN matching_expenses me ON e.id = me.expense_id
  WHERE e.user_id = user_id_param
    AND (start_date IS NULL OR e.date >= start_date)
    AND (end_date IS NULL OR e.date <= end_date)
    AND (category_param IS NULL OR category_param = 'All' OR e.category = category_param)
  ORDER BY e.date DESC
  LIMIT max_results;
END;
$$;
