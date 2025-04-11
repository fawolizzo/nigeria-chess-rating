
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrganizerApprovals from "./OrganizerApprovals";
import PlayerManagement from "./PlayerManagement";
import PendingTournamentApprovals from "./PendingTournamentApprovals";
import ApprovedTournaments from "./ApprovedTournaments";
import ApprovedOrganizers from "./ApprovedOrganizers";
import { useDashboard } from "@/contexts/OfficerDashboardContext";

const OfficerDashboardTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("organizers");
  const { 
    pendingTournaments, 
    completedTournaments, 
    pendingPlayers, 
    pendingOrganizers,
    refreshDashboard,
    isLoading
  } = useDashboard();

  const handleTabChange = (value: string) => {
    setActiveTab(value);
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

export default OfficerDashboardTabs;
