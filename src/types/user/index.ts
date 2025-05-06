// src/types/user/index.ts
/**
 * User profile information
 */
export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  country?: string;
  currency?: string;
  telegram_id?: string;
  created_at?: string;
}

/**
 * User profile service interface
 */
export interface UserProfileService {
  getProfile(userId: string): Promise<UserProfile | null>;
  updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile>;
  createProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile>;
}

/**
 * Onboarding step data
 */
export interface OnboardingStep {
  id: string;
  question: string;
  field: "name" | "country" | "currency" | "telegram_id";
  required: boolean;
}