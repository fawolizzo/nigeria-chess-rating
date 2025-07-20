import { Award, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyTabPanel({
  status,
  onCreateTournament,
}: {
  status: string;
  onCreateTournament: () => void;
}) {
  return (
    <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
      <Award className="h-12 w-12 mx-auto text-gray-400" />
      <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
        No {status} tournaments
      </h3>
      <p className="mt-1 text-gray-500 dark:text-gray-400">
        {status === 'approved'
          ? "You don't have any tournaments ready to start. Create your first tournament!"
          : status === 'ongoing'
            ? "You don't have any tournaments currently running."
            : status === 'completed'
              ? "You don't have any completed tournaments waiting for rating processing."
              : status === 'processed'
                ? "You don't have any tournaments that have been rated yet."
                : `You don't have any ${status} tournaments.`}
      </p>

      {/* Show Create Tournament button only for approved status */}
      {status === 'approved' && (
        <div className="mt-6">
          <Button
            onClick={onCreateTournament}
            className="bg-nigeria-green hover:bg-nigeria-green-dark text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Tournament
          </Button>
        </div>
      )}
    </div>
  );
}
