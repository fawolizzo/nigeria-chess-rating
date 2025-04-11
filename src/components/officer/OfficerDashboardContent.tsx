
import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrganizerApprovals from "./OrganizerApprovals";
import PlayerManagement from "./PlayerManagement";
import PendingTournamentApprovals from "./PendingTournamentApprovals";
import ApprovedTournaments from "./ApprovedTournaments";
import ApprovedOrganizers from "./ApprovedOrganizers";
import { useToast } from "@/components/ui/use-toast";
import { getAllTournaments, getAllPlayers } from "@/lib/mockData";
import { getAllUsersFromStorage } from "@/utils/userUtils";
import { syncStorage, forceSyncAllStorage } from "@/utils/storageUtils";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { useUser } from "@/contexts/UserContext";

const OfficerDashboardContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("organizers");
  const { toast } = useToast();
  const { forceSync } = useUser();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingTournaments, setPendingTournaments] = useState<any[]>([]);
  const [completedTournaments, setCompletedTournaments] = useState<any[]>([]);
  const [pendingPlayers, setPendingPlayers] = useState<any[]>([]);
  const [pendingOrganizers, setPendingOrganizers] = useState<any[]>([]);
  
  // Optimized load function with debounce capability
  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      logMessage(LogLevel.INFO, 'OfficerDashboardContent', 'Loading dashboard data');
      
      // Force a complete sync with a timeout to prevent freezing
      setTimeout(async () => {
        try {
          await forceSync();
          await forceSyncAllStorage();
          
          // Ensure storage is synced
          await syncStorage(['ncr_users']);
          await syncStorage(['ncr_players']);
          await syncStorage(['ncr_tournaments']);
          
          // Load tournaments based on their status
          const allTournaments = getAllTournaments();
          setPendingTournaments(allTournaments.filter(t => t.status === "pending"));
          setCompletedTournaments(allTournaments.filter(t => t.status === "completed"));
          
          // Load pending players
          const allPlayers = getAllPlayers();
          setPendingPlayers(allPlayers.filter(p => p.status === "pending"));
          
          // Load pending organizers directly from storage for the most up-to-date data
          const allUsers = getAllUsersFromStorage();
          const filteredOrganizers = allUsers.filter(
            (user) => user.role === "tournament_organizer" && user.status === "pending"
          );
          setPendingOrganizers(filteredOrganizers);
          
          logMessage(LogLevel.INFO, 'OfficerDashboardContent', 'Dashboard data loaded');
          
          setIsLoading(false);
        } catch (error) {
          logMessage(LogLevel.ERROR, 'OfficerDashboardContent', "Error in async part:", error);
          setIsLoading(false);
        }
      }, 100);
    } catch (error) {
      logMessage(LogLevel.ERROR, 'OfficerDashboardContent', "Error loading dashboard data:", error);
      toast({
        title: "Error Loading Data",
        description: "There was a problem loading the dashboard data. Please try refreshing the page.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  }, [forceSync, toast]);
  
  // Initial load and refresh when the key changes
  useEffect(() => {
    loadAllData();
    // Use a shorter interval for refreshes to prevent UI freezing
    const intervalId = setInterval(() => {
      loadAllData();
    }, 15000); // Refresh every 15 seconds instead of 5 seconds
    
    return () => clearInterval(intervalId);
  }, [refreshKey, loadAllData]);
  
  const refreshDashboard = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Dashboard refreshed",
      description: "The dashboard has been refreshed with the latest data.",
    });
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Don't immediately refresh when changing tabs - allow the UI to update first
    setTimeout(() => {
      loadAllData();
    }, 100);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nigeria-green"></div>
        <span className="ml-3 text-gray-600">Loading dashboard content...</span>
      </div>
    );
  }
  
  return (
    <div>
      <Tabs 
        defaultValue="organizers" 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="overflow-x-auto">
          <TabsList className="grid grid-cols-4 mb-0 border-b rounded-none w-full min-w-[600px]">
            <TabsTrigger value="organizers" className="px-4">
              Organizers
              {pendingOrganizers.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-100 text-red-600 text-xs font-medium">
                  {pendingOrganizers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="players" className="px-4">
              Players
              {pendingPlayers.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-100 text-red-600 text-xs font-medium">
                  {pendingPlayers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending-tournaments" className="px-4">
              Pending Tourn.
              {pendingTournaments.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-100 text-red-600 text-xs font-medium">
                  {pendingTournaments.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved-tournaments" className="px-4">
              Tournaments
              {completedTournaments.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 text-green-600 text-xs font-medium">
                  {completedTournaments.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="organizers" className="p-4">
          <div className="space-y-8">
            <OrganizerApprovals />
            <ApprovedOrganizers />
          </div>
        </TabsContent>
        <TabsContent value="players" className="p-4">
          <PlayerManagement onPlayerApproval={refreshDashboard} />
        </TabsContent>
        <TabsContent value="pending-tournaments" className="p-4">
          {pendingTournaments.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-md">
              <p className="text-muted-foreground">No pending tournaments to approve</p>
            </div>
          ) : (
            <PendingTournamentApprovals 
              tournaments={pendingTournaments}
              onApprovalUpdate={refreshDashboard} 
            />
          )}
        </TabsContent>
        <TabsContent value="approved-tournaments" className="p-4">
          <ApprovedTournaments 
            completedTournaments={completedTournaments}
            onTournamentProcessed={refreshDashboard} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OfficerDashboardContent;
