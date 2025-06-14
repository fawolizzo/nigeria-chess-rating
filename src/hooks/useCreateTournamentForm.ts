
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { createTournament } from "@/services/tournamentService";
import { useUser } from "@/contexts/UserContext";

interface TournamentFormData {
  name: string;
  description: string;
  location: string;
  city: string;
  state: string;
  rounds: number;
  startDate: Date;
  endDate: Date;
  timeControl: string;
  registrationOpen: boolean;
}

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
      const timeControlValue = isCustomTimeControl && customTimeControl ? customTimeControl : formData.timeControl;
      
      const tournamentData = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        city: formData.city,
        state: formData.state,
        rounds: formData.rounds,
        start_date: formData.startDate.toISOString(),
        end_date: formData.endDate.toISOString(),
        time_control: timeControlValue,
        organizer_id: currentUser.id,
        registration_open: formData.registrationOpen,
        status: "pending" as const,
      };

      await createTournament(tournamentData);
      
      toast({
        title: "Tournament Created",
        description: "Your tournament has been submitted for approval",
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createTournamentFromForm,
    isSubmitting,
  };
};
