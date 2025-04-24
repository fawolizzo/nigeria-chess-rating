
import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { validateTimeControl } from "@/utils/timeControlValidation";
import { Tournament } from "@/lib/mockData";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { getStorageItem, setStorageItem } from "@/utils/storage";
import { withTimeout } from "@/utils/monitorSync";

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const createTournament = useCallback(async (data: TournamentFormValues, customTimeControl: string, isCustomTimeControl: boolean) => {
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
      setIsLoading(true);
      
      // Get existing tournaments from enhanced storage
      const existingTournaments = await getStorageItem<Tournament[]>('tournaments', []);
      const updatedTournaments = [newTournament, ...existingTournaments];
      
      // Save to enhanced storage
      const saveSuccess = await setStorageItem('tournaments', updatedTournaments);
      
      if (!saveSuccess) {
        throw new Error("Failed to save tournament data to storage");
      }
      
      // Update state
      setTournaments((prev) => [newTournament, ...prev]);
      
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
    } finally {
      setIsLoading(false);
    }
  }, [tournaments, currentUser, toast]);

  const loadTournaments = useCallback(async () => {
    logMessage(LogLevel.INFO, 'useTournamentManager', 'Loading tournaments started');
    try {
      setIsLoading(true);
      setLoadError(null);
      
      // Get organizer ID for filtering
      const organizerId = currentUser?.id;
      if (!organizerId) {
        logMessage(LogLevel.ERROR, 'useTournamentManager', 'No organizer ID available');
        throw new Error('User not authenticated properly');
      }
      
      // Use withTimeout to prevent hanging operations
      const loadedTournaments = await withTimeout<Tournament[]>(
        async () => {
          // Fetch tournaments from enhanced storage
          const allTournaments = await getStorageItem<Tournament[]>('tournaments', []);
          
          if (Array.isArray(allTournaments)) {
            const myTournaments = allTournaments.filter(
              (t: Tournament) => t && t.organizerId === organizerId
            );
            
            logMessage(LogLevel.INFO, 'useTournamentManager', `Loaded ${myTournaments.length} tournaments for organizer ${organizerId}`);
            return myTournaments;
          } else {
            logMessage(LogLevel.WARNING, 'useTournamentManager', 'Tournament data in storage is not an array');
            return [];
          }
        },
        'Load Tournaments',
        10000, // 10-second timeout
        () => {
          setLoadError("Loading timed out. The tournament data took too long to load.");
          toast({
            title: "Loading Timeout",
            description: "Tournament data loading took too long. Please try again.",
            variant: "destructive",
          });
        }
      );
      
      // Update state with fetched tournaments if we got results
      if (loadedTournaments) {
        setTournaments(loadedTournaments);
        return loadedTournaments;
      } else {
        // If withTimeout returned undefined, it means the operation timed out or failed
        if (!loadError) {
          setLoadError("Failed to load tournament data. Please try again.");
        }
        return [];
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logMessage(LogLevel.ERROR, 'useTournamentManager', 'Error loading tournaments:', error);
      setLoadError(`Error loading tournaments: ${errorMessage}`);
      
      // Implement retry mechanism
      if (retryCount < maxRetries) {
        logMessage(LogLevel.INFO, 'useTournamentManager', `Retrying load (${retryCount + 1}/${maxRetries})`);
        setRetryCount(prev => prev + 1);
        
        // Wait before retrying
        setTimeout(() => {
          loadTournaments();
        }, 2000); // 2-second delay between retries
      } else {
        toast({
          title: "Error",
          description: `Failed to load tournaments after ${maxRetries} attempts. Please try again later.`,
          variant: "destructive",
        });
      }
      
      return [];
    } finally {
      setIsLoading(false);
      logMessage(LogLevel.INFO, 'useTournamentManager', 'Loading tournaments completed');
    }
  }, [currentUser?.id, retryCount, maxRetries, toast, loadError]);

  // Reset retry count when user changes
  useEffect(() => {
    setRetryCount(0);
  }, [currentUser?.id]);

  return {
    tournaments,
    isLoading,
    loadError,
    createTournament,
    loadTournaments,
    retry: () => {
      setRetryCount(0);
      return loadTournaments();
    },
  };
}
