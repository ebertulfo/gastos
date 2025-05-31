import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Pencil, Clock } from "lucide-react";

interface DraftStatusBarProps {
  draftId: string;
  awaitingField?: string;
  onCancel: (draftId: string) => void;
}

export function DraftStatusBar({ 
  draftId, 
  awaitingField,
  onCancel
}: DraftStatusBarProps) {
  // Get user-friendly field name
  const getFieldName = (field?: string) => {
    if (!field) return "additional information";
    switch (field) {
      case "amount": return "expense amount";
      case "description": return "expense description";
      case "category": return "expense category";
      case "date": return "expense date";
      case "tags": return "expense tags";
      default: return field;
    }
  };

  return (
    <div className="py-1 px-3 bg-primary/10 border-y border-primary/20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary">
          <Pencil className="w-3 h-3 mr-1" />
          Draft
        </Badge>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Waiting for {getFieldName(awaitingField)}
        </span>
      </div>
      
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 px-2 hover:bg-destructive/10 hover:text-destructive" 
        onClick={() => onCancel(draftId)}
      >
        <X className="w-3.5 h-3.5 mr-1" />
        Cancel
      </Button>
    </div>
  );
}
