"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Image as ImageIcon, 
  Mic,
  Upload
} from "lucide-react";

interface ExpenseInputDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Sample expense texts for placeholder rotation
const SAMPLE_EXPENSES = [
  "20 lunch at Chipotle",
  "35 uber ride home",
  "12.50 coffee with friends",
  "75 groceries at Trader Joe's",
  "8.99 netflix subscription",
  "45 gas station fill up",
  "22 movie tickets",
  "15.75 book from Amazon"
];

export function ExpenseInputDrawer({ open, onOpenChange }: ExpenseInputDrawerProps) {
  const [activeTab, setActiveTab] = useState("text");
  const [expenseText, setExpenseText] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  // Get a random sample expense for the placeholder
  const getRandomPlaceholder = () => {
    const randomIndex = Math.floor(Math.random() * SAMPLE_EXPENSES.length);
    return SAMPLE_EXPENSES[randomIndex];
  };
  
  const handleSubmit = () => {
    console.log("Expense submitted:", expenseText);
    // Here we would send the text to OpenAI for processing
    
    // Reset form and close drawer
    setExpenseText("");
    onOpenChange(false);
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Here we would handle the image processing
      // For now, just create a preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Here we would integrate with audio recording API
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[85vh] sm:h-auto max-h-[85vh] sm:max-h-[650px] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-3 mx-6">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Text</span>
            </TabsTrigger>
            <TabsTrigger value="photo" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span>Photo</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              <span>Audio</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <TabsContent value="text" className="mt-0 space-y-4">
                <Textarea
                  value={expenseText}
                  onChange={(e) => setExpenseText(e.target.value)}
                  placeholder={`Enter your expense (e.g., "${getRandomPlaceholder()}")`}
                  className="min-h-[200px]"
                />
                <p className="text-sm text-muted-foreground">
                  Just type your expense details in plain text. We'll extract the amount, category, and other information automatically.
                </p>
              </TabsContent>
              
              <TabsContent value="photo" className="mt-0">
                <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed rounded-md">
                  {capturedImage ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={capturedImage} 
                        alt="Captured" 
                        className="w-full h-full object-contain" 
                      />
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="absolute top-2 right-2"
                        onClick={() => setCapturedImage(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload a photo of your receipt
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => document.getElementById('photo-upload')?.click()}
                      >
                        Select Image
                      </Button>
                      <input 
                        id="photo-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileUpload}
                      />
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  We'll extract expense details from your receipt using OCR technology.
                </p>
              </TabsContent>
              
              <TabsContent value="audio" className="mt-0">
                <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed rounded-md">
                  <Mic className={`h-16 w-16 ${isRecording ? 'text-destructive animate-pulse' : 'text-muted-foreground'} mb-4`} />
                  <p className="text-sm text-muted-foreground mb-4">
                    {isRecording 
                      ? "Recording in progress... speak clearly" 
                      : "Record a voice note describing your expense"}
                  </p>
                  <Button 
                    variant={isRecording ? "destructive" : "outline"} 
                    onClick={toggleRecording}
                  >
                    {isRecording ? "Stop Recording" : "Start Recording"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  We'll convert your voice to text and extract expense details.
                </p>
              </TabsContent>
            </div>
          </div>
          
          <div className="p-6 border-t">
            <Button 
              onClick={handleSubmit} 
              className="w-full"
              disabled={activeTab === "text" ? !expenseText.trim() : false}
            >
              Save Expense
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}