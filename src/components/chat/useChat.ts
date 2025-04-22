import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTravelMode } from "@/contexts/TravelModeContext";
import { ChatState, Message, OnboardingStep } from "./types";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabase";
import { ChatMessageService } from "@/services/ChatMessageService";

// Welcome messages for non-logged in users
const GUEST_WELCOME_MESSAGES: Omit<Message, "id" | "timestamp">[] = [
  {
    content: "👋 Welcome to Gastos - Track Your Spending, Effortlessly!",
    role: "assistant",
  },
  {
    content: "Simple, intuitive expense tracking with powerful insights. Keep your finances in check from anywhere, anytime.",
    role: "assistant",
  },
  {
    content: "With Gastos, you can:\n• See where your money goes with intuitive charts\n• Log expenses with our conversational AI assistant\n• Track in multiple currencies\n• Automatically categorize your spending\n• Access from any device",
    role: "assistant",
  },
  {
    content: "Login or sign up to get started tracking your expenses today!",
    role: "assistant",
    action: "onboarding",
  }
];

// Welcome messages for logged-in users with no chat history
const LOGGED_IN_WELCOME_MESSAGES: Omit<Message, "id" | "timestamp">[] = [
  {
    content: "👋 Welcome to Gastos! Let's start tracking your expenses.",
    role: "assistant",
  },
  {
    content: "You can:\n• Add a new expense by typing something like \"I spent $25 on lunch today\"\n• Upload a receipt photo to automatically log an expense\n• Ask to see a summary of your spending",
    role: "assistant",
  },
  {
    content: "What would you like to track today?",
    role: "assistant",
  }
];

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
  const welcomeMessagesShownRef = useRef(false);

  // Cache for auth token to prevent excessive auth requests
  const authTokenRef = useRef<string | null>(null);
  // Reference to the chat service to avoid recreating it for each operation
  const chatServiceRef = useRef<ChatMessageService | null>(null);
  // Track current offset for pagination
  const currentOffsetRef = useRef<number>(0);
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
        chatServiceRef.current = new ChatMessageService();
      }

      return chatServiceRef.current;
    } catch (error) {
      console.error("Error getting chat service:", error);
      return null;
    }
  }, []);

  // Show welcome messages for non-logged in users or users with no messages
  const showWelcomeMessages = useCallback(async () => {
    if (welcomeMessagesShownRef.current) return;
    
    // Set welcome messages with a delay between each one
    welcomeMessagesShownRef.current = true;
    console.log("Showing welcome messages");
    const delayBetweenMessages = 500;

    const messagesToShow = user ? LOGGED_IN_WELCOME_MESSAGES : GUEST_WELCOME_MESSAGES;

    for (let i = 0; i < messagesToShow.length; i++) {
      const message = messagesToShow[i];
      const newMessage = {
        ...message,
        id: uuidv4(),
        timestamp: new Date(),
      };

      // Add a delay between messages for better reading experience
      await new Promise(resolve => setTimeout(resolve, i * delayBetweenMessages));
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, { ...newMessage, role: newMessage.role as "user" | "assistant" }],
      }));
    }
  }, [user]);

  // Load initial chat messages
  useEffect(() => {
    let isMounted = true;
    let isLoadingStarted = false;

    async function loadInitialMessages() {
      if (isLoadingStarted) return;
      isLoadingStarted = true;

      console.log("@@@ LOADING INITIAL MESSAGES");
      if (!user) {
        // Show welcome messages for non-logged in users
        showWelcomeMessages();
        setIsLoading(false);
        return;
      } else {
        try {
          const chatService = await getChatService();
          if (!chatService) {
            throw new Error("Failed to initialize chat service");
          }
  
          const totalCount = await chatService.getMessageCount(user.uid);
          totalMessageCountRef.current = totalCount;
          
          // Reset offset to 0 for initial load
          currentOffsetRef.current = 0;
  
          const messages = await chatService.getMessages(user.uid, 10, currentOffsetRef.current);
          
          if (messages.length > 0) {
            // Update offset after successful load
            currentOffsetRef.current += messages.length;
            
            if (isMounted) {
              setState(prev => ({
                ...prev,
                messages: messages,
              }));
              
              setHasMoreMessages(currentOffsetRef.current < totalCount);
            }
          } else {
            // If user is logged in but has no messages, show welcome messages
            // BUT only if they haven't already been shown
            if (!welcomeMessagesShownRef.current) {
              showWelcomeMessages();
            }
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

      
    }

    recentlySentMessages.current.clear();
    
    // Always run loadInitialMessages on first mount or user change
    loadInitialMessages();

    return () => {
      isMounted = false;
    };
  }, [user, toast, getChatService, showWelcomeMessages]);

  // Function to load more messages (called when scrolling up)
  const loadMoreMessages = useCallback(async () => {
    if (!user || isLoadingMore || !hasMoreMessages) {
      console.log("Cannot load more messages:", { user: !!user, isLoadingMore, hasMoreMessages });
      return;
    }

    setIsLoadingMore(true);
    console.log("Loading more messages with offset:", currentOffsetRef.current);

    try {
      const chatService = await getChatService();
      if (!chatService) {
        throw new Error("Failed to initialize chat service");
      }

      const olderMessages = await chatService.getMessages(
        user.uid,
        10,
        currentOffsetRef.current
      );

      console.log(`Fetched ${olderMessages.length} older messages`);

      if (olderMessages.length > 0) {
        // Update offset after successful load
        currentOffsetRef.current += olderMessages.length;
        
        setState(prev => ({
          ...prev,
          messages: [...olderMessages, ...prev.messages],
        }));

        setHasMoreMessages(currentOffsetRef.current < totalMessageCountRef.current);
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
  }, [user, isLoadingMore, hasMoreMessages, getChatService, toast]);

  // Reset auth token on user change
  useEffect(() => {
    authTokenRef.current = null;
    chatServiceRef.current = null;
    currentOffsetRef.current = 0;
    // Reset welcome messages shown status when user changes
    welcomeMessagesShownRef.current = false;
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
      messages: [...prev.messages, {...newMessage, role: newMessage.role as "user" | "assistant"}],
    }));

    try {
      const chatService = await getChatService();
      if (!chatService) {
        throw new Error("Failed to initialize chat service");
      }

      const savedMessage = await chatService.saveMessage(newMessage, user.uid);

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
      // For non-logged in users who try to send a message
      if (!user) {
        // Only add the user's message to the UI
        const newMessage = {
          content,
          role: "user",
          id: uuidv4(),
          timestamp: new Date(),
        };
        
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, {...newMessage, role: newMessage.role as "user" | "assistant"}],
        }));
        
        // Don't show another welcome message if we've already shown them
        if (!welcomeMessagesShownRef.current) {
          // Show the login prompt only
          const loginPrompt = {
            content: "Please log in to continue using the chat.",
            role: "assistant",
            action: "onboarding" as const,
            id: uuidv4(),
            timestamp: new Date(),
          };
          
          setState(prev => ({
            ...prev, 
            messages: [...prev.messages, loginPrompt as Message]
          }));
          welcomeMessagesShownRef.current = true;
        }
        
        setShowLoginDialog(true);
        setState(prev => ({ ...prev, isProcessing: false }));
        return;
      }

      // Normal flow for logged-in users
      await addMessage({
        content,
        role: "user",
      });

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
          user_id: user.uid,
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
            user_id: user.uid,
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