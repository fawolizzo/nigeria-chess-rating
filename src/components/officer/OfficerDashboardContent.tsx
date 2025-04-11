
import React from "react";
import { OfficerDashboardProvider } from "@/contexts/OfficerDashboardContext";
import OfficerDashboardTabs from "./OfficerDashboardTabs";

const OfficerDashboardContent: React.FC = () => {
  return (
    <OfficerDashboardProvider>
      <OfficerDashboardTabs />
    </OfficerDashboardProvider>
  );
};

export default OfficerDashboardContent;
