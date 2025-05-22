
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { useOfficerDashboardData } from "@/hooks/dashboard/useOfficerDashboardData";
import { DashboardContextType } from "./types";

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const OfficerDashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    pendingTournaments,
    completedTournaments,
    pendingPlayers, 
    pendingOrganizers,
    isLoading,
    refreshData: refreshDashboard,
    dataTimeoutRef,
    hasError,
    errorMessage
  } = useOfficerDashboardData();
  
  // Use a ref to track if we've logged already to prevent excess logging on rerenders
  const hasLoggedRef = useRef<boolean>(false);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (dataTimeoutRef.current) {
        clearTimeout(dataTimeoutRef.current);
      }
    };
  }, [dataTimeoutRef]);
  
  // Log dashboard data loading state changes - but only on actual changes
  useEffect(() => {
    // Only log if the state actually changed or on first render
    if (!hasLoggedRef.current || hasLoggedRef.current !== isLoading) {
      logMessage(
        LogLevel.INFO, // Use INFO level for consistency
        'OfficerDashboardContext', 
        `Dashboard state: ${isLoading ? 'loading' : 'ready'}`
      );
      hasLoggedRef.current = isLoading;
    }
  }, [isLoading]);
  
  // Log errors if they occur - but only once
  useEffect(() => {
    if (hasError && errorMessage) {
      logMessage(
        LogLevel.ERROR,
        'OfficerDashboardContext',
        'Dashboard error:',
        errorMessage
      );
    }
  }, [hasError, errorMessage]);
  
  // Create a memoized context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    pendingTournaments,
    completedTournaments,
    pendingPlayers,
    pendingOrganizers,
    refreshDashboard,
    isLoading,
    hasError,
    errorMessage
  }), [
    pendingTournaments,
    completedTournaments,
    pendingPlayers,
    pendingOrganizers,
    refreshDashboard,
    isLoading,
    hasError,
    errorMessage
  ]);
  
  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within an OfficerDashboardProvider");
  }
  return context;
};
