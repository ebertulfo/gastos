import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTravelMode } from "@/contexts/TravelModeContext";
import { useExpenseRefresh } from "@/contexts/ExpenseContext";
import { ChatState, Message, OnboardingStep } from "./types";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabase";
import { ChatMessageService } from "@/services/ChatMessageService";

// Welcome messages for non-logged in users
const GUEST_WELCOME_MESSAGES: Omit<Message, "id" | "timestamp">[] = [
  {
    content: "👋 Welcome to Gastos!",
    role: "assistant",
  },
  {
    content: "Track your spending effortlessly. Just type what you spent, like \"5 SGD for lunch\" and we'll handle the rest.",
    role: "assistant",
  },
  {
    content: "Sign in to get started.",
    role: "assistant",
    action: "onboarding",
  }
];

// Welcome messages for logged-in users with no chat history
const LOGGED_IN_WELCOME_MESSAGES: Omit<Message, "id" | "timestamp">[] = [
  {
    content: "👋 Welcome to Gastos!",
    role: "assistant",
  },
  {
    content: "Just type what you spent, like \"25 for lunch\" or \"taxi 15 SGD\". I'll log it for you.",
    role: "assistant",
  },
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
];

export function useChat() {
  const { user, updateLoggedInUser } = useAuth();
  const { toast } = useToast();
  const { travelMode } = useTravelMode(); // Add travel mode context
  const { refreshExpenses } = useExpenseRefresh();
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
  const [hasMoreMessages, setHasMoreMessages] = useState(false); // Initialize to false by default
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
          // Check if user needs onboarding and show the dialog
          if (user && user.is_onboarded === false) {
            setState(prev => ({
              ...prev,
              showOnboarding: true
            }));
          }
          
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
              
              // Only set hasMoreMessages to true if there are more messages to load
              setHasMoreMessages(currentOffsetRef.current < totalMessageCountRef.current);
            }
          } else {
            // If user is logged in but has no messages, show welcome messages
            // BUT only if they haven't already been shown
            if (!welcomeMessagesShownRef.current) {
              showWelcomeMessages();
            }
            // Ensure hasMoreMessages is false when there are no messages
            setHasMoreMessages(false);
          }
        } catch (error) {
          console.error("Error loading messages:", error);
          if (isMounted) {
            toast({
              title: "Something went wrong",
              description: "Couldn't load your messages. Try refreshing the page.",
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
        title: "Something went wrong",
        description: "Couldn't load older messages. Try again in a moment.",
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
    // Also reset hasMoreMessages when user changes
    setHasMoreMessages(false);
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
        title: "Something went wrong",
        description: "Couldn't save your message. Your changes may not be saved.",
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

      // If an expense was created, refresh the expense data
      if (data.expense) {
        refreshExpenses();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Something went wrong",
        description: error instanceof Error ? error.message : "Couldn't send your message. Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [user, addMessage, toast, setShowLoginDialog, getChatService, travelMode]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to upload files.",
        variant: "destructive",
      });
      setShowLoginDialog(true);
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      const previewUrl = URL.createObjectURL(file);

      // Add user's message with the attachment
      await addMessage({
        content: "Uploaded image", // Change from "Processing receipt..." to just "Uploaded image"
        role: "user",
        attachmentUrl: previewUrl,
      });

      /* OCR processing temporarily disabled
      const chatService = await getChatService();
      if (!chatService) {
        throw new Error("Failed to initialize chat service");
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64Data = reader.result as string;

        try {
          const response = await fetch("/api/messages/web", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${authTokenRef.current}`,
            },
            body: JSON.stringify({
              user_id: user.uid,
              file: base64Data,
              currency: user.currency || "USD",
              travel_mode: travelMode,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to process receipt");
          }

          const data = await response.json();

          // Add the assistant's response
          await addMessage({
            content: data.message || data.reply,
            role: "assistant",
            action: data.action,
            expense: data.expense,
          });

          // If an expense was created, refresh the expense data
          if (data.expense) {
            refreshExpenses();
          }
        } catch (error) {
          console.error("Error processing file:", error);
          
          // Add an error message from assistant
          await addMessage({
            content: error instanceof Error 
              ? `Error: ${error.message}` 
              : "Failed to process the receipt. Please try again or manually enter the expense details.",
            role: "assistant",
          });
          
          toast({
            title: "Error",
            description: error instanceof Error 
              ? error.message 
              : "Failed to process receipt. Please try again.",
            variant: "destructive",
          });
        }
      };

      reader.onerror = async () => {
        // Handle file reading errors
        await addMessage({
          content: "Failed to read the file. Please try again with a different image.",
          role: "assistant",
        });
        
        toast({
          title: "Error",
          description: "Failed to read the image file.",
          variant: "destructive",
        });
      };
      */
      
      // Add a placeholder message instead of OCR processing
      await addMessage({
        content: "OCR processing is temporarily disabled. Please enter expense details manually.",
        role: "assistant",
      });
      
    } catch (error) {
      console.error("Error processing file:", error);
      
      // Add an error message from assistant
      await addMessage({
        content: "There was a problem with your file upload. OCR processing is currently disabled.",
        role: "assistant",
      });
      
      toast({
        title: "Notice",
        description: "OCR processing is temporarily disabled. Please enter expense details manually.",
      });
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [user, addMessage, toast, setShowLoginDialog]);

  const handleOnboardingSubmit = useCallback(async (field: string, value: string) => {
    setState(prev => {
      const newStepIndex = field ? prev.currentStep + 1 : 0;
      const isWithinBounds = newStepIndex < ONBOARDING_STEPS.length;

      const updatedOnboardingData = {
        ...prev.onboardingData,
        ...(field ? { [field]: value } : {})
      };

      // If we're at the last step and a field was submitted,
      // we need to update the user's profile in the database
      if (field && newStepIndex >= ONBOARDING_STEPS.length && user) {
        // Save all onboarding data to database
        (async () => {
          try {
            const { error } = await supabase
              .from("user_profiles")
              .upsert({
                id: user.uid,
                full_name: updatedOnboardingData.name,
                country: updatedOnboardingData.country,
                currency: updatedOnboardingData.currency,
                is_onboarded: true,
                updated_at: new Date().toISOString(),
              });
            
            if (error) {
              throw error;
            }

            // Update the AuthContext user state to reflect onboarding completion
            updateLoggedInUser({
              ...user,
              currency: updatedOnboardingData.currency,
              is_onboarded: true,
            });

            // Add feedback message to chat
            addMessage({
              content: `Thanks ${updatedOnboardingData.name}! Your profile has been set up. You can now start tracking your expenses.`,
              role: "assistant",
            });

            // Save preferences to localStorage as backup
            localStorage.setItem("name", updatedOnboardingData.name || "");
            localStorage.setItem("country", updatedOnboardingData.country || "");
            localStorage.setItem("currency", updatedOnboardingData.currency || "");

          } catch (error) {
            console.error("Error updating profile:", error);
            toast({
              title: "Something went wrong",
              description: "Couldn't save your profile. Try again in a moment.",
              variant: "destructive",
            });
          }
        })();
      }

      return {
        ...prev,
        onboardingData: updatedOnboardingData,
        currentStep: isWithinBounds ? newStepIndex : 0,
        showOnboarding: isWithinBounds,
      };
    });
  }, [user, updateLoggedInUser, toast, addMessage]);

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

  // Add delete message function
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user) return;

    try {
      const chatService = await getChatService();
      if (!chatService) {
        throw new Error("Failed to initialize chat service");
      }

      // Delete the message from the database
      await chatService.deleteMessage(messageId);

      // Remove the message from the UI state
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => msg.id !== messageId),
      }));

      // Update the total message count
      totalMessageCountRef.current -= 1;

      toast({
        title: "Deleted",
        description: "Message has been removed.",
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({
        title: "Something went wrong",
        description: "Couldn't delete the message. Try again in a moment.",
        variant: "destructive",
      });
    }
  }, [user, toast, getChatService]);

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
    deleteMessage, // Export the new function
  };
}