// src/types/api/index.ts
/**
 * Common API response format
 */
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Webhook payload structure
 */
export interface WebhookPayload {
  event: string;
  data: Record<string, any>;
  timestamp: string;
}

/**
 * Telegram webhook message format
 */
export interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
  };
  chat: {
    id: number;
    first_name: string;
    username?: string;
    type: string;
  };
  date: number;
  text: string;
}