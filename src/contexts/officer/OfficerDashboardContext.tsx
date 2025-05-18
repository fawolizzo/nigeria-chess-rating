
import React, { createContext, useContext, useEffect, useRef } from "react";
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
    loadAllData,
    refreshKey,
    dataTimeoutRef,
    hasError,
    errorMessage
  } = useOfficerDashboardData();
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (dataTimeoutRef.current) {
        clearTimeout(dataTimeoutRef.current);
      }
    };
  }, [dataTimeoutRef]);
  
  // Log dashboard data loading state changes
  useEffect(() => {
    logMessage(
      isLoading ? LogLevel.INFO : LogLevel.INFO, // Changed from DEBUG to INFO since DEBUG doesn't exist
      'OfficerDashboardContext', 
      `Dashboard state: ${isLoading ? 'loading' : 'ready'}`
    );
  }, [isLoading]);
  
  // Log errors if they occur
  useEffect(() => {
    if (hasError) {
      logMessage(
        LogLevel.ERROR,
        'OfficerDashboardContext',
        'Dashboard error:',
        errorMessage
      );
    }
  }, [hasError, errorMessage]);
  
  return (
    <DashboardContext.Provider 
      value={{
        pendingTournaments,
        completedTournaments,
        pendingPlayers,
        pendingOrganizers,
        refreshDashboard,
        isLoading,
        hasError,
        errorMessage
      }}
    >
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
