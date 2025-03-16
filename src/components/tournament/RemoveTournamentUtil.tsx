
import { useEffect } from "react";
import { getAllTournaments, saveTournaments } from "@/lib/mockData";
import { toast } from "@/components/ui/use-toast";

/**
 * Utility function to remove a specific tournament by name
 */
export const removeTournamentByName = (tournamentName: string) => {
  try {
    // Get all tournaments
    const allTournaments = getAllTournaments();
    
    // Filter out the tournament with the specified name
    const filteredTournaments = allTournaments.filter(
      tournament => !tournament.name.toLowerCase().includes(tournamentName.toLowerCase())
    );
    
    // Save the filtered tournaments back to localStorage
    saveTournaments(filteredTournaments);
    
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
 * Component to execute the removal and show a toast notification
 */
const RemoveTournamentUtil = () => {
  // Use useEffect to avoid calling toast during render
  useEffect(() => {
    const result = removeTournamentByName("Osun rapid");
    
    if (result.success) {
      toast({
        title: "Tournament Removed",
        description: `Successfully removed ${result.removed} tournament(s) containing "Osun rapid"`,
      });
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  }, []);
  
  return null;
};

export default RemoveTournamentUtil;
