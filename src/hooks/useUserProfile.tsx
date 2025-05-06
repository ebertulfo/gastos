import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/index';

interface UserProfile {
  id: string;
  email?: string;
  telegram_id?: string | null;
  updated_at?: string | Date;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  website?: string | null;
  is_onboarded?: boolean;
  created_at?: string | Date;
  country?: string | null;
  currency?: string | null;
  timezone?: string | null;
  is_anonymous?: boolean | null;
}

export function useUserProfile() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get a user profile by ID
   */
  const getProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update user profile data
   */
  const updateProfile = useCallback(async (userId: string, data: Partial<UserProfile>): Promise<UserProfile | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Include updated_at timestamp
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };
      
      const { data: updatedProfile, error } = await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return updatedProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new user profile
   */
  const createProfile = useCallback(async (profile: UserProfile): Promise<UserProfile | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .insert({
          ...profile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getProfile,
    updateProfile,
    createProfile,
    isLoading,
    error
  };
}