
import React, { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { useTournamentManager } from "@/hooks/useTournamentManager";
import { Tournament, TournamentFormData } from "@/types/tournamentTypes";
import { OrganizerTabsWrapper } from "./dashboard/OrganizerTabsWrapper";
import { logMessage, LogLevel } from "@/utils/debugLogger";

const NewOrganizerDashboard: React.FC = () => {
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const { tournaments, createTournament, isLoading, loadError } = useTournamentManager();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [isCreateTournamentOpen, setIsCreateTournamentOpen] = useState(false);

  // Filter tournaments by status - fix the status comparison
  const filterTournamentsByStatus = (status: string): Tournament[] => {
    if (!tournaments) return [];
    
    switch (status) {
      case "upcoming":
        return tournaments.filter(t => t.status === "approved" && new Date(t.start_date) > new Date());
      case "pending":
        return tournaments.filter(t => t.status === "pending");
      case "ongoing":
        return tournaments.filter(t => t.status === "ongoing");
      case "completed":
        return tournaments.filter(t => t.status === "completed");
      case "rejected":
        return tournaments.filter(t => t.status === "rejected");
      default:
        return tournaments;
    }
  };

  const onCreateTournament = () => {
    setIsCreateTournamentOpen(true);
  };

  const onViewDetails = (id: string) => {
    navigate(`/tournament/${id}`);
  };

  const onManage = (id: string) => {
    navigate(`/tournament-management/${id}`);
  };

  const handleCreateTournament = (
    data: TournamentFormData, 
    customTimeControl: string, 
    isCustomTimeControl: boolean
  ): boolean => {
    try {
      // Add default values for missing properties
      const tournamentData = {
        ...data,
        registrationOpen: data.registrationOpen ?? true,
      };

      createTournament(tournamentData, customTimeControl, isCustomTimeControl);
      setIsCreateTournamentOpen(false);
      return true;
    } catch (error) {
      logMessage(LogLevel.ERROR, 'NewOrganizerDashboard', 'Error creating tournament:', error);
      return false;
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading tournaments...</div>;
  }

  if (loadError) {
    return <div className="p-4 text-center text-red-600">Error: {loadError}</div>;
  }

  return (
    <OrganizerTabsWrapper
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      filterTournamentsByStatus={filterTournamentsByStatus}
      onCreateTournament={onCreateTournament}
      onViewDetails={onViewDetails}
      onManage={onManage}
      isCreateTournamentOpen={isCreateTournamentOpen}
      setIsCreateTournamentOpen={setIsCreateTournamentOpen}
      handleCreateTournament={handleCreateTournament}
    />
  );
};

export default NewOrganizerDashboard;
