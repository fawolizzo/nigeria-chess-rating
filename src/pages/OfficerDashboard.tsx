
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useUser } from "@/contexts/UserContext";
import OfficerDashboardContent from "@/components/officer/OfficerDashboardContent";
import { getAllTournaments, getAllPlayers, getAllUsers } from "@/lib/mockData";
import ResetSystemData from "@/components/ResetSystemData";
import { syncStorage, forceSyncAllStorage } from "@/utils/storageUtils";
import { useToast } from "@/components/ui/use-toast";

const OfficerDashboard: React.FC = () => {
  const { currentUser, isLoading, logout } = useUser();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!isLoading && (!currentUser || currentUser.role !== "rating_officer")) {
      navigate("/login");
    }
    
    // Force sync storage on first load to ensure we have the latest data
    forceSyncAllStorage();
    
    // Load pending data counts
    const loadPendingCounts = () => {
      try {
        // Ensure storage is synced between localStorage and sessionStorage
        syncStorage('ncr_users');
        syncStorage('ncr_players');
        syncStorage('ncr_tournaments');
        
        // Load pending tournaments count
        const allTournaments = getAllTournaments();
        const pendingTournaments = allTournaments.filter(t => t.status === "pending").length;
        const completedTournaments = allTournaments.filter(t => t.status === "completed").length;
        
        // Load pending players count
        const allPlayers = getAllPlayers();
        const pendingPlayers = allPlayers.filter(p => p.status === "pending").length;
        
        // Load pending organizers count
        const allUsers = getAllUsers();
        const pendingOrganizers = allUsers.filter(u => 
          u.role === 'tournament_organizer' && u.status === 'pending'
        ).length;
        
        // Set total pending count
        setPendingCount(pendingTournaments + pendingPlayers + pendingOrganizers + completedTournaments);
        
        console.log("Pending counts:", {
          tournaments: pendingTournaments,
          completed: completedTournaments,
          players: pendingPlayers,
          organizers: pendingOrganizers,
          total: pendingTournaments + pendingPlayers + pendingOrganizers + completedTournaments
        });
      } catch (error) {
        console.error("Error loading pending counts:", error);
        toast({
          title: "Error Loading Data",
          description: "There was a problem loading pending approvals.",
          variant: "destructive"
        });
      }
    };
    
    loadPendingCounts();
    
    // Set up an interval to refresh the counts more frequently
    const interval = setInterval(loadPendingCounts, 2000); // Update every 2 seconds
    
    // Listen for storage changes from other tabs/devices
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ncr_users' || e.key === 'ncr_players' || e.key === 'ncr_tournaments') {
        console.log(`Storage event detected for ${e.key}, reloading counts`);
        
        // Force sync all storage when a storage event is detected
        forceSyncAllStorage();
        loadPendingCounts();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentUser, isLoading, navigate, toast]);
  
  const handleSystemReset = () => {
    // Log out the current user after reset
    logout();
  };
  
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
      <Navbar />
      
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
        
        <div className="mt-8">
          <ResetSystemData onReset={handleSystemReset} />
        </div>
      </div>
    </div>
  );
};

export default OfficerDashboard;
