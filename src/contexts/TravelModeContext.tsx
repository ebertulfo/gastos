"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface TravelModeState {
  isEnabled: boolean;
  travelCurrency: string;
}

interface TravelModeContextType {
  travelMode: TravelModeState;
  toggleTravelMode: (isEnabled: boolean) => void;
  setTravelCurrency: (currency: string) => void;
}

const initialTravelModeState: TravelModeState = {
  isEnabled: false,
  travelCurrency: "",
};

const TravelModeContext = createContext<TravelModeContextType | undefined>(undefined);

export const TravelModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with default state
  const [travelMode, setTravelMode] = useState<TravelModeState>(initialTravelModeState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load travel mode state from localStorage on component mount
  useEffect(() => {
    // Only run this on the client-side
    if (typeof window !== 'undefined') {
      try {
        const savedTravelMode = localStorage.getItem("travelMode");
        if (savedTravelMode) {
          setTravelMode(JSON.parse(savedTravelMode));
        }
      } catch (error) {
        console.error("Error loading travel mode from localStorage:", error);
      }
      setIsInitialized(true);
    }
  }, []);

  // Save travel mode state to localStorage whenever it changes
  useEffect(() => {
    // Only save to localStorage after initial load and on the client-side
    if (isInitialized && typeof window !== 'undefined') {
      try {
        localStorage.setItem("travelMode", JSON.stringify(travelMode));
      } catch (error) {
        console.error("Error saving travel mode to localStorage:", error);
      }
    }
  }, [travelMode, isInitialized]);

  const toggleTravelMode = (isEnabled: boolean) => {
    setTravelMode(prev => ({ ...prev, isEnabled }));
  };

  const setTravelCurrency = (currency: string) => {
    setTravelMode(prev => ({ ...prev, travelCurrency: currency }));
  };

  return (
    <TravelModeContext.Provider
      value={{
        travelMode,
        toggleTravelMode,
        setTravelCurrency,
      }}
    >
      {children}
    </TravelModeContext.Provider>
  );
};

export const useTravelMode = () => {
  const context = useContext(TravelModeContext);
  if (!context) {
    throw new Error("useTravelMode must be used within a TravelModeProvider");
  }
  return context;
};