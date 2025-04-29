
import { LoadingSpinner } from "@/components/LoadingSpinner";

export function DashboardLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <LoadingSpinner />
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
    </div>
  );
}
