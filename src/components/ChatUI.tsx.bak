"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, PaperclipIcon, Send, User, Bot as BotIcon, Camera, Edit2, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CountryCodeCombobox } from "@/components/ui/country-code-select";
import { CurrencyCodeCombobox } from "@/components/ui/currency-code-select";
import { supabase } from "@/lib/supabase";
import { LoginDialog } from "@/components/LoginDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { EditExpenseDialog } from "@/components/EditExpenseDialog";

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  currency: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  action?: "onboarding";
  field?: string;
  attachmentUrl?: string;
  expense?: Expense;
}

type OnboardingStep = {
  id: string;
  question: string;
  field: "name" | "country" | "currency" | "telegram_id";
  required: boolean;
};

export function ChatUI() {
  const { user, updateLoggedInUser } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [onboardingData, setOnboardingData] = useState<{
    name: string;
    country: string;
    currency: string;
    telegram_id: string;
  }>({
    name: "",
    country: "",
    currency: "",
    telegram_id: "",
  });
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState<number>(0);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const onboardingSteps: OnboardingStep[] = [
    {
      id: "name",
      question: "What should we call you?",
      field: "name",
      required: true,
    },
    {
      id: "country",
      question: "Where are you from?",
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
      question: "What's your Telegram ID? (Optional - you can connect this later)",
      field: "telegram_id",
      required: false,
    },
  ];

  // Initialize chat and check if onboarding is needed
  useEffect(() => {
    // Initial welcome message
    const welcomeMessage: Message = {
      id: "welcome",
      content: "Hi there! I'm your expense tracking assistant. You can tell me about your expenses or ask me questions about your spending.",
      role: "assistant" as const,
      timestamp: new Date(),
    };
    
    setMessages([welcomeMessage]);

    // Check if user needs onboarding
    if (user && !user.is_onboarded && !isOnboarding && !onboardingComplete) {
      startOnboarding();
    }

    // Load any existing onboarding data from localStorage as a fallback
    const name = localStorage.getItem("name");
    const country = localStorage.getItem("country");
    const currency = localStorage.getItem("currency");
    const telegram_id = localStorage.getItem("telegram_id");

    if (name || country || currency || telegram_id) {
      setOnboardingData({
        name: name || "",
        country: country || "",
        currency: currency || "",
        telegram_id: telegram_id || "",
      });
    }

    // Attempt to detect country and currency if not set
    if (!country || !currency) {
      const detectCountryAndCurrency = async () => {
        try {
          const response = await fetch("https://ipapi.co/json/");
          const data = await response.json();
          if (!country) {
            setOnboardingData(prev => ({
              ...prev,
              country: data.country_name,
            }));
            localStorage.setItem("country", data.country_name);
          }
          if (!currency) {
            setOnboardingData(prev => ({
              ...prev,
              currency: data.currency,
            }));
            localStorage.setItem("currency", data.currency);
          }
        } catch (error) {
          console.error("Failed to detect country and currency", error);
        }
      };

      detectCountryAndCurrency();
    }
  }, [user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startOnboarding = () => {
    setIsOnboarding(true);
    setCurrentOnboardingStep(0);
    
    // Add intro onboarding message
    const onboardingIntro: Message = {
      id: `onboarding-intro`,
      content: "Before we start tracking expenses, I need to know a few details about you. Let's get you set up!",
      role: "assistant",
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, onboardingIntro]);
    
    // Show first onboarding question
    setTimeout(() => {
      const firstStep = onboardingSteps[0];
      const firstQuestion: Message = {
        id: `onboarding-${firstStep.id}`,
        content: firstStep.question,
        role: "assistant",
        timestamp: new Date(),
        action: "onboarding",
        field: firstStep.field,
      };
      
      setMessages(prev => [...prev, firstQuestion]);
    }, 500);
  };

  const proceedToNextOnboardingStep = () => {
    const nextStep = currentOnboardingStep + 1;
    
    if (nextStep >= onboardingSteps.length) {
      // We've reached the end of onboarding
      completeOnboarding();
      return;
    }
    
    setCurrentOnboardingStep(nextStep);
    const step = onboardingSteps[nextStep];
    
    // Add the next question
    const question: Message = {
      id: `onboarding-${step.id}`,
      content: step.question,
      role: "assistant",
      timestamp: new Date(),
      action: "onboarding",
      field: step.field,
    };
    
    // If we already have a value (from auto-detection), suggest it
    if (step.field === 'country' && onboardingData.country) {
      question.content += ` I detected ${onboardingData.country}. Is that correct?`;
    } else if (step.field === 'currency' && onboardingData.currency) {
      question.content += ` I detected ${onboardingData.currency}. Is that correct?`;
    }
    
    setMessages(prev => [...prev, question]);
  };

  const handleOnboardingResponse = (field: string, value: string) => {
    // Update onboarding data
    setOnboardingData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Save to localStorage as backup
    localStorage.setItem(field, value);
    
    // Show user's response in chat
    const userResponse: Message = {
      id: `onboarding-response-${field}`,
      content: value,
      role: "user",
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userResponse]);
    
    // Proceed to next question after a short delay
    setTimeout(() => {
      proceedToNextOnboardingStep();
    }, 500);
  };

  const completeOnboarding = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to complete onboarding",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Update the user's profile in Supabase
      const { error } = await supabase
        .from("user_profiles")
        .upsert({
          id: user.id,
          full_name: onboardingData.name,
          country: onboardingData.country,
          currency: onboardingData.currency,
          telegram_id: onboardingData.telegram_id || null,
          is_onboarded: true,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      // Update the user object in context
      updateLoggedInUser({
        ...user,
        is_onboarded: true,
      });

      // Add completion message
      const completionMessage: Message = {
        id: "onboarding-complete",
        content: `Thanks ${onboardingData.name}! Your profile has been set up. You can now start tracking your expenses in ${onboardingData.currency}!`,
        role: "assistant",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, completionMessage]);
      setIsOnboarding(false);
      setOnboardingComplete(true);
      
      // Add a help message after a delay
      setTimeout(() => {
        const helpMessage: Message = {
          id: "help-after-onboarding",
          content: "Try logging an expense like 'I spent $25 on lunch yesterday' or ask me 'How much have I spent this month?'",
          role: "assistant",
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, helpMessage]);
      }, 1000);
      
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
      
      // Add error message
      const errorMessage: Message = {
        id: "onboarding-error",
        content: "There was an error saving your profile. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserAuthentication = () => {
    if (!user) {
      setIsLoginDialogOpen(true);
      return false;
    }
    return true;
  };

  const handleSendMessage = async () => {
    // If we're in onboarding mode, treat this as an onboarding response
    if (isOnboarding && currentOnboardingStep < onboardingSteps.length) {
      const currentField = onboardingSteps[currentOnboardingStep].field;
      handleOnboardingResponse(currentField, input);
      setInput("");
      return;
    }
    
    if (!input.trim() && recordedChunks.length === 0) return;
    
    // Check if user is authenticated
    if (!checkUserAuthentication()) {
      return;
    }
    
    // Normal message handling as before
    const messageId = Date.now().toString();
    const userMessage: Message = {
      id: messageId,
      content: input,
      role: "user",
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      // Get the session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;
      
      // Prepare form data for the API request
      const formData = new FormData();
      formData.append("message", input);
      
      if (recordedChunks.length > 0) {
        const audioBlob = new Blob(recordedChunks, { type: "audio/webm" });
        formData.append("file", audioBlob, "recording.webm");
      }
      
      // Call the web-specific API endpoint
      const response = await fetch("/api/messages/web", {
        method: "POST",
        body: JSON.stringify({
          user_id: user?.id || "",
          message: input,
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const botResponse: Message = {
          id: Date.now().toString(),
          content: data.message,
          role: "assistant",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botResponse]);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to get a response",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setRecordedChunks([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startRecording = async () => {
    if (!checkUserAuthentication()) {
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        setRecordedChunks(chunks);
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
        
        toast({
          title: "Recording Complete",
          description: "Your voice message is ready to send",
        });
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak now to record your expense",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!checkUserAuthentication()) {
      return;
    }
    
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      // Create a preview URL for the image
      const previewUrl = URL.createObjectURL(file);
      
      // Add user message with attachment
      const messageId = Date.now().toString();
      const userMessage: Message = {
        id: messageId,
        content: "Uploaded image",
        role: "user",
        timestamp: new Date(),
        attachmentUrl: previewUrl,
      };
      
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      
      // Get the session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;
      
      // Convert file to base64 for API
      const reader = new FileReader();
      reader.onload = async () => {
        const base64File = reader.result;
        
        // Call the web-specific API endpoint with the file
        const response = await fetch("/api/messages/web", {
          method: "POST",
          body: JSON.stringify({
            user_id: user?.id || "",
            message: "",
            file: base64File,
          }),
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
        });
        
        const data = await response.json();
        
        const botResponse: Message = {
          id: Date.now().toString(),
          content: data.message || "I've processed your receipt and logged the expense.",
          role: "assistant",
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, botResponse]);
        setIsLoading(false);
      };
      
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Error",
        description: "Failed to process the file",
        variant: "destructive",
      });
      setIsLoading(false);
    }
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCameraCapture = async () => {
    if (!checkUserAuthentication()) {
      return;
    }
    
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleEditExpense = async (expense: Expense) => {
    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expense),
      });

      if (!response.ok) {
        throw new Error("Failed to update expense");
      }

      // Update the message in the chat
      setMessages(prev =>
        prev.map(msg =>
          msg.expense?.id === expense.id
            ? {
                ...msg,
                expense,
                content: `Updated expense: ${expense.amount} ${expense.currency} for ${expense.description} (${expense.category}) on ${new Date(expense.date).toLocaleDateString()}`,
              }
            : msg
        )
      );

      toast({
        title: "Success",
        description: "Expense updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating expense:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update expense",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete expense");
      }

      // Remove the message from the chat
      setMessages(prev => prev.filter(msg => msg.expense?.id !== expenseId));

      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  const renderMessageContent = (message: Message) => {
    if (message.action === "onboarding" && message.field) {
      // For country selection
      if (message.field === "country") {
        return (
          <div className="space-y-2">
            <div>{message.content}</div>
            <CountryCodeCombobox 
              value={onboardingData.country}
              onChange={(value) => handleOnboardingResponse("country", value)}
              className="mt-2"
            />
          </div>
        );
      }
      
      // For currency selection
      if (message.field === "currency") {
        return (
          <div className="space-y-2">
            <div>{message.content}</div>
            <CurrencyCodeCombobox 
              value={onboardingData.currency}
              onChange={(value) => handleOnboardingResponse("currency", value)}
              className="mt-2"
            />
          </div>
        );
      }
    }

    // For expense messages
    if (message.expense) {
      const expense = message.expense;
      return (
        <div className="space-y-2">
          <div className="text-sm">{message.content}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => setEditingExpense(expense)}
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this expense? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      );
    }
    
    // Default message rendering
    return (
      <div className="text-sm">{message.content}</div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      {/* Login Dialog */}
      <LoginDialog 
        isOpen={isLoginDialogOpen} 
        onClose={() => setIsLoginDialogOpen(false)} 
      />
      
      {/* Edit Expense Dialog */}
      <EditExpenseDialog
        expense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onSave={handleEditExpense}
      />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <Card
              className={`max-w-[80%] p-3 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="mt-1">
                  {message.role === "user" ? (
                    <User className="h-5 w-5" />
                  ) : (
                    <BotIcon className="h-5 w-5" />
                  )}
                </div>
                <div className="space-y-2">
                  {message.attachmentUrl && (
                    <div className="rounded-md overflow-hidden max-w-xs">
                      <img
                        src={message.attachmentUrl}
                        alt="Attachment"
                        className="max-w-full h-auto"
                      />
                    </div>
                  )}
                  {renderMessageContent(message)}
                  <div className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <Card className="max-w-[80%] p-3 bg-muted">
              <div className="flex items-center gap-2">
                <BotIcon className="h-5 w-5" />
                <div className="text-sm">Thinking...</div>
              </div>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (checkUserAuthentication()) {
                fileInputRef.current?.click();
              }
            }}
            type="button"
            disabled={isOnboarding}
          >
            <PaperclipIcon className="h-5 w-5" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (checkUserAuthentication()) {
                handleCameraCapture();
              }
            }}
            type="button"
            disabled={isOnboarding}
          >
            <Camera className="h-5 w-5" />
          </Button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />
          
          <Button
            variant="outline"
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            type="button"
            className={isRecording ? "bg-red-100" : ""}
            disabled={isOnboarding}
          >
            {isRecording ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
          
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isOnboarding ? "Type your response..." : "Type your message..."}
            disabled={isLoading}
            className="flex-1"
          />
          
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || (!input.trim() && recordedChunks.length === 0)}
            type="button"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        {recordedChunks.length > 0 && (
          <div className="mt-2 text-sm text-muted-foreground">
            Voice recording ready to send
          </div>
        )}
      </div>
    </div>
  );
}