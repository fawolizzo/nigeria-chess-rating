
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

    if (!currentUser?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create tournaments",
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
      organizerId: currentUser.id
    };
    
    try {
      // Get existing tournaments and add the new one
      const existingTournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
      const updatedTournaments = [newTournament, ...existingTournaments];
      
      // Save to local storage
      localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
      
      // Update state
      setTournaments([newTournament, ...tournaments]);
      
      toast({
        title: "Tournament Created",
        description: `${data.name} has been submitted for approval.`,
      });
      
      return true;
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useTournamentManager', 'Error creating tournament:', error);
      
      toast({
        title: "Error",
        description: "Failed to create tournament. Please try again.",
        variant: "destructive",
      });
      
      return false;
    }
  }, [tournaments, currentUser, toast]);

  const loadTournaments = useCallback(async () => {
    logMessage(LogLevel.INFO, 'useTournamentManager', 'Loading tournaments started');
    try {
      setIsLoading(true);
      
      // Get organizer ID for filtering
      const organizerId = currentUser?.id;
      if (!organizerId) {
        logMessage(LogLevel.ERROR, 'useTournamentManager', 'No organizer ID available');
        throw new Error('User not authenticated properly');
      }
      
      // Fetch tournaments from local storage
      let myTournaments: Tournament[] = [];
      try {
        const savedTournamentsStr = localStorage.getItem('tournaments');
        if (savedTournamentsStr) {
          const allTournaments = JSON.parse(savedTournamentsStr);
          
          if (Array.isArray(allTournaments)) {
            myTournaments = allTournaments.filter(
              (t: Tournament) => t && t.organizerId === organizerId
            );
            
            logMessage(LogLevel.INFO, 'useTournamentManager', `Loaded ${myTournaments.length} tournaments for organizer ${organizerId}`);
          } else {
            logMessage(LogLevel.WARNING, 'useTournamentManager', 'Tournaments data in localStorage is not an array');
          }
        } else {
          logMessage(LogLevel.INFO, 'useTournamentManager', 'No tournaments found in storage');
        }
      } catch (error) {
        logMessage(LogLevel.ERROR, 'useTournamentManager', 'Error parsing tournaments from localStorage:', error);
        throw new Error('Failed to load tournaments data');
      }
      
      // Update state with fetched tournaments
      setTournaments(myTournaments);
      
      return myTournaments;
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useTournamentManager', 'Error loading tournaments:', error);
      throw error; // Re-throw to be caught by the component
    } finally {
      setIsLoading(false);
      logMessage(LogLevel.INFO, 'useTournamentManager', 'Loading tournaments completed');
    }
  }, [currentUser?.id]);

  return {
    tournaments,
    isLoading,
    createTournament,
    loadTournaments,
  };
}
