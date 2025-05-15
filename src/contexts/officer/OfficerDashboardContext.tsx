
import React, { createContext, useContext, useEffect, useRef } from "react";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { useOfficerDashboardData } from "./useOfficerDashboardData";
import { DashboardContextType } from "./types";

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const OfficerDashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    pendingTournaments,
    completedTournaments,
    pendingPlayers, 
    pendingOrganizers,
    isLoading,
    refreshDashboard,
    loadAllData,
    refreshKey,
    dataTimeoutRef
  } = useOfficerDashboardData();
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (dataTimeoutRef.current) {
        clearTimeout(dataTimeoutRef.current);
      }
    };
  }, [dataTimeoutRef]);
  
  // Load data on mount and when refreshKey changes (manual refresh)
  useEffect(() => {
    // Clear any existing timeout
    if (dataTimeoutRef.current) {
      clearTimeout(dataTimeoutRef.current);
    }
    
    // Load data immediately
    loadAllData();
    
    // Set a safety timeout to ensure loading state is cleared eventually
    dataTimeoutRef.current = setTimeout(() => {
      if (isLoading) {
        logMessage(LogLevel.WARNING, 'OfficerDashboardContext', 'Loading dashboard data timed out, forcing completion');
      }
    }, 8000); // 8 seconds max loading time
    
    return () => {
      if (dataTimeoutRef.current) {
        clearTimeout(dataTimeoutRef.current);
      }
    };
  }, [refreshKey, loadAllData, isLoading, dataTimeoutRef]);
  
  return (
    <DashboardContext.Provider 
      value={{
        pendingTournaments,
        completedTournaments,
        pendingPlayers,
        pendingOrganizers,
        refreshDashboard,
        isLoading
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
