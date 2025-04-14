import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTravelMode } from "@/contexts/TravelModeContext";
import { ChatState, Message, OnboardingStep } from "./types";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabase";
import { ChatMessageService } from "@/services/ChatMessageService";

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "name",
    question: "What's your name?",
    field: "name",
    required: true,
  },
  {
    id: "country",
    question: "Which country are you from?",
    field: "country",
    required: true,
  },
  {
    id: "currency",
    question: "What currency do you use?",
    field: "currency",
    required: true,
  },
  {
    id: "telegram_id",
    question: "What's your Telegram ID? (optional)",
    field: "telegram_id",
    required: false,
  },
];

export function useChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { travelMode } = useTravelMode(); // Add travel mode context
  const [state, setState] = useState<ChatState>({
    messages: [],
    isRecording: false,
    isProcessing: false,
    onboardingData: {},
    currentStep: 0,
    showOnboarding: false,
  });
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Cache for auth token to prevent excessive auth requests
  const authTokenRef = useRef<string | null>(null);
  // Reference to the chat service to avoid recreating it for each operation
  const chatServiceRef = useRef<ChatMessageService | null>(null);
  // Track total message count for pagination
  const totalMessageCountRef = useRef<number>(0);
  // Set to prevent duplicate message sends
  const recentlySentMessages = useRef<Map<string, number>>(new Map());

  // Get or create chat service with cached auth token
  const getChatService = useCallback(async () => {
    try {
      if (!authTokenRef.current) {
        const { data: { session } } = await supabase.auth.getSession();
        authTokenRef.current = session?.access_token || null;
      }

      if (!chatServiceRef.current && authTokenRef.current) {
        chatServiceRef.current = new ChatMessageService(authTokenRef.current);
      }

      return chatServiceRef.current;
    } catch (error) {
      console.error("Error getting chat service:", error);
      return null;
    }
  }, []);

  // Load initial chat messages
  useEffect(() => {
    let isMounted = true;
    let isLoadingStarted = false;

    async function loadInitialMessages() {
      if (isLoadingStarted) return;
      isLoadingStarted = true;

      console.log("@@@ LOADING INITIAL MESSAGES");
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const chatService = await getChatService();
        if (!chatService) {
          throw new Error("Failed to initialize chat service");
        }

        const totalCount = await chatService.getMessageCount(user.id);
        totalMessageCountRef.current = totalCount;

        const messages = await chatService.getMessages(user.id, 10);

        if (isMounted) {
          // Create a map to ensure no duplicate IDs in the initial load
          const messageIdMap = new Map();
          
          // Process messages to ensure unique IDs
          const uniqueMessages = messages.map(message => {
            // If we've seen this ID before, create a new unique ID
            if (messageIdMap.has(message.id)) {
              return {
                ...message,
                id: `${message.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
              };
            }
            
            // Otherwise, mark this ID as seen and return the original message
            messageIdMap.set(message.id, true);
            return message;
          });
          
          setState(prev => ({
            ...prev,
            messages: uniqueMessages,
          }));

          setHasMoreMessages(uniqueMessages.length < totalCount);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        if (isMounted) {
          toast({
            title: "Error",
            description: "Failed to load chat history. Please try refreshing the page.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    recentlySentMessages.current.clear();

    loadInitialMessages();

    return () => {
      isMounted = false;
    };
  }, [user, toast, getChatService]);

  // Function to load more messages (called when scrolling up)
  const loadMoreMessages = useCallback(async () => {
    if (!user || isLoadingMore || !hasMoreMessages) {
      console.log("Cannot load more messages:", { user: !!user, isLoadingMore, hasMoreMessages });
      return;
    }

    setIsLoadingMore(true);
    console.log("Loading more messages...");

    try {
      const chatService = await getChatService();
      if (!chatService) {
        throw new Error("Failed to initialize chat service");
      }

      const oldestTimestamp = state.messages.length > 0
        ? state.messages[0].timestamp
        : null;

      console.log("Oldest timestamp:", oldestTimestamp);

      const olderMessages = await chatService.getMessages(
        user.id,
        10,
        oldestTimestamp || undefined
      );

      console.log(`Fetched ${olderMessages.length} older messages`);

      if (olderMessages.length > 0) {
        // Create a Map of existing message IDs for fast lookup
        const existingIds = new Set(state.messages.map(msg => msg.id));
        
        // Ensure each message has a truly unique ID
        const uniqueOlderMessages = olderMessages.map(message => {
          // If ID already exists in our current state, generate a new one
          if (existingIds.has(message.id)) {
            return {
              ...message,
              id: `${message.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
            };
          }
          return message;
        });
        
        setState(prev => ({
          ...prev,
          messages: [...uniqueOlderMessages, ...prev.messages],
        }));

        const currentTotalMessages = state.messages.length + uniqueOlderMessages.length;
        setHasMoreMessages(currentTotalMessages < totalMessageCountRef.current);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
      toast({
        title: "Error",
        description: "Failed to load more messages.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [user, isLoadingMore, hasMoreMessages, getChatService, toast, state.messages]);

  // Reset auth token on user change
  useEffect(() => {
    authTokenRef.current = null;
    chatServiceRef.current = null;
  }, [user]);

  const addMessage = useCallback(async (message: Omit<Message, "id" | "timestamp">) => {
    if (!user) return;

    const contentKey = `${message.role}:${message.content}`;
    const now = Date.now();
    const recentSendTime = recentlySentMessages.current.get(contentKey);

    if (recentSendTime && now - recentSendTime < 5000) {
      console.log("Preventing duplicate message send:", message.content);
      return;
    }

    recentlySentMessages.current.set(contentKey, now);

    for (const [key, timestamp] of recentlySentMessages.current.entries()) {
      if (now - timestamp > 10000) {
        recentlySentMessages.current.delete(key);
      }
    }

    const newMessage = {
      ...message,
      id: uuidv4(),
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage],
    }));

    try {
      const chatService = await getChatService();
      if (!chatService) {
        throw new Error("Failed to initialize chat service");
      }

      const savedMessage = await chatService.saveMessage(newMessage, user.id);

      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === newMessage.id ? savedMessage : msg
        ),
      }));

      totalMessageCountRef.current += 1;
    } catch (error) {
      console.error("Error saving message:", error);
      toast({
        title: "Error",
        description: "Failed to save message. Your changes may not be persisted.",
        variant: "destructive",
      });
    }
  }, [user, toast, getChatService]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      await addMessage({
        content,
        role: "user",
      });

      if (!user) {
        await addMessage({
          content: "Please log in to continue using the chat.",
          role: "assistant",
          action: "onboarding",
        });
        setShowLoginDialog(true);
        return;
      }

      const chatService = await getChatService();
      if (!chatService) {
        throw new Error("Failed to initialize chat service");
      }

      const response = await fetch("/api/messages/web", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authTokenRef.current}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          message: content,
          currency: user.currency || "USD", // Pass user's currency preference
          travel_mode: travelMode, // Pass travel mode context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      const data = await response.json();

      await addMessage({
        content: data.message || data.reply,
        role: "assistant",
        action: data.action,
        expense: data.expense,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [user, addMessage, toast, setShowLoginDialog, getChatService, travelMode]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to upload files.",
        variant: "destructive",
      });
      setShowLoginDialog(true);
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      const previewUrl = URL.createObjectURL(file);

      await addMessage({
        content: "Sent an attachment",
        role: "user",
        attachmentUrl: previewUrl,
      });

      const chatService = await getChatService();
      if (!chatService) {
        throw new Error("Failed to initialize chat service");
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64Data = reader.result as string;

        const response = await fetch("/api/messages/web", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authTokenRef.current}`,
          },
          body: JSON.stringify({
            user_id: user.id,
            file: base64Data,
            currency: user.currency || "USD", // Pass user's currency preference
            travel_mode: travelMode, // Pass travel mode context
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to process file");
        }

        const data = await response.json();

        await addMessage({
          content: data.message || data.reply,
          role: "assistant",
          action: data.action,
          expense: data.expense,
        });
      };
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [user, addMessage, toast, setShowLoginDialog, getChatService, travelMode]);

  const handleOnboardingSubmit = useCallback((field: string, value: string) => {
    setState(prev => {
      const newStepIndex = field ? prev.currentStep + 1 : 0;
      const isWithinBounds = newStepIndex < ONBOARDING_STEPS.length;

      return {
        ...prev,
        onboardingData: {
          ...prev.onboardingData,
          ...(field ? { [field]: value } : {}),
        },
        currentStep: isWithinBounds ? newStepIndex : 0,
        showOnboarding: isWithinBounds,
      };
    });
  }, []);

  const toggleRecording = useCallback(() => {
    setState(prev => ({ ...prev, isRecording: !prev.isRecording }));
  }, []);

  const updateMessageInState = useCallback((updatedMessage: Message) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg =>
        msg.id === updatedMessage.id ? updatedMessage : msg
      ),
    }));
  }, []);

  return {
    state,
    addMessage,
    handleSendMessage,
    handleFileUpload,
    handleOnboardingSubmit,
    toggleRecording,
    ONBOARDING_STEPS,
    showLoginDialog,
    setShowLoginDialog,
    isLoading,
    isLoadingMore,
    hasMoreMessages,
    loadMoreMessages,
    updateMessageInState,
    getChatService,
  };
}