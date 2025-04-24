
import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { validateTimeControl } from "@/utils/timeControlValidation";
import { Tournament } from "@/types/tournamentTypes";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { getStorageItem, setStorageItem } from "@/utils/storage";
import { withTimeout } from "@/utils/monitorSync";
import { supabase } from "@/integrations/supabase/client";

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

const CACHE_KEY = 'tournament_manager_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useTournamentManager() {
  const { toast } = useToast();
  const { currentUser } = useUser();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastSuccessfulLoad, setLastSuccessfulLoad] = useState<number | null>(null);
  const [cachedData, setCachedData] = useState<{data: Tournament[], timestamp: number} | null>(null);
  const maxRetries = 3;

  // Try to load cached data on init
  useEffect(() => {
    const loadCache = async () => {
      try {
        const cache = await getStorageItem<{data: Tournament[], timestamp: number}>(CACHE_KEY, null);
        if (cache && (Date.now() - cache.timestamp) < CACHE_DURATION) {
          setCachedData(cache);
          if (cache.data.length > 0 && !tournaments.length) {
            setTournaments(cache.data);
            logMessage(LogLevel.INFO, 'useTournamentManager', 'Loaded tournaments from cache', {
              count: cache.data.length
            });
          }
        }
      } catch (error) {
        // Silently fail, we'll load from main storage
      }
    };
    
    loadCache();
  }, [tournaments.length]);

  const cacheResults = useCallback(async (data: Tournament[]) => {
    try {
      await setStorageItem(CACHE_KEY, {
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      // Silently fail, not critical
    }
  }, []);

  const createTournament = useCallback(async (data: TournamentFormValues, customTimeControl: string, isCustomTimeControl: boolean) => {
    // Check for valid time control format
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
    
    // Validate dates are not in the past
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

    // Validate user is authenticated
    if (!currentUser?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create tournaments",
        variant: "destructive",
      });
      return false;
    }

    // Create new tournament object
    const newTournament: Tournament = {
      id: `${Date.now()}`,
      name: data.name,
      description: data.description,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      location: data.location,
      city: data.city,
      state: data.state,
      status: "upcoming",
      timeControl: finalTimeControl,
      rounds: data.rounds,
      organizerId: currentUser.id,
      // Add required fields from Tournament type
      venue: data.location,
      registrationOpen: true,
      createdAt: new Date().toISOString(),
      lastModified: Date.now()
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
      
      // Update state and cache
      setTournaments((prev) => [newTournament, ...prev]);
      await cacheResults([newTournament, ...tournaments]);
      
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
  }, [tournaments, currentUser, toast, cacheResults]);

  const loadTournaments = useCallback(async () => {
    // Early return if we have a recent successful load
    if (lastSuccessfulLoad && (Date.now() - lastSuccessfulLoad) < 30000 && tournaments.length > 0) {
      logMessage(LogLevel.INFO, 'useTournamentManager', 'Using recently loaded tournament data');
      return tournaments;
    }
    
    // Use cached data if we have it and there's an error
    if (retryCount >= maxRetries && cachedData) {
      logMessage(LogLevel.INFO, 'useTournamentManager', 'Using cached tournament data after retries');
      setTournaments(cachedData.data);
      return cachedData.data;
    }
    
    logMessage(LogLevel.INFO, 'useTournamentManager', 'Loading tournaments started', { retryAttempt: retryCount });
    try {
      setIsLoading(true);
      setLoadError(null);
      
      // Get organizer ID for filtering
      const organizerId = currentUser?.id;
      if (!organizerId) {
        logMessage(LogLevel.ERROR, 'useTournamentManager', 'No organizer ID available');
        throw new Error('User not authenticated properly');
      }
      
      // We're not using Supabase here since the table structure doesn't match our app
      // Instead, we'll use the mock data functions directly
      try {
        console.log('Attempting to load tournaments from storage');
        
        // Use withTimeout to prevent hanging operations when accessing local storage
        const loadedTournaments = await withTimeout<Tournament[]>(
          async () => {
            console.log('Loading tournaments from storage');
            
            try {
              // Fetch tournaments from enhanced storage
              const allTournaments = await getStorageItem<Tournament[]>('tournaments', []);
              
              if (!allTournaments || !Array.isArray(allTournaments)) {
                logMessage(LogLevel.WARNING, 'useTournamentManager', 'No tournaments found in storage, returning empty array');
                return [];
              }
              
              const myTournaments = allTournaments.filter(
                (t: Tournament) => t && t.organizerId === organizerId
              );
              
              console.log(`Successfully loaded ${myTournaments.length} tournaments for organizer ${organizerId}`);
              logMessage(LogLevel.INFO, 'useTournamentManager', `Loaded ${myTournaments.length} tournaments`);
              return myTournaments;
            } catch (storageError) {
              console.error('Error accessing storage:', storageError);
              logMessage(LogLevel.ERROR, 'useTournamentManager', 'Storage access failed', storageError);
              
              // Fallback to cache if available
              if (cachedData) {
                logMessage(LogLevel.INFO, 'useTournamentManager', 'Falling back to cached data');
                return cachedData.data;
              }
              
              // If no cache, return empty array instead of throwing
              return [];
            }
          },
          'Load Tournaments',
          10000, // 10-second timeout
          () => {
            setLoadError("Loading timed out. The tournament data took too long to load.");
            logMessage(LogLevel.ERROR, 'useTournamentManager', 'Loading tournaments timed out');
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
          setLastSuccessfulLoad(Date.now());
          await cacheResults(loadedTournaments);
          return loadedTournaments;
        } else {
          // If withTimeout returned undefined, it means the operation timed out or failed
          if (!loadError) {
            setLoadError("Failed to load tournament data. Please try again.");
          }
          return [];
        }
      } catch (error) {
        console.error('Failed to load tournaments:', error);
        throw error;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logMessage(LogLevel.ERROR, 'useTournamentManager', 'Error loading tournaments:', error);
      setLoadError(`Error loading tournaments: ${errorMessage}`);
      
      // Implement retry mechanism
      if (retryCount < maxRetries) {
        const retryDelay = 2000 * (retryCount + 1); // Increasing delay for each retry
        logMessage(LogLevel.INFO, 'useTournamentManager', `Retrying load in ${retryDelay}ms (${retryCount + 1}/${maxRetries})`);
        
        // Wait before retrying
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, retryDelay);
      } else {
        toast({
          title: "Error",
          description: `Failed to load tournaments after ${maxRetries} attempts. Please try again later.`,
          variant: "destructive",
        });
        
        // Try to use cache as last resort
        if (cachedData) {
          logMessage(LogLevel.INFO, 'useTournamentManager', 'Using cached data after all retries failed');
          setTournaments(cachedData.data);
          return cachedData.data;
        }
      }
      
      return [];
    } finally {
      setIsLoading(false);
      logMessage(LogLevel.INFO, 'useTournamentManager', 'Loading tournaments completed');
    }
  }, [currentUser?.id, retryCount, maxRetries, toast, loadError, lastSuccessfulLoad, tournaments, cachedData, cacheResults]);

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
      setLastSuccessfulLoad(null);
      return loadTournaments();
    },
  };
}
