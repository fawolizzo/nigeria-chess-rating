
import { Award } from "lucide-react";

export function EmptyTabPanel({ status, onCreateTournament }: { status: string, onCreateTournament: () => void }) {
  return (
    <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
      <Award className="h-12 w-12 mx-auto text-gray-400" />
      <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
        No {status} tournaments
      </h3>
      <p className="mt-1 text-gray-500 dark:text-gray-400">
        {status === "pending" 
          ? "You don't have any tournaments waiting for approval."
          : status === "rejected"
            ? "You don't have any rejected tournaments."
            : `You don't have any ${status} tournaments scheduled.`
        }
      </p>
    </div>
  );
}
