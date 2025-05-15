
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import Navbar from "@/components/Navbar";
import { NewOrganizerDashboard } from "@/components/organizer/NewOrganizerDashboard";
import { DashboardErrorBoundary } from "@/components/dashboard/DashboardErrorBoundary";
import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { useToast } from "@/hooks/use-toast";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function OrganizerDashboardPage() {
  const { currentUser, isLoading: isUserLoading } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check authentication and role
  useEffect(() => {
    if (!isUserLoading) {
      if (!currentUser) {
        logMessage(LogLevel.WARNING, 'OrganizerDashboard', 'No user found, redirecting to login');
        navigate('/login');
        return;
      }
      
      logMessage(LogLevel.INFO, 'OrganizerDashboard', 'Checking auth for user', { 
        email: currentUser.email,
        role: currentUser.role,
        status: currentUser.status
      });
      
      if (currentUser.role !== 'tournament_organizer') {
        logMessage(LogLevel.WARNING, 'OrganizerDashboard', 'User is not a tournament organizer', {
          role: currentUser.role
        });
        
        toast({
          title: "Access Denied",
          description: "You must be a tournament organizer to access this page.",
          variant: "destructive",
        });
        
        // Redirect based on role
        if (currentUser.role === 'rating_officer') {
          navigate('/officer-dashboard');
        } else {
          navigate('/');
        }
        return;
      }
      
      if (currentUser.status !== 'approved') {
        logMessage(LogLevel.WARNING, 'OrganizerDashboard', 'Tournament organizer not approved', {
          status: currentUser.status
        });
        navigate('/pending-approval');
        return;
      }
    }
  }, [currentUser, isUserLoading, navigate, toast]);
  
  // Show loading state while checking user authentication
  if (isUserLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="container pt-24 pb-20 px-4 max-w-7xl mx-auto">
          <DashboardLoadingState progress={30} message="Checking authorization..." />
        </div>
      </div>
    );
  }
  
  // Render nothing if authentication redirects are in progress
  if (currentUser.role !== 'tournament_organizer' || currentUser.status !== 'approved') {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="container pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <ErrorBoundary>
            <NewOrganizerDashboard 
              userId={currentUser.id} 
              userName={currentUser.fullName || currentUser.email.split('@')[0]}
            />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
