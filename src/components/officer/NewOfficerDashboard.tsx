
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOfficerDashboardData } from "@/hooks/useOfficerDashboardData";
import { useDataSync } from "@/hooks/useDataSync";
import OrganizerApprovals from "./OrganizerApprovals";
import PlayerManagement from "./PlayerManagement";
import PendingTournamentApprovals from "./PendingTournamentApprovals";
import ApprovedTournaments from "./ApprovedTournaments";
import ApprovedOrganizers from "./ApprovedOrganizers";
import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { DashboardErrorState } from "@/components/dashboard/DashboardErrorState";
import { DashboardErrorBoundary } from "@/components/dashboard/DashboardErrorBoundary";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";

export function NewOfficerDashboard() {
  const [activeTab, setActiveTab] = useState("pending-tournaments");
  const { 
    pendingTournaments, 
    completedTournaments, 
    pendingPlayers,
    pendingOrganizers,
    isLoading, 
    hasError, 
    errorMessage, 
    refreshData 
  } = useOfficerDashboardData();
  
  const { 
    isSyncing, 
    syncStatus, 
    lastSyncTime, 
    syncError, 
    manualSync 
  } = useDataSync({
    onSyncSuccess: refreshData
  });

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Show loading state when data is loading
  if (isLoading) {
    return (
      <DashboardLoadingState 
        progress={50} 
        message="Loading dashboard data..." 
      />
    );
  }

  // Show error state if data loading failed
  if (hasError) {
    return (
      <DashboardErrorState
        title="Dashboard Data Error"
        description="There was a problem loading your dashboard data."
        errorDetails={errorMessage || undefined}
        onRetry={refreshData}
      />
    );
  }

  return (
    <DashboardErrorBoundary onReset={refreshData}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4 px-2">
          <h3 className="text-sm font-medium text-gray-500">Dashboard Controls</h3>
          <SyncStatusIndicator 
            isSyncing={isSyncing}
            syncStatus={syncStatus}
            lastSyncTime={lastSyncTime}
            syncError={syncError}
            onSync={manualSync}
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
              <OrganizerApprovals onApprovalUpdate={refreshData} />
              <ApprovedOrganizers />
            </div>
          </TabsContent>
          
          <TabsContent value="players" className="p-4 focus-visible:outline-none focus-visible:ring-0">
            <PlayerManagement onPlayerApproval={refreshData} />
          </TabsContent>
          
          <TabsContent value="pending-tournaments" className="p-4 focus-visible:outline-none focus-visible:ring-0">
            {pendingTournaments.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-md">
                <p className="text-muted-foreground">No pending tournaments to approve</p>
              </div>
            ) : (
              <PendingTournamentApprovals 
                tournaments={pendingTournaments}
                onApprovalUpdate={refreshData} 
              />
            )}
          </TabsContent>
          
          <TabsContent value="approved-tournaments" className="p-4 focus-visible:outline-none focus-visible:ring-0">
            <ApprovedTournaments 
              completedTournaments={completedTournaments}
              onTournamentProcessed={refreshData} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardErrorBoundary>
  );
}
