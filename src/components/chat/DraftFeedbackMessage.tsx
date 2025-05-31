import React from 'react';
import { Card } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";

interface DraftFeedbackProps {
  awaitingField?: string;
  isProcessing?: boolean;
}

export function DraftFeedbackMessage({ awaitingField, isProcessing = false }: DraftFeedbackProps) {
  const getFieldPrompt = (field?: string) => {
    if (isProcessing) return "Processing your response...";
    
    if (!field) return "I need more information to complete this expense.";
    
    switch (field) {
      case "amount":
        return "Please tell me how much this expense was.";
      case "description":
        return "Please provide a description for this expense.";
      case "category":
        return "What category would you assign to this expense?";
      case "date":
        return "When did this expense occur?";
      case "tags":
        return "Would you like to add any tags to this expense?";
      default:
        return `Please provide the ${field} for this expense.`;
    }
  };

  return (
    <Card className="bg-primary/5 border-primary/20 p-3 my-2 text-sm animate-pulse">
      <div className="flex items-center gap-2">
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <AlertCircle className="h-4 w-4 text-primary" />
        )}
        <p className="text-primary-foreground/90 font-medium">
          {getFieldPrompt(awaitingField)}
        </p>
      </div>
    </Card>
  );
}
