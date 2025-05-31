import { useEffect, useState, useCallback } from "react";
import { OnboardingStep } from "./types";
import { CountryCodeCombobox } from "@/components/ui/country-code-select";
import { CurrencyCodeCombobox } from "@/components/ui/currency-code-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

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
  const [isDetecting, setIsDetecting] = useState(false);

  const detectCountryAndCurrency = useCallback(async () => {
    try {
      setIsDetecting(true);
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();
      
      if (step.field === "country" && data.country_name) {
        setValue(data.country_name);
        localStorage.setItem("country", data.country_name);
      } else if (step.field === "currency" && data.currency) {
        setValue(data.currency);
        localStorage.setItem("currency", data.currency);
      }
    } catch (error) {
      console.error("Failed to detect country and currency", error);
    } finally {
      setIsDetecting(false);
    }
  }, [step.field]);

  useEffect(() => {
    // Reset the value when step changes
    setValue("");
    
    // Try to load existing value from localStorage
    const savedValue = localStorage.getItem(step.field);
    if (savedValue) {
      setValue(savedValue);
      return;
    }

    // If country or currency not set and not already detecting, attempt to detect them
    if ((step.field === "country" || step.field === "currency") && !savedValue && !isDetecting) {
      detectCountryAndCurrency();
    }
  }, [step.field, detectCountryAndCurrency, isDetecting]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value) {
      // Save to localStorage before submitting
      localStorage.setItem(step.field, value);
      onSubmit(value);
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
              onChange={(newValue) => setValue(newValue)}
            />
          ) : step.field === "currency" ? (
            <CurrencyCodeCombobox
              value={value}
              onChange={(newValue) => setValue(newValue)}
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
          
          <Button type="submit" className="w-full" disabled={!value || isDetecting}>
            {isDetecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Detecting...
              </>
            ) : (
              "Next"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}