import React from 'react';
import { OrganizerTabs } from '@/components/organizer/OrganizerTabs';
import CreateTournamentFormUI from '@/components/tournament/form/CreateTournamentFormUI';
import { useCreateTournamentForm } from '@/hooks/useCreateTournamentForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { TournamentFormData } from '@/types/tournamentTypes';

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
  handleCreateTournament: (
    data: TournamentFormData,
    customTimeControl: string,
    isCustomTimeControl: boolean
  ) => Promise<boolean>;
}) {
  // Use the form hook to get form data and handlers
  const formData = useCreateTournamentForm();

  return (
    <>
      <Dialog
        open={isCreateTournamentOpen}
        onOpenChange={setIsCreateTournamentOpen}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Tournament</DialogTitle>
            <DialogDescription>
              Enter the details for your new chess tournament
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <CreateTournamentFormUI
              {...formData}
              onSubmit={async (
                data,
                customTimeControl,
                isCustomTimeControl
              ) => {
                const success = await handleCreateTournament(
                  data,
                  customTimeControl,
                  isCustomTimeControl
                );
                if (success) {
                  setIsCreateTournamentOpen(false);
                }
                return success;
              }}
            />
          </div>
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
