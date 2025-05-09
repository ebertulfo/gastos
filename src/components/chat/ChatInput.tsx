import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  // Mic, 
  // MicOff, 
  // PaperclipIcon, 
  Send 
} from "lucide-react";
// import { 
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onFileUpload: (file: File) => void;
  isRecording: boolean;
  onToggleRecording: () => void;
  isProcessing: boolean;
}

export function ChatInput({
  onSendMessage,
  // onFileUpload,
  // isRecording,
  // onToggleRecording,
  isProcessing,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  // const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isProcessing) return;
    
    onSendMessage(message);
    setMessage("");
  };

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     onFileUpload(file);
  //   }
  // };

  return (
    <form onSubmit={handleSubmit} className="p-3">
      <div className="flex flex-col gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={isProcessing}
          className="flex-1 min-h-[60px] resize-none py-3 px-4 rounded-lg w-full"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (message.trim() && !isProcessing) {
                handleSubmit(e);
              }
            }
          }}
        />
        
        {/* <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,audio/*"
          />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  <PaperclipIcon className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload file (OCR processing temporarily disabled)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider> */}
        
        {/* <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleRecording}
            disabled={isProcessing}
          >
            {isRecording ? (
              <MicOff className="w-5 h-5 text-destructive" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button> */}
        
        <Button 
          type="submit" 
          disabled={!message.trim() || isProcessing}
          className="h-9 w-24 self-end"
          size="sm"
        >
          <Send className="w-4 h-4 mr-2" />
          Send
        </Button>
      </div>
    </form>
  );
}