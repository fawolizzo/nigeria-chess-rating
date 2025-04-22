
import { TournamentDashboardCard } from "@/components/tournament/TournamentDashboardCard";
import { EmptyTabPanel } from "./EmptyTabPanel";

export function OrganizerTabPanel({
  tournaments,
  status,
  onCreateTournament,
  onViewDetails,
  onManage
}: {
  tournaments: any[];
  status: string;
  onCreateTournament: () => void;
  onViewDetails: (id: string) => void;
  onManage: (id: string) => void;
}) {
  // Add more detailed debug logging to diagnose issues
  console.log(`OrganizerTabPanel - Status: ${status}, Tournaments count:`, tournaments?.length || 0);
  if (!tournaments || tournaments.length === 0) {
    console.log(`No tournaments found for status: ${status}`);
  } else {
    console.log(`First tournament for ${status}:`, tournaments[0]?.name || 'Unknown name');
  }
  
  if (!tournaments || !tournaments.length) {
    return (
      <EmptyTabPanel status={status} onCreateTournament={onCreateTournament} />
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {tournaments.map((tournament) => (
        <TournamentDashboardCard
          key={tournament.id}
          tournament={tournament}
          onViewDetails={onViewDetails}
          onManage={onManage}
        />
      ))}
    </div>
  );
}
