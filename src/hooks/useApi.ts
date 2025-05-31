"use client";

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

/**
 * A hook for interacting with API endpoints in a consistent way
 * Provides loading, error states, and handles auth headers
 */
export function useApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  /**
   * Make an authenticated API request
   */
  const apiRequest = useCallback(async <T>({
    url,
    method = 'GET',
    data = undefined,
    headers = {},
    showSuccessToast = false,
    successMessage = 'Operation completed successfully',
    showErrorToast = true,
  }: {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: unknown;
    headers?: Record<string, string>;
    showSuccessToast?: boolean;
    successMessage?: string;
    showErrorToast?: boolean;
  }): Promise<T | null> => {
    if (!url) {
      console.error('No URL provided for API request');
      return null;
    }

    try {
      setError(null);
      setIsLoading(true);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(user ? { 'Authorization': `Bearer ${user.uid}` } : {}),
          ...headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `Error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const responseData: T = await response.json();
      
      if (showSuccessToast) {
        toast({
          title: 'Success',
          description: successMessage,
        });
      }
      
      return responseData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      if (showErrorToast) {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      console.error('API request failed:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  return {
    apiRequest,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
