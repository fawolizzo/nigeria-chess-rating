
import React, { useEffect, useRef } from "react";
import { OfficerDashboardProvider } from "@/contexts/officer/OfficerDashboardContext";
import DashboardContainer from "./dashboard/DashboardContainer";
import { logMessage, LogLevel } from "@/utils/debugLogger";

export function NewOfficerDashboard() {
  const initializedRef = useRef(false);
  
  // Initialize the dashboard once on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      logMessage(LogLevel.INFO, 'NewOfficerDashboard', 'Initializing dashboard');
    }
  }, []);

  return (
    <OfficerDashboardProvider>
      <DashboardContainer />
    </OfficerDashboardProvider>
  );
}

export default NewOfficerDashboard;
