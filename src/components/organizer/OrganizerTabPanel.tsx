
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
  if (!tournaments.length) {
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
