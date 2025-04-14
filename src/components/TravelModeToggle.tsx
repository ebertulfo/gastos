"use client";

import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTravelMode } from "@/contexts/TravelModeContext";
import { TravelModeDialog } from "./TravelModeDialog";
import { Plane } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function TravelModeToggle() {
  const { travelMode, toggleTravelMode } = useTravelMode();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // This ensures we only render the toggle after client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggleChange = (checked: boolean) => {
    if (checked) {
      // Always show dialog when enabling travel mode
      setDialogOpen(true);
    } else {
      // Just toggle the mode off when disabling
      toggleTravelMode(checked);
    }
  };

  // Don't render the toggle until client-side hydration is complete
  if (!mounted) {
    return <div className="w-9 h-5"></div>; // Placeholder with same dimensions as Switch
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Switch 
            checked={travelMode.isEnabled}
            onCheckedChange={handleToggleChange}
            id="travel-mode"
          />
          <Label 
            htmlFor="travel-mode" 
            className="flex items-center gap-1.5 cursor-pointer text-sm font-medium"
          >
            <Plane className="h-4 w-4" />
            <span className="hidden md:inline">Travel Mode</span>
          </Label>
        </div>
        
        {travelMode.isEnabled && travelMode.travelCurrency && (
          <Badge variant="outline" className="ml-1 text-xs">
            {travelMode.travelCurrency}
          </Badge>
        )}
      </div>
      
      <TravelModeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}