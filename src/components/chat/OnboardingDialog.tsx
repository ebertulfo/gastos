import { useState } from "react";
import { OnboardingStep } from "./types";
import { CountryCodeCombobox } from "@/components/ui/country-code-select";
import { CurrencyCodeCombobox } from "@/components/ui/currency-code-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface OnboardingDialogProps {
  step: OnboardingStep;
  onSubmit: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingDialog({
  step,
  onSubmit,
  open,
  onOpenChange,
}: OnboardingDialogProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value) {
      onSubmit(value);
      setValue("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step.question}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {step.field === "country" ? (
            <CountryCodeCombobox
              value={value}
              onChange={setValue}
            />
          ) : step.field === "currency" ? (
            <CurrencyCodeCombobox
              value={value}
              onChange={setValue}
            />
          ) : (
            <Input
              name={step.field}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Enter your ${step.field}`}
              required={step.required}
            />
          )}
          
          <Button type="submit" className="w-full" disabled={!value}>
            Next
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 