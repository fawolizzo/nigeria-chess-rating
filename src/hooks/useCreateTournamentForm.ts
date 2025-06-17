
import { useState } from "react";
import { createTournament } from "@/services/tournamentService";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { TournamentFormData } from "@/components/tournament/form/TournamentFormSchema";

export const useCreateTournamentForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useUser();

  const createTournamentFromForm = async (
    formData: TournamentFormData,
    customTimeControl?: string,
    isCustomTimeControl?: boolean
  ): Promise<boolean> => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to create a tournament",
        variant: "destructive",
      });
      return false;
    }

    setIsSubmitting(true);

    try {
      const timeControl = isCustomTimeControl && customTimeControl 
        ? customTimeControl 
        : formData.timeControl;

      const tournamentData = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        city: formData.city,
        state: formData.state,
        rounds: formData.rounds,
        start_date: formData.startDate,
        end_date: formData.endDate,
        time_control: timeControl,
        organizer_id: currentUser.id,
        registration_open: true,
        status: "pending" as const,
        participants: 0,
        current_round: 1,
        players: [],
        pairings: [],
        results: []
      };

      console.log("🏆 Creating tournament with data:", tournamentData);

      const tournament = await createTournament(tournamentData);

      toast({
        title: "Tournament Created",
        description: `${tournament.name} has been created successfully and is pending approval.`,
      });

      return true;
    } catch (error) {
      console.error("❌ Tournament creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create tournament. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createTournamentFromForm,
    isSubmitting,
  };
};
