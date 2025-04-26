
import React from "react";
import { OrganizerTabs } from "@/components/organizer/OrganizerTabs";
import { CreateTournamentForm } from "@/components/tournament/CreateTournamentForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TournamentFormData } from "@/types/tournamentTypes";

export function OrganizerTabsWrapper({
  activeTab,
  setActiveTab,
  filterTournamentsByStatus,
  onCreateTournament,
  onViewDetails,
  onManage,
  isCreateTournamentOpen,
  setIsCreateTournamentOpen,
  handleCreateTournament,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  filterTournamentsByStatus: (status: string) => any[];
  onCreateTournament: () => void;
  onViewDetails: (id: string) => void;
  onManage: (id: string) => void;
  isCreateTournamentOpen: boolean;
  setIsCreateTournamentOpen: (open: boolean) => void;
  handleCreateTournament: (data: TournamentFormData, customTimeControl: string, isCustomTimeControl: boolean) => boolean;
}) {
  return (
    <>
      <Dialog open={isCreateTournamentOpen} onOpenChange={setIsCreateTournamentOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Tournament</DialogTitle>
            <DialogDescription>
              Enter the details for your new chess tournament
            </DialogDescription>
          </DialogHeader>
          <CreateTournamentForm
            onSubmit={handleCreateTournament}
            onCancel={() => setIsCreateTournamentOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <OrganizerTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        getTournamentsByStatus={filterTournamentsByStatus}
        onCreateTournament={onCreateTournament}
        onViewDetails={onViewDetails}
        onManage={onManage}
      />
    </>
  );
}
