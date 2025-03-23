
import { useEffect } from "react";
import { clearAllStoredData } from "@/lib/mockData";
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
    // Clear everything in localStorage
    localStorage.clear();
    
    toast({
      title: "System Completely Reset",
      description: "All data has been cleared including rating officers, organizers, and players. All users need to register again.",
      duration: 5000,
    });
    
    // Reload the page after a delay
    setTimeout(() => {
      window.location.href = "/";
    }, 1500);
  }, []);
  
  return null;
};

export default ResetAllData;
