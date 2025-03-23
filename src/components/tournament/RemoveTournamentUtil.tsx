
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

/**
 * Utility function to remove a specific tournament by name
 */
export const removeTournamentByName = (tournamentName: string) => {
  try {
    // Get all tournaments
    const allTournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
    
    // Filter out the tournament with the specified name
    const filteredTournaments = allTournaments.filter(
      (tournament: any) => !tournament.name.toLowerCase().includes(tournamentName.toLowerCase())
    );
    
    // Save the filtered tournaments back to localStorage
    localStorage.setItem('tournaments', JSON.stringify(filteredTournaments));
    
    return {
      success: true,
      removed: allTournaments.length - filteredTournaments.length
    };
  } catch (error) {
    console.error("Error removing tournament:", error);
    return {
      success: false,
      error: "Failed to remove tournament"
    };
  }
};

/**
 * Component that completely resets all data in the system
 */
export const ResetAllData = () => {
  const { toast } = useToast();
  
  // Use useEffect to avoid calling toast during render
  useEffect(() => {
    try {
      console.log("Starting COMPLETE system reset from ResetAllData component...");
      
      // List all localStorage keys before clearing
      const localStorageKeys = Object.keys(localStorage);
      console.log("Local storage keys to be cleared:", localStorageKeys);
      
      // List all sessionStorage keys before clearing
      const sessionStorageKeys = Object.keys(sessionStorage);
      console.log("Session storage keys to be cleared:", sessionStorageKeys);
      
      // Clear everything in localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Verify everything was cleared
      const remainingLocalKeys = Object.keys(localStorage);
      const remainingSessionKeys = Object.keys(sessionStorage);
      console.log("Remaining localStorage keys:", remainingLocalKeys);
      console.log("Remaining sessionStorage keys:", remainingSessionKeys);
      
      toast({
        title: "System Completely Reset",
        description: "All data has been cleared including rating officers, organizers, and players. All users need to register again.",
        duration: 5000,
      });
      
      // Reload the page after a delay
      setTimeout(() => {
        console.log("Reloading page after complete reset...");
        window.location.href = "/";
      }, 1500);
    } catch (error) {
      console.error("Error during complete system reset:", error);
      toast({
        title: "Reset Failed",
        description: "An error occurred during the reset. Please try again.",
        duration: 5000,
        variant: "destructive"
      });
    }
    
    return () => {
      console.log("ResetAllData component unmounted");
    };
  }, [toast]);
  
  return null;
};

export default ResetAllData;
