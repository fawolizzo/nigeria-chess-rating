
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Tournament } from "@/types/tournamentTypes";

interface TournamentGridProps {
  tournaments: Tournament[];
}

export function TournamentGrid({ tournaments }: TournamentGridProps) {
  const navigate = useNavigate();

  if (tournaments.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-600">No tournaments yet. Create your first tournament!</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tournaments.map((tournament) => (
        <Card key={tournament.id} className="p-6">
          <h3 className="text-lg font-semibold">{tournament.name}</h3>
          <p className="text-gray-600">{tournament.status}</p>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => navigate(`/tournaments/${tournament.id}`)}
            >
              View Details
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
