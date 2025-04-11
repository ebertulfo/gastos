import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, PaperclipIcon, Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onFileUpload: (file: File) => void;
  isRecording: boolean;
  onToggleRecording: () => void;
  isProcessing: boolean;
}

export function ChatInput({
  onSendMessage,
  onFileUpload,
  isRecording,
  onToggleRecording,
  isProcessing,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isProcessing) return;
    
    onSendMessage(message);
    setMessage("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      <div className="flex items-center gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={isProcessing}
          className="flex-1"
        />
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,audio/*"
        />
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
        >
          <PaperclipIcon className="w-5 h-5" />
        </Button>
        
        <Button
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
        </Button>
        
        <Button type="submit" disabled={!message.trim() || isProcessing}>
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </form>
  );
} 