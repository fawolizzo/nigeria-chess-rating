
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { validateTimeControl } from "@/utils/timeControlValidation";
import { Tournament } from "@/lib/mockData";
import { logMessage, LogLevel } from "@/utils/debugLogger";

export interface TournamentFormValues {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  city: string;
  state: string;
  rounds: number;
  timeControl: string;
}

export function useTournamentManager() {
  const { toast } = useToast();
  const { currentUser } = useUser();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const createTournament = useCallback((data: TournamentFormValues, customTimeControl: string, isCustomTimeControl: boolean) => {
    if (isCustomTimeControl) {
      const validation = validateTimeControl(customTimeControl);
      if (!validation.isValid) {
        toast({
          title: "Invalid Time Control",
          description: validation.error,
          variant: "destructive",
        });
        return false;
      }
    }

    const finalTimeControl = isCustomTimeControl ? customTimeControl : data.timeControl;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(data.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(data.endDate);
    endDate.setHours(0, 0, 0, 0);
    
    if (startDate < today || endDate < today) {
      toast({
        title: "Error",
        description: "Tournament dates cannot be in the past",
        variant: "destructive",
      });
      return false;
    }

    const newTournament: Tournament = {
      id: `${Date.now()}`,
      name: data.name,
      description: data.description,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      location: data.location,
      city: data.city,
      state: data.state,
      status: "pending",
      timeControl: finalTimeControl,
      rounds: data.rounds,
      organizerId: currentUser?.id || ""
    };
    
    const existingTournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
    const updatedTournaments = [newTournament, ...existingTournaments];
    localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
    setTournaments([newTournament, ...tournaments]);
    
    toast({
      title: "Tournament Created",
      description: `${data.name} has been submitted for approval.`,
    });
    
    return true;
  }, [tournaments, currentUser, toast]);

  const loadTournaments = useCallback(() => {
    try {
      setIsLoading(true);
      const savedTournaments = localStorage.getItem('tournaments');
      if (savedTournaments) {
        const allTournaments = JSON.parse(savedTournaments);
        const myTournaments = allTournaments.filter(
          (tournament: Tournament) => tournament.organizerId === currentUser?.id
        );
        setTournaments(myTournaments);
        logMessage(LogLevel.INFO, 'useTournamentManager', `Loaded ${myTournaments.length} tournaments`);
      }
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useTournamentManager', 'Error loading tournaments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  return {
    tournaments,
    isLoading,
    createTournament,
    loadTournaments,
  };
}
