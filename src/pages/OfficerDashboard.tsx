
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useUser } from "@/contexts/UserContext";
import OfficerDashboardContent from "@/components/officer/OfficerDashboardContent";
import { getAllTournaments, getAllPlayers } from "@/lib/mockData";

const OfficerDashboard: React.FC = () => {
  const { currentUser, isLoading } = useUser();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  
  useEffect(() => {
    if (!isLoading && (!currentUser || currentUser.role !== "rating_officer")) {
      navigate("/login");
    }
    
    // Load pending tournaments count
    const allTournaments = getAllTournaments();
    const pendingTournaments = allTournaments.filter(t => t.status === "pending");
    
    // Load pending players count
    const allPlayers = getAllPlayers();
    const pendingPlayers = allPlayers.filter(p => p.status === "pending");
    
    // Set total pending count (tournaments + players)
    setPendingCount(pendingTournaments.length + pendingPlayers.length);
  }, [currentUser, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (!currentUser || currentUser.role !== "rating_officer") {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar notificationCount={pendingCount} />
      
      <div className="container pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Rating Officer Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage tournaments, players and rating calculations</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <OfficerDashboardContent />
        </div>
      </div>
    </div>
  );
};

export default OfficerDashboard;
