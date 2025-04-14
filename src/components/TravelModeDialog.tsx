"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CurrencyCodeCombobox } from "@/components/ui/currency-code-select";
import { Label } from "@/components/ui/label";
import { useTravelMode } from "@/contexts/TravelModeContext";

interface TravelModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const travelCurrencies = [
  { label: "Philippine Peso (PHP)", value: "PHP" },
  { label: "Japanese Yen (JPY)", value: "JPY" },
  { label: "New Taiwan Dollar (TWD)", value: "TWD" },
  { label: "Euro (EUR)", value: "EUR" },
  { label: "Swiss Franc (CHF)", value: "CHF" },
  { label: "South Korean Won (KRW)", value: "KRW" },
  { label: "Thai Baht (THB)", value: "THB" },
  { label: "Vietnamese Dong (VND)", value: "VND" },
  { label: "Malaysian Ringgit (MYR)", value: "MYR" },
  { label: "Indonesian Rupiah (IDR)", value: "IDR" },
  { label: "Australian Dollar (AUD)", value: "AUD" },
];

export function TravelModeDialog({ open, onOpenChange }: TravelModeDialogProps) {
  const { travelMode, toggleTravelMode, setTravelCurrency } = useTravelMode();
  const [selectedCurrency, setSelectedCurrency] = useState<string>(travelMode.travelCurrency || "");

  useEffect(() => {
    // Update the selected currency when travelMode changes
    setSelectedCurrency(travelMode.travelCurrency);
  }, [travelMode.travelCurrency]);

  const handleSave = () => {
    setTravelCurrency(selectedCurrency);
    toggleTravelMode(true);
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset to stored value if cancel
    setSelectedCurrency(travelMode.travelCurrency);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Travel Mode Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Select Currency for Your Trip</Label>
            <CurrencyCodeCombobox
              value={selectedCurrency}
              onChange={setSelectedCurrency}
            />
            <p className="text-sm text-muted-foreground mt-2">
              New expenses will be recorded in this currency while Travel Mode is enabled.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedCurrency}>
            Save & Enable Travel Mode
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}