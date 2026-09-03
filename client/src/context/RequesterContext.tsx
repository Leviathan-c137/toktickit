import React, { createContext, useContext, useState, useEffect } from "react";
import { Requester } from "../types.js";

const STORAGE_KEY = "toktickit_requester";

export interface RequesterContextType {
  currentRequester: Requester | null;
  selectRequester: (requester: Requester) => void;
  clearRequester: () => void;
  isLoadingContext: boolean;
}

const RequesterContext = createContext<RequesterContextType | undefined>(undefined);

export const RequesterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRequester, setCurrentRequester] = useState<Requester | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.id === "number") {
          setCurrentRequester(parsed);
        }
      }
    } catch {
      // Ignore localStorage parse errors
    } finally {
      setIsLoadingContext(false);
    }
  }, []);

  const selectRequester = (requester: Requester) => {
    setCurrentRequester(requester);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requester));
    } catch {
      // Ignore localStorage storage errors
    }
  };

  const clearRequester = () => {
    setCurrentRequester(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore localStorage remove errors
    }
  };

  return (
    <RequesterContext.Provider
      value={{
        currentRequester,
        selectRequester,
        clearRequester,
        isLoadingContext,
      }}
    >
      {children}
    </RequesterContext.Provider>
  );
};

export function useRequester(): RequesterContextType {
  const context = useContext(RequesterContext);
  if (!context) {
    throw new Error("useRequester must be used within a RequesterProvider");
  }
  return context;
}
