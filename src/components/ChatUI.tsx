import { useState } from "react";
import { useChat } from "./chat/useChat";
import { MessageList } from "./chat/MessageList";
import { ChatInput } from "./chat/ChatInput";
import { OnboardingDialog } from "./chat/OnboardingDialog";
import { LoginDialog } from "./LoginDialog";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function ChatUI() {
  const { user } = useAuth();
  const {
    state,
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
  } = useChat();

  const handleOnboardingClose = () => {
    // If dialog is closed, mark onboarding as complete
    handleOnboardingSubmit("", "");
  };

  // Get the current onboarding step safely
  const currentStep = state.currentStep < ONBOARDING_STEPS.length 
    ? ONBOARDING_STEPS[state.currentStep] 
    : undefined;

  return (
    <div className="flex flex-col h-full">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-grow overflow-hidden flex flex-col">
          <MessageList 
            messages={state.messages} 
            updateMessageInState={updateMessageInState}
            getChatService={getChatService}
            hasMoreMessages={hasMoreMessages}
            isLoadingMore={isLoadingMore}
            loadMoreMessages={loadMoreMessages}
            isProcessing={state.isProcessing}
          />
        </div>
      )}
      <ChatInput
        onSendMessage={handleSendMessage}
        onFileUpload={handleFileUpload}
        isRecording={state.isRecording}
        onToggleRecording={toggleRecording}
        isProcessing={state.isProcessing}
      />
      
      {currentStep && (
        <OnboardingDialog
          step={currentStep}
          onSubmit={(value) => handleOnboardingSubmit(currentStep.field, value)}
          open={state.showOnboarding}
          onOpenChange={(open) => {
            if (!open) {
              handleOnboardingClose();
            }
          }}
        />
      )}
      
      <LoginDialog
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
      />
    </div>
  );
}