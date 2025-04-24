
import { LoadingSpinner } from "@/components/LoadingSpinner";

export function DashboardLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner />
      <p className="ml-2">Loading dashboard...</p>
    </div>
  );
}
