
import { Button } from "@/components/ui/button";
import { Plus, LogOut } from "lucide-react";

interface OrganizerDashboardHeaderProps {
  userName?: string;
  onCreateTournament: () => void;
  onLogout: () => void;
}

export function OrganizerDashboardHeader({
  userName,
  onCreateTournament,
  onLogout
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
      
      <div className="mt-4 sm:mt-0 flex space-x-4">
        <Button 
          onClick={onCreateTournament}
          className="bg-nigeria-green hover:bg-nigeria-green-dark text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Tournament
        </Button>
        <Button 
          onClick={onLogout}
          variant="outline"
          className="border-nigeria-green/30 text-nigeria-green hover:bg-nigeria-green/5"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
