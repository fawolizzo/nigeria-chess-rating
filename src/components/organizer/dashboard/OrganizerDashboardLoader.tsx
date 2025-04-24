
import React from "react";
import OrganizerDashboardSkeleton from "@/components/organizer/OrganizerDashboardSkeleton";
import Navbar from "@/components/Navbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export function OrganizerDashboardLoader({
  isLoading,
  hasTimedOut,
  loadError,
  onRetry,
  onLogout,
}: {
  isLoading: boolean;
  hasTimedOut: boolean;
  loadError: string | null;
  onRetry: () => void;
  onLogout: () => void;
}) {
  if (isLoading) {
    return <OrganizerDashboardSkeleton onManualReload={onRetry} />;
  }

  if (hasTimedOut || loadError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="max-w-7xl mx-auto pt-28 pb-20 px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Loading Error</AlertTitle>
            <AlertDescription>
              {loadError || "We couldn't load your tournament data. This might be due to network issues or server problems."}
            </AlertDescription>
          </Alert>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Unable to load your tournaments</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We're having trouble loading your tournament information. Please try again or contact support if the problem persists.
            </p>
            <div className="flex justify-center gap-4">
              <Button 
                onClick={onRetry}
                className="bg-nigeria-green hover:bg-nigeria-green-dark text-white flex items-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Retry Loading
              </Button>
              <Button 
                onClick={onLogout}
                variant="outline"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
