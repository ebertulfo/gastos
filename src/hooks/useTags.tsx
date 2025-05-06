import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/index';

interface Tag {
  id: string;
  display: string;
  name: string;
}

export function useTags(searchValue: string, userId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>('No queries yet');
  
  // Helper function to fetch exact tag matches
  const fetchExactMatches = async (userId: string, value: string): Promise<Tag[]> => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('id, display, name')
        .eq('user_id', userId)
        .ilike('name', `${value.toLowerCase()}`)
        .order('name')
        .limit(10);
        
      if (error) {
        console.error('Error fetching exact tags:', error);
        setDebugInfo(prev => `${prev}\nExact search error: ${error.message}`);
        return [];
      }
      
      return data || [];
    } catch (err) {
      console.error('Exception in exact match query:', err);
      setDebugInfo(prev => `${prev}\nExact match exception: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  };

  // Helper function to fetch display tag matches
  const fetchDisplayMatches = async (userId: string, value: string): Promise<Tag[]> => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('id, display, name')
        .eq('user_id', userId)
        .ilike('display', `%${value}%`)
        .order('name')
        .limit(10);
        
      if (error) {
        console.error('Error fetching display tags:', error);
        setDebugInfo(prev => `${prev}\nDisplay search error: ${error.message}`);
        return [];
      }
      
      return data || [];
    } catch (err) {
      console.error('Exception in display match query:', err);
      setDebugInfo(prev => `${prev}\nDisplay match exception: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  };

  // Helper function to fetch partial tag matches
  const fetchPartialMatches = async (userId: string, value: string): Promise<Tag[]> => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('id, display, name')
        .eq('user_id', userId)
        .ilike('name', `%${value.toLowerCase()}%`)
        .order('name')
        .limit(10);

      if (error) {
        console.error('Error fetching partial tags:', error);
        setDebugInfo(prev => `${prev}\nPartial search error: ${error.message}`);
        return [];
      }
      
      return data || [];
    } catch (err) {
      console.error('Exception in partial match query:', err);
      setDebugInfo(prev => `${prev}\nPartial match exception: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  };

  // Helper function to fetch all tags (for debugging)
  const fetchAllTags = async (userId: string): Promise<Tag[]> => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('id, display, name, user_id')
        .eq('user_id', userId)
        .limit(100);
        
      if (error) {
        console.error('Error fetching all tags:', error);
        setDebugInfo(prev => `${prev}\nAll tags error: ${error.message}`);
        return [];
      }
      
      return data || [];
    } catch (err) {
      console.error('Exception in all tags query:', err);
      setDebugInfo(prev => `${prev}\nAll tags exception: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  };
  
  useEffect(() => {
    const fetchTags = async () => {
      if (!userId) {
        console.error('No user ID provided');
        setDebugInfo('Error: No user ID provided');
        return;
      }
      
      if (!searchValue.trim()) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        setDebugInfo(`Searching for "${searchValue}" with user ${userId}`);
        
        // First try a direct match on name field
        const exactMatches = await fetchExactMatches(userId, searchValue);
        
        // Then try searching in display field (which preserves capitalization)
        const displayMatches = await fetchDisplayMatches(userId, searchValue);
        
        // Finally try partial matches in name field
        const partialMatches = await fetchPartialMatches(userId, searchValue);
        
        // Combine results and remove duplicates
        const allMatches = [
          ...exactMatches,
          ...displayMatches,
          ...partialMatches
        ];
        
        // Remove duplicates by ID
        const uniqueMatches = Array.from(
          new Map(allMatches.map(item => [item.id, item])).values()
        );
        
        setDebugInfo(prev => `${prev}\nFinal match count: ${uniqueMatches.length}`);
        
        setSuggestions(uniqueMatches || []);
      } catch (err) {
        console.error('Error in fetchTags:', err);
        setDebugInfo(`Error: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };

    // Use a slight delay to prevent excessive API calls while typing
    const timeoutId = setTimeout(() => {
      fetchTags();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue, userId]);

  return {
    suggestions,
    isLoading,
    debugInfo,
    fetchAllTags, // Exposing for debugging purposes
  };
}