
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tournament } from "@/lib/mockData";
import { TournamentFormData } from "@/types/tournamentTypes";
import { OrganizerTabsWrapper } from "./dashboard/OrganizerTabsWrapper";

const NewOrganizerDashboard = () => {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isCreateTournamentOpen, setIsCreateTournamentOpen] = useState(false);
  const { toast } = useToast();

  const filterTournamentsByStatus = (status: string): Tournament[] => {
    return tournaments.filter(tournament => {
      switch (status) {
        case "upcoming":
          return tournament.status === "upcoming" || tournament.status === "pending";
        case "ongoing":
          return tournament.status === "ongoing";
        case "completed":
          return tournament.status === "completed";
        case "rejected":
          return tournament.status === "rejected";
        default:
          return true;
      }
    });
  };

  const handleCreateTournament = (
    data: TournamentFormData,
    customTimeControl: string,
    isCustomTimeControl: boolean
  ): boolean => {
    try {
      const newTournament: Tournament = {
        id: Date.now().toString(),
        name: data.name,
        description: data.description || "",
        startDate: data.startDate.toISOString().split('T')[0],
        endDate: data.endDate.toISOString().split('T')[0],
        location: data.location,
        city: data.city,
        state: data.state,
        organizerId: "current-organizer",
        status: "pending",
        timeControl: isCustomTimeControl ? customTimeControl : data.timeControl,
        rounds: data.rounds,
        currentRound: 1,
        participants: 0,
        registrationOpen: data.registrationOpen,
        players: [],
        pairings: [],
        results: [],
      };

      setTournaments(prev => [...prev, newTournament]);
      setIsCreateTournamentOpen(false);
      
      toast({
        title: "Tournament Created",
        description: "Your tournament has been submitted for approval.",
      });

      return true;
    } catch (error) {
      console.error("Error creating tournament:", error);
      toast({
        title: "Error",
        description: "Failed to create tournament. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleViewDetails = (id: string) => {
    console.log("View details for tournament:", id);
  };

  const handleManage = (id: string) => {
    console.log("Manage tournament:", id);
  };

  const onCreateTournament = () => {
    setIsCreateTournamentOpen(true);
  };

  return (
    <OrganizerTabsWrapper
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      filterTournamentsByStatus={filterTournamentsByStatus}
      onCreateTournament={onCreateTournament}
      onViewDetails={handleViewDetails}
      onManage={handleManage}
      isCreateTournamentOpen={isCreateTournamentOpen}
      setIsCreateTournamentOpen={setIsCreateTournamentOpen}
      handleCreateTournament={handleCreateTournament}
    />
  );
};

export default NewOrganizerDashboard;
export { NewOrganizerDashboard };
