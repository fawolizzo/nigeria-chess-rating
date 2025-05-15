
import React, { useState } from "react";
import { useOrganizerDashboardData } from "@/hooks/useOrganizerDashboardData";
import { useDataSync } from "@/hooks/useDataSync";
import { OrganizerTabs } from "@/components/organizer/OrganizerTabs";
import { OrganizerStatsGrid } from "@/components/organizer/OrganizerStatsGrid";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreateTournamentForm } from "@/components/tournament/CreateTournamentForm";
import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { DashboardErrorState } from "@/components/dashboard/DashboardErrorState";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";
import { TournamentFormData } from "@/types/tournamentTypes";

interface NewOrganizerDashboardProps {
  userId: string;
  userName: string;
}

export function NewOrganizerDashboard({ userId, userName }: NewOrganizerDashboardProps) {
  const [activeTab, setActiveTab] = useState("approved");
  const [isCreateTournamentOpen, setIsCreateTournamentOpen] = useState(false);
  
  const {
    tournaments,
    isLoading,
    error,
    loadTournaments,
    createTournament,
    filterTournamentsByStatus,
    formatDisplayDate,
    getNextTournament
  } = useOrganizerDashboardData(userId);
  
  const {
    isSyncing,
    syncStatus,
    lastSyncTime,
    syncError,
    manualSync
  } = useDataSync({
    onSyncSuccess: loadTournaments
  });

  // Next tournament for the header section
  const nextTournament = getNextTournament();
  
  // Function to handle tournament creation
  const handleCreateTournament = (data: TournamentFormData, customTimeControl: string, isCustomTimeControl: boolean) => {
    const success = createTournament(data, customTimeControl, isCustomTimeControl);
    if (success) {
      setIsCreateTournamentOpen(false);
      setActiveTab("pending"); // Switch to pending tab to show the new tournament
    }
    return success;
  };
  
  // Functions to handle tournament actions
  const onViewDetails = (id: string) => {
    window.location.href = `/tournaments/${id}`;
  };
  
  const onManage = (id: string) => {
    window.location.href = `/tournament-management/${id}`;
  };
  
  // Show loading state
  if (isLoading) {
    return <DashboardLoadingState progress={50} />;
  }
  
  // Show error state
  if (error) {
    return <DashboardErrorState errorDetails={error} onRetry={loadTournaments} />;
  }
  
  return (
    <div className="p-4">
      {/* Header and sync status */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Welcome, {userName}</h2>
          <p className="text-muted-foreground">Manage your chess tournaments and players</p>
        </div>
        
        <div className="flex items-center gap-4">
          <SyncStatusIndicator
            isSyncing={isSyncing}
            syncStatus={syncStatus}
            lastSyncTime={lastSyncTime}
            syncError={syncError}
            onSync={manualSync}
          />
          
          <Button onClick={() => setIsCreateTournamentOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Tournament
          </Button>
        </div>
      </div>
      
      {/* Stats overview */}
      <OrganizerStatsGrid
        tournaments={tournaments}
        filterTournamentsByStatus={filterTournamentsByStatus}
        nextTournament={nextTournament}
        formatDisplayDate={formatDisplayDate}
      />
      
      {/* Tournament tabs */}
      <div className="mt-8">
        <OrganizerTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          getTournamentsByStatus={filterTournamentsByStatus}
          onCreateTournament={() => setIsCreateTournamentOpen(true)}
          onViewDetails={onViewDetails}
          onManage={onManage}
        />
      </div>
      
      {/* Create tournament dialog */}
      <Dialog open={isCreateTournamentOpen} onOpenChange={setIsCreateTournamentOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Tournament</DialogTitle>
          </DialogHeader>
          <CreateTournamentForm
            onSubmit={handleCreateTournament}
            onCancel={() => setIsCreateTournamentOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
