import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { useTournamentManager } from '@/hooks/useTournamentManager';
import { Tournament, TournamentFormData } from '@/types/tournamentTypes';
import { OrganizerTabsWrapper } from './dashboard/OrganizerTabsWrapper';
import { logMessage, LogLevel } from '@/utils/debugLogger';

const NewOrganizerDashboard: React.FC = () => {
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const { tournaments, createTournament, isLoading, loadError } =
    useTournamentManager();
  const [activeTab, setActiveTab] = useState('approved');
  const [isCreateTournamentOpen, setIsCreateTournamentOpen] = useState(false);

  const getUpcomingTournaments = () => {
    return Array.isArray(tournaments)
      ? tournaments.filter(
          (t) => t.status === 'approved' && new Date(t.start_date) > new Date()
        )
      : [];
  };

  const getPendingTournaments = () => {
    return Array.isArray(tournaments)
      ? tournaments.filter((t) => t.status === 'pending')
      : [];
  };

  const getOngoingTournaments = () => {
    return Array.isArray(tournaments)
      ? tournaments.filter((t) => t.status === 'ongoing')
      : [];
  };

  const getCompletedTournaments = () => {
    return Array.isArray(tournaments)
      ? tournaments.filter((t) => t.status === 'completed')
      : [];
  };

  const getRejectedTournaments = () => {
    return Array.isArray(tournaments)
      ? tournaments.filter((t) => t.status === 'rejected')
      : [];
  };

  const getApprovedTournaments = () => {
    return Array.isArray(tournaments)
      ? tournaments.filter((t) => t.status === 'approved')
      : [];
  };

  const getProcessedTournaments = () => {
    return Array.isArray(tournaments)
      ? tournaments.filter((t) => t.status === 'processed')
      : [];
  };

  const filterTournamentsByStatus = (status: string): Tournament[] => {
    if (!tournaments) return [];

    switch (status) {
      case 'approved':
        return getApprovedTournaments();
      case 'ongoing':
        return getOngoingTournaments();
      case 'completed':
        return getCompletedTournaments();
      case 'processed':
        return getProcessedTournaments();
      default:
        return tournaments.filter((t) => t.status === status);
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

  const handleCreateTournament = async (
    data: TournamentFormData,
    customTimeControl: string,
    isCustomTimeControl: boolean
  ): Promise<boolean> => {
    try {
      // Add default values for missing properties
      const tournamentData = {
        ...data,
        registrationOpen: data.registrationOpen ?? true,
      };

      const success = await createTournament(
        tournamentData,
        customTimeControl,
        isCustomTimeControl
      );
      if (success) {
        setIsCreateTournamentOpen(false);
      }
      return success;
    } catch (error) {
      logMessage(
        LogLevel.ERROR,
        'NewOrganizerDashboard',
        'Error creating tournament:',
        error
      );
      return false;
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading tournaments...</div>;
  }

  if (loadError) {
    return (
      <div className="p-4 text-center text-red-600">Error: {loadError}</div>
    );
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
