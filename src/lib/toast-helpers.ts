/**
 * Toast Helper Utilities
 * 
 * Brand-compliant toast functions following Gastos voice & tone guidelines:
 * - Error titles: "Something went wrong" (not "Error")
 * - Success titles: Action-specific ("Logged", "Saved", "Deleted")
 * - Descriptions: Clear, short, next-step oriented
 * 
 * @see docs/design/brand/voice-tone.md
 */

import { toast } from "@/hooks/use-toast";

/**
 * Show an error toast with brand-compliant messaging.
 * Uses "Something went wrong" as the default title per voice guidelines.
 * 
 * @param description - What went wrong and what to do next
 * @param title - Optional custom title (defaults to "Something went wrong")
 */
export function showError(
  description: string,
  title: string = "Something went wrong"
) {
  toast({
    title,
    description,
    variant: "destructive",
  });
}

/**
 * Show a success toast with an action-specific title.
 * Per voice guidelines: keep it short and calm, no confetti.
 * 
 * @param title - The action completed (e.g., "Logged", "Saved", "Deleted")
 * @param description - Optional additional context
 */
export function showSuccess(title: string, description?: string) {
  toast({
    title,
    description,
  });
}

/**
 * Common error messages following brand voice guidelines.
 * Use these for consistent messaging across the app.
 */
export const ErrorMessages = {
  SAVE_FAILED: "Couldn't save your changes. Try again in a moment.",
  DELETE_FAILED: "Couldn't remove that. Try again in a moment.",
  LOAD_FAILED: "Couldn't load the data. Try refreshing the page.",
  EXPENSE_SAVE_FAILED: "Couldn't log that expense. Try again in a moment.",
  EXPENSE_DELETE_FAILED: "Couldn't remove the expense. Try again in a moment.",
  EXPENSE_UPDATE_FAILED: "Couldn't update the expense. Try again in a moment.",
  MESSAGE_LOAD_FAILED: "Couldn't load your messages. Try refreshing the page.",
  PROFILE_LOAD_FAILED: "Couldn't load your profile. Try refreshing the page.",
  PROFILE_SAVE_FAILED: "Couldn't save your profile. Try again in a moment.",
  GENERIC: "Something went wrong. Try again in a moment.",
  NOT_AVAILABLE: "This feature isn't available right now.",
  AUTH_FAILED: "Couldn't sign you in. Try again in a moment.",
  NETWORK: "Couldn't connect. Check your internet and try again.",
} as const;

/**
 * Common success messages following brand voice guidelines.
 * Short and action-oriented.
 */
export const SuccessTitles = {
  LOGGED: "Logged",
  SAVED: "Saved",
  DELETED: "Deleted",
  UPDATED: "Updated",
  SENT: "Sent",
  PROFILE_UPDATED: "Profile updated",
  SIGNED_IN: "Signed in",
  SIGNED_OUT: "Signed out",
} as const;
