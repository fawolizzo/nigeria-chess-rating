
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface OrganizerDashboardHeaderProps {
  userName?: string;
  onCreateTournament: () => void;
}

export function OrganizerDashboardHeader({
  userName,
  onCreateTournament
}: OrganizerDashboardHeaderProps) {
  return (
    <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome, {userName}!
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Manage your tournaments and submissions
        </p>
      </div>
      
      <Button 
        onClick={onCreateTournament}
        className="mt-4 sm:mt-0 bg-nigeria-green hover:bg-nigeria-green-dark text-white"
      >
        <Plus className="mr-2 h-4 w-4" />
        Create Tournament
      </Button>
    </div>
  );
}
