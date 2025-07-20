import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tournament } from '@/lib/mockData';
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateTournamentInSupabase } from '@/services/tournamentService';

interface PendingTournamentApprovalsProps {
  tournaments: Tournament[];
  onApprovalUpdate: () => void;
}

const PendingTournamentApprovals: React.FC<PendingTournamentApprovalsProps> = ({
  tournaments,
  onApprovalUpdate,
}) => {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleApproval = async (tournamentId: string, approved: boolean) => {
    if (processingIds.has(tournamentId)) return;

    setProcessingIds((prev) => new Set(prev).add(tournamentId));

    try {
      const newStatus = approved ? 'approved' : 'rejected';
      await updateTournamentInSupabase(tournamentId, { status: newStatus });

      toast({
        title: approved ? 'Tournament Approved' : 'Tournament Rejected',
        description: `The tournament has been ${approved ? 'approved' : 'rejected'}.`,
      });

      onApprovalUpdate();
    } catch (error) {
      console.error('Error updating tournament:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tournament status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(tournamentId);
        return newSet;
      });
    }
  };

  if (tournaments.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-md">
        <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No pending tournaments
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Tournament approval requests will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">
        Pending Tournament Approvals
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((tournament) => (
          <div
            key={tournament.id}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {tournament.name}
              </h3>
              <Badge
                variant="outline"
                className="bg-yellow-50 text-yellow-600 border-yellow-200"
              >
                Pending
              </Badge>
            </div>

            <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>
                  {tournament.start_date} - {tournament.end_date}
                </span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{tournament.location}</span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                <span>{tournament.participants} participants</span>
              </div>
              <div className="flex items-center">
                <Trophy className="h-4 w-4 mr-2" />
                <span>{tournament.rounds} rounds</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>{tournament.time_control}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleApproval(tournament.id, true)}
                disabled={processingIds.has(tournament.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleApproval(tournament.id, false)}
                disabled={processingIds.has(tournament.id)}
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingTournamentApprovals;
