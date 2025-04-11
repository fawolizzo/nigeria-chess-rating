
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrganizerApprovals from "./OrganizerApprovals";
import PlayerManagement from "./PlayerManagement";
import PendingTournamentApprovals from "./PendingTournamentApprovals";
import ApprovedTournaments from "./ApprovedTournaments";
import ApprovedOrganizers from "./ApprovedOrganizers";
import { useDashboard } from "@/contexts/OfficerDashboardContext";
import { Skeleton } from "@/components/ui/skeleton";

const OfficerDashboardTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("organizers");
  const [mounted, setMounted] = useState(false);
  const { 
    pendingTournaments, 
    completedTournaments, 
    pendingPlayers, 
    pendingOrganizers,
    refreshDashboard,
    isLoading
  } = useDashboard();

  // Use an effect to set mounted state to ensure consistent rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  if (!mounted) {
    return (
      <div className="p-4">
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nigeria-green mb-2"></div>
          <span className="text-gray-600">Loading dashboard content...</span>
        </div>
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
        <div className="overflow-x-auto border-b">
          <TabsList className="h-auto py-1 w-full bg-transparent mb-0 max-w-full min-w-max">
            <div className="grid grid-cols-4 w-full min-w-[600px]">
              <TabsTrigger value="organizers" className="px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                Organizers
                {pendingOrganizers.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-100 text-red-600 text-xs font-medium">
                    {pendingOrganizers.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="players" className="px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                Players
                {pendingPlayers.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-100 text-red-600 text-xs font-medium">
                    {pendingPlayers.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending-tournaments" className="px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                Pending Tourn.
                {pendingTournaments.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-100 text-red-600 text-xs font-medium">
                    {pendingTournaments.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved-tournaments" className="px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                Tournaments
                {completedTournaments.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 text-green-600 text-xs font-medium">
                    {completedTournaments.length}
                  </span>
                )}
              </TabsTrigger>
            </div>
          </TabsList>
        </div>
        <TabsContent value="organizers" className="p-4 focus-visible:outline-none focus-visible:ring-0">
          <div className="space-y-8">
            <OrganizerApprovals />
            <ApprovedOrganizers />
          </div>
        </TabsContent>
        <TabsContent value="players" className="p-4 focus-visible:outline-none focus-visible:ring-0">
          <PlayerManagement onPlayerApproval={refreshDashboard} />
        </TabsContent>
        <TabsContent value="pending-tournaments" className="p-4 focus-visible:outline-none focus-visible:ring-0">
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
        <TabsContent value="approved-tournaments" className="p-4 focus-visible:outline-none focus-visible:ring-0">
          <ApprovedTournaments 
            completedTournaments={completedTournaments}
            onTournamentProcessed={refreshDashboard} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OfficerDashboardTabs;
