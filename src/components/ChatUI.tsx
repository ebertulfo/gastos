import { useChat } from "./chat/useChat";
import { MessageList } from "./chat/MessageList";
import { ChatInput } from "./chat/ChatInput";
import { OnboardingDialog } from "./chat/OnboardingDialog";
import { LoginDialog } from "./LoginDialog";
import { Loader2 } from "lucide-react";
import { useCallback } from "react";
import { Message } from "./chat/types";

export function ChatUI() {
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
    deleteMessage,
  } = useChat();

  const handleOnboardingClose = () => {
    // If dialog is closed, mark onboarding as complete
    handleOnboardingSubmit("", "");
  };

  // Get the current onboarding step safely
  const currentStep = state.currentStep < ONBOARDING_STEPS.length 
    ? ONBOARDING_STEPS[state.currentStep] 
    : undefined;

  // Handle clicks on messages that should open the login dialog
  const handleMessageClick = useCallback((message: Message) => {
    if (message.action === "onboarding") {
      setShowLoginDialog(true);
    }
  }, [setShowLoginDialog]);

  return (
    <div className="flex flex-col h-full w-full max-w-[640px] mx-auto px-4 md:px-0">
      {isLoading ? (
        <div className="flex items-center justify-center h-full w-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex-grow overflow-hidden">
            <MessageList 
              messages={state.messages} 
              updateMessageInState={updateMessageInState}
              getChatService={getChatService}
              hasMoreMessages={hasMoreMessages}
              isLoadingMore={isLoadingMore}
              loadMoreMessages={loadMoreMessages}
              isProcessing={state.isProcessing}
              onMessageClick={handleMessageClick}
              deleteMessage={deleteMessage}
            />
          </div>
          <div className="flex-shrink-0 bg-background border-t shadow-sm">
            <ChatInput
              onSendMessage={handleSendMessage}
              onFileUpload={handleFileUpload}
              isRecording={state.isRecording}
              onToggleRecording={toggleRecording}
              isProcessing={state.isProcessing}
            />
          </div>
        </div>
      )}
      
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