import { useRef, useEffect, useCallback, useState } from "react";
import { Message } from "./types";
import { MessageItem } from "./MessageItem";
import { ChatMessageService } from "@/services/ChatMessageService";
import { Loader2 } from "lucide-react"; // Import the loader icon

interface MessageListProps {
  messages: Message[];
  updateMessageInState: (message: Message) => void;
  getChatService: () => Promise<ChatMessageService | null>;
  hasMoreMessages: boolean;
  isLoadingMore: boolean;
  loadMoreMessages: () => Promise<void>;
  isProcessing?: boolean; // Add isProcessing prop
}

export function MessageList({ 
  messages, 
  updateMessageInState, 
  getChatService,
  hasMoreMessages,
  isLoadingMore,
  loadMoreMessages,
  isProcessing = false // Default to false
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef<number>(messages.length);
  const prevMessagesRef = useRef<Message[]>(messages);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  
  // Function to determine if new messages were added at the end
  const hasNewMessagesAtEnd = useCallback(() => {
    if (messages.length <= prevMessagesRef.current.length) return false;
    
    // If we have more messages, check if they were added at the end
    const prevLastMessage = prevMessagesRef.current[prevMessagesRef.current.length - 1];
    const currentLastMessage = messages[messages.length - 1];
    
    // If the last message is different, it means a new message was added at the end
    return prevLastMessage?.id !== currentLastMessage?.id;
  }, [messages]);
  
  // Track if older messages were loaded at the beginning
  const wereOlderMessagesLoaded = useCallback(() => {
    if (messages.length <= prevMessagesRef.current.length) return false;
    
    // If we have more messages, check if they were added at the beginning
    if (prevMessagesRef.current.length === 0) return false;
    
    const prevFirstMessage = prevMessagesRef.current[0];
    const currentFirstMessage = messages[0];
    
    // If the first message is different but the last message is the same,
    // it means older messages were loaded at the beginning
    return (
      prevFirstMessage?.id !== currentFirstMessage?.id && 
      prevMessagesRef.current.length > 0 && 
      messages.length > 0 &&
      prevMessagesRef.current[prevMessagesRef.current.length - 1]?.id === 
      messages[messages.length - 1]?.id
    );
  }, [messages]);

  // Handle scroll events - both for detecting scroll position and load more
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    // Mark that user has scrolled
    setUserHasScrolled(true);
    
    // Check if we should load more messages
    if (!isLoadingMore && hasMoreMessages && containerRef.current.scrollTop <= 50) {
      // Save the second message as reference point (more stable than first which will disappear)
      const secondMessageElement = containerRef.current.children[1] as HTMLElement;
      const referenceMessage = secondMessageElement || null;
      
      // Load more messages
      loadMoreMessages().then(() => {
        // Wait a bit for the DOM to update
        setTimeout(() => {
          // Try to find the same message element and scroll to it
          if (referenceMessage && containerRef.current) {
            referenceMessage.scrollIntoView({ block: 'start' });
          }
        }, 10);
      });
    }
    
    // Check if user has scrolled to bottom (with 100px threshold)
    const isNearBottom = 
      containerRef.current.scrollHeight - containerRef.current.scrollTop - containerRef.current.clientHeight < 100;
    
    // If user manually scrolled to bottom, we can auto-scroll again
    if (isNearBottom) {
      setShouldScrollToBottom(true);
    }
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);
  
  // Auto-scroll effect that runs when messages change
  useEffect(() => {
    // Skip if no messages
    if (messages.length === 0) {
      prevMessagesLengthRef.current = 0;
      prevMessagesRef.current = [];
      return;
    }
    
    // Detect what kind of change happened to the messages array
    const newMessagesAdded = hasNewMessagesAtEnd();
    const olderMessagesLoaded = wereOlderMessagesLoaded();
    
    if (newMessagesAdded && shouldScrollToBottom) {
      // Scroll to bottom when new messages are added AND user was already at bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } 
    else if (olderMessagesLoaded && containerRef.current) {
      // If older messages were loaded, maintain scroll position
      // We don't need to do anything here since the DOM updates naturally
      // and we already have handler in loadMoreMessages that adjusts scroll
    }
    
    // After any user scroll, stop auto-scrolling until they return to bottom
    if (userHasScrolled && !newMessagesAdded) {
      setShouldScrollToBottom(false);
    }
    
    // Update refs for next comparison
    prevMessagesLengthRef.current = messages.length;
    prevMessagesRef.current = [...messages];
  }, [messages, hasNewMessagesAtEnd, wereOlderMessagesLoaded, shouldScrollToBottom, userHasScrolled]);

  // Initial scroll to bottom only when component first mounts
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      // Use a timeout to ensure the DOM is fully rendered
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView();
      }, 300);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {/* Loading indicator when fetching more messages */}
      {isLoadingMore && (
        <div className="text-center py-2 text-sm text-muted-foreground">
          Loading older messages...
        </div>
      )}
      
      {/* Load more button as a fallback for scroll detection */}
      {hasMoreMessages && !isLoadingMore && (
        <button
          onClick={() => loadMoreMessages()}
          className="w-full text-center py-2 text-sm text-blue-500 hover:text-blue-700"
        >
          Load older messages
        </button>
      )}
      
      {/* Messages list */}
      {messages.map((message, index) => (
        <MessageItem 
          key={`${message.id}-${index}`} 
          message={message} 
          updateMessageInState={updateMessageInState}
          getChatService={getChatService}
        />
      ))}
      
      {/* Processing indicator */}
      {isProcessing && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Processing...</span>
        </div>
      )}
      
      {/* Anchor for auto-scrolling to the end */}
      <div ref={messagesEndRef} />
    </div>
  );
}