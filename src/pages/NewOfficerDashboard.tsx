
import React from "react";
import Navbar from "@/components/Navbar";
import NewOfficerDashboard from "@/components/officer/NewOfficerDashboard";

export default function NewOfficerDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-20">
        <NewOfficerDashboard />
      </div>
    </div>
  );
}
