import { useRef, useEffect, useCallback, useState } from "react";
import { Message } from "./types";
import { MessageItem } from "./MessageItem";
import { ChatMessageService } from "@/services/ChatMessageService";
import { Loader2 } from "lucide-react"; // Import the loader icon
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface MessageListProps {
  messages: Message[];
  updateMessageInState: (message: Message) => void;
  getChatService: () => Promise<ChatMessageService | null>;
  hasMoreMessages: boolean;
  isLoadingMore: boolean;
  loadMoreMessages: () => Promise<void>;
  isProcessing?: boolean; // Add isProcessing prop
  onMessageClick?: (message: Message) => void; // Add callback for message clicks
  deleteMessage?: (messageId: string) => Promise<void>; // Add deleteMessage function prop
}

export function MessageList({ 
  messages, 
  updateMessageInState, 
  getChatService,
  hasMoreMessages,
  isLoadingMore,
  loadMoreMessages,
  isProcessing = false, // Default to false
  onMessageClick,
  deleteMessage
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef<number>(messages.length);
  const prevMessagesRef = useRef<Message[]>(messages);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [preserveScroll, setPreserveScroll] = useState(false);
  const [scrollAnchorId, setScrollAnchorId] = useState<string | null>(null);
  const [scrollAnchorPosition, setScrollAnchorPosition] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  
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

  // Function to safely reset scroll container without breaking clicks
  const safelyResetScrollContainer = useCallback((callback?: () => void) => {
    if (!containerRef.current) return;
    
    // Store current scroll position
    const currentScrollTop = containerRef.current.scrollTop;
    const wasAtBottom = shouldScrollToBottom;
    
    // Use CSS transitions instead of toggling overflow
    // This is a gentler approach that won't break click events
    containerRef.current.style.transition = 'none';
    containerRef.current.style.opacity = '0.99';
    
    // Force a reflow with minimal visual impact
    requestAnimationFrame(() => {
      if (containerRef.current) {
        // Restore opacity to normal with a transition
        containerRef.current.style.transition = 'opacity 0.01s';
        containerRef.current.style.opacity = '1';
        
        // Execute callback if provided
        if (callback) callback();
        
        // Restore scroll position
        if (wasAtBottom) {
          messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        } else {
          containerRef.current.scrollTop = currentScrollTop;
        }
      }
    });
  }, [shouldScrollToBottom]);

  // Handle scroll events - both for detecting scroll position and load more
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    // Check if we should load more messages
    if (!isLoadingMore && hasMoreMessages && containerRef.current.scrollTop <= 50) {
      // Save scroll position before loading more messages
      setPreserveScroll(true);
      
      // Save a reference message ID to restore scroll position
      if (messages.length > 1) {
        setScrollAnchorId(messages[1]?.id || messages[0]?.id);
        setScrollAnchorPosition(containerRef.current.scrollTop);
      }
      
      // Load more messages
      loadMoreMessages();
    }
    
    // Check if user has scrolled to bottom (with 100px threshold)
    const isNearBottom = 
      containerRef.current.scrollHeight - containerRef.current.scrollTop - containerRef.current.clientHeight < 100;
    
    // If user manually scrolled to bottom, we can auto-scroll again
    if (isNearBottom) {
      setShouldScrollToBottom(true);
    } else {
      setShouldScrollToBottom(false);
    }
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages, messages]);

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
    else if (olderMessagesLoaded && preserveScroll && containerRef.current) {
      // If older messages were loaded, restore scroll position to the anchor message
      setTimeout(() => {
        // Find anchor message element by ID if possible
        if (scrollAnchorId) {
          const messageElements = containerRef.current?.querySelectorAll('[data-message-id]');
          const anchorElement = Array.from(messageElements || []).find(
            el => el.getAttribute('data-message-id') === scrollAnchorId
          ) as HTMLElement | undefined;
          
          if (anchorElement) {
            anchorElement.scrollIntoView({ block: 'start' });
          } else if (scrollAnchorPosition !== null) {
            // Fall back to position-based restore if we can't find the element
            containerRef.current!.scrollTop = scrollAnchorPosition + 200; // Add offset for new messages
          }
        }
        setPreserveScroll(false);
      }, 100);
    }
    
    // Update refs for next comparison
    prevMessagesLengthRef.current = messages.length;
    prevMessagesRef.current = [...messages];
  }, [messages, hasNewMessagesAtEnd, wereOlderMessagesLoaded, shouldScrollToBottom, preserveScroll, scrollAnchorId, scrollAnchorPosition]);

  // Initial scroll to bottom only when component first mounts
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      // Use a timeout to ensure the DOM is fully rendered
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView();
      }, 300);
    }
  }, [messages.length]); // Include messages.length in dependency array

  // Add a global handler to fix any potential scroll lock issues
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    function resetScrollIfNeeded() {
      if (containerRef.current) {
        // Check if scrollTop is not changing despite scrollHeight > clientHeight
        const needsReset = 
          containerRef.current.scrollHeight > containerRef.current.clientHeight && 
          Math.abs(containerRef.current.scrollTop) < 1; // Stuck at top
          
        if (needsReset) {
          // Reset the scrolling container
          safelyResetScrollContainer();
        }
      }
    }
    
    // Check after a short delay after any message changes
    if (messages.length > 0) {
      timeoutId = setTimeout(resetScrollIfNeeded, 500);
    }
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [messages.length, safelyResetScrollContainer]);

  const handleDeleteMessage = (message: Message) => {
    setMessageToDelete(message);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteMessage = () => {
    if (messageToDelete && deleteMessage) {
      // Preserve scroll position when a message is deleted
      setPreserveScroll(true);

      // Set a scroll anchor if there are messages
      const index = messages.findIndex((msg) => msg.id === messageToDelete.id);
      if (index !== -1 && messages.length > 1) {
        const anchorIndex = index < messages.length - 1 ? index + 1 : index - 1;
        if (anchorIndex >= 0) {
          setScrollAnchorId(messages[anchorIndex]?.id || null);
          if (containerRef.current) {
            setScrollAnchorPosition(containerRef.current.scrollTop);
          }
        }
      }

      // Call the delete function
      deleteMessage(messageToDelete.id);
    }
    setIsDeleteDialogOpen(false);
    setMessageToDelete(null);
  };

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-3 py-4"
    >
      {/* Loading indicator when fetching more messages */}
      {isLoadingMore && (
        <div className="text-center py-3 mb-2 text-sm text-muted-foreground">
          Loading older messages...
        </div>
      )}
      
      {/* Load more button as a fallback for scroll detection */}
      {hasMoreMessages && !isLoadingMore && (
        <button
          onClick={() => loadMoreMessages()}
          className="w-full text-center py-3 mb-2 text-sm text-primary hover:text-primary/80"
        >
          Load older messages
        </button>
      )}
      
      <div className="flex flex-col">
        {messages.map((message, index) => (
          <MessageItem 
            key={`${message.id}-${index}`} 
            message={message} 
            updateMessageInState={updateMessageInState}
            getChatService={getChatService}
            onClick={() => onMessageClick && onMessageClick(message)}
            onDelete={deleteMessage && message.id ? () => handleDeleteMessage(message) : undefined}
          />
        ))}
      </div>
      
      {/* Processing indicator */}
      {isProcessing && (
        <div className="flex items-center gap-2 p-4 mt-3 rounded-lg bg-muted/50 animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Processing...</span>
        </div>
      )}
      
      {/* Anchor for auto-scrolling to the end */}
      <div ref={messagesEndRef} className="h-1" />

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMessage}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}