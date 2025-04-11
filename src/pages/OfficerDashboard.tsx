
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useUser } from "@/contexts/UserContext";
import OfficerDashboardContent from "@/components/officer/OfficerDashboardContent";
import { getAllTournaments, getAllPlayers, getAllUsers } from "@/lib/mockData";
import ResetSystemData from "@/components/ResetSystemData";
import { syncStorage, forceSyncAllStorage } from "@/utils/storageUtils";
import { useToast } from "@/components/ui/use-toast";
import { logMessage, LogLevel } from "@/utils/debugLogger";

const OfficerDashboard: React.FC = () => {
  const { currentUser, isLoading, logout, forceSync } = useUser();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [isContentLoading, setIsContentLoading] = useState(true);
  const { toast } = useToast();
  
  // Prevent access for non-rating officers
  useEffect(() => {
    if (!isLoading) {
      if (!currentUser) {
        logMessage(LogLevel.WARNING, 'OfficerDashboard', 'No current user, redirecting to login');
        navigate("/login");
        return;
      }
      
      if (currentUser.role !== "rating_officer") {
        logMessage(LogLevel.WARNING, 'OfficerDashboard', `User role is ${currentUser.role}, not rating_officer`);
        toast({
          title: "Access Denied",
          description: "This page is only accessible to Rating Officers",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
      
      logMessage(LogLevel.INFO, 'OfficerDashboard', `Rating officer logged in: ${currentUser.email}`);
    }
  }, [currentUser, isLoading, navigate, toast]);
  
  // Optimized function to load pending counts
  const loadPendingCounts = useCallback(async () => {
    if (isLoading || !currentUser) return;
    
    try {
      // Ensure storage is synced between localStorage and sessionStorage
      await syncStorage(['ncr_users']);
      await syncStorage(['ncr_players']);
      await syncStorage(['ncr_tournaments']);
      
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
      setIsContentLoading(false);
      
      logMessage(LogLevel.INFO, 'OfficerDashboard', "Pending counts loaded");
    } catch (error) {
      logMessage(LogLevel.ERROR, 'OfficerDashboard', "Error loading pending counts:", error);
      toast({
        title: "Error Loading Data",
        description: "There was a problem loading pending approvals.",
        variant: "destructive"
      });
      setIsContentLoading(false);
    }
  }, [isLoading, currentUser, toast]);
  
  // Load data once user authentication is confirmed
  useEffect(() => {
    if (isLoading || !currentUser) return;
    
    // Force sync storage on first load to ensure we have the latest data
    const loadData = async () => {
      try {
        setIsContentLoading(true);
        
        // Use setTimeout to prevent UI freezing
        setTimeout(async () => {
          try {
            // Force sync all storage
            logMessage(LogLevel.INFO, 'OfficerDashboard', 'Forcing sync of all storage');
            await forceSync();
            await forceSyncAllStorage();
            
            // Load pending data counts
            await loadPendingCounts();
          } catch (error) {
            logMessage(LogLevel.ERROR, 'OfficerDashboard', 'Error in async initialization:', error);
            setIsContentLoading(false);
          }
        }, 100);
      } catch (error) {
        logMessage(LogLevel.ERROR, 'OfficerDashboard', 'Error initializing dashboard:', error);
        toast({
          title: "Error Loading Dashboard",
          description: "There was an error loading the dashboard data. Please try again.",
          variant: "destructive"
        });
        setIsContentLoading(false);
      }
    };
    
    loadData();
  }, [currentUser, isLoading, toast, forceSync, loadPendingCounts]);
  
  // Set up refresh interval with a longer time to prevent UI freezing
  useEffect(() => {
    if (!currentUser) return;
    
    const interval = setInterval(() => {
      loadPendingCounts();
    }, 15000); // Update every 15 seconds instead of 5
    
    return () => {
      clearInterval(interval);
    };
  }, [loadPendingCounts, currentUser]);
  
  const handleSystemReset = () => {
    // Log out the current user after reset
    logout();
  };
  
  if (isLoading || isContentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nigeria-green"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
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
