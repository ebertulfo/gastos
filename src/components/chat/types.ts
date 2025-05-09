import { Expense } from "@/schemas/expense";

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  action?: "onboarding" | "expense" | "query";
  field?: string;
  attachmentUrl?: string;
  expense?: Expense;
}

export type OnboardingStep = {
  id: string;
  question: string;
  field: "name" | "country" | "currency";
  required: boolean;
};

export interface ChatState {
  messages: Message[];
  isRecording: boolean;
  isProcessing: boolean;
  onboardingData: {
    name?: string;
    country?: string;
    currency?: string;
  };
  currentStep: number;
  showOnboarding: boolean;
  // pagination: {
  //   page: number;
  //   hasMore: boolean;
  //   isLoadingMore: boolean;
  // };
}