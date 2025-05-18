
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useUser } from "@/contexts/UserContext";
import { NewOfficerDashboard } from "@/components/officer/NewOfficerDashboard";
import { DashboardErrorBoundary } from "@/components/dashboard/DashboardErrorBoundary";
import { Button } from "@/components/ui/button";
import { RefreshCw, Beaker } from "lucide-react";
import { Link } from "react-router-dom";
import ResetSystemData from "@/components/ResetSystemData";
import { useToast } from "@/hooks/use-toast";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { OfficerDashboardProvider } from "@/contexts/officer/OfficerDashboardContext";

export default function OfficerDashboardPage() {
  const { currentUser, isLoading: isUserLoading, logout, forceSync } = useUser();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const refreshToastIdRef = useRef<string | null>(null);
  const loginAttemptedRef = useRef(false);
  
  // Check authentication and role
  useEffect(() => {
    if (!isUserLoading) {
      if (!currentUser) {
        if (!loginAttemptedRef.current) {
          loginAttemptedRef.current = true;
          logMessage(LogLevel.WARNING, 'OfficerDashboard', 'No current user, redirecting to login');
          navigate("/login");
        }
        return;
      }
      
      if (currentUser.role !== "rating_officer") {
        logMessage(LogLevel.WARNING, 'OfficerDashboard', 
          `Access denied: User role is ${currentUser.role}, not rating_officer`);
          
        toast({
          title: "Access Denied",
          description: "This page is only accessible to Rating Officers",
          variant: "destructive",
        });
        
        // Redirect based on role
        if (currentUser.role === "tournament_organizer") {
          navigate(currentUser.status === "approved" ? "/organizer-dashboard" : "/pending-approval");
        } else {
          navigate("/");
        }
      }
    }
  }, [currentUser, isUserLoading, navigate, toast]);
  
  // Handle manual data refresh
  const handleRefresh = async () => {
    try {
      // If already refreshing, don't start another refresh operation
      if (isRefreshing) return;
      
      setIsRefreshing(true);
      
      // Only show toast if none is currently shown
      if (!refreshToastIdRef.current) {
        // Show toast with a unique ID and store the reference
        const toastInstance = toast({
          title: "Refreshing Data",
          description: "The dashboard data is being refreshed...",
          duration: 3000,
        });
        refreshToastIdRef.current = toastInstance.id;
      }
      
      await forceSync();
      
      // Show success toast and clear the refresh toast ID
      toast({
        title: "Data Refreshed",
        description: "The dashboard data has been refreshed successfully.",
        duration: 2000,
      });
      
      // Clear the toast ID reference
      refreshToastIdRef.current = null;
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Refresh Failed",
        description: "There was an error refreshing the data. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
      refreshToastIdRef.current = null;
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Handle system reset
  const handleSystemReset = () => {
    logout();
    navigate("/login");
  };
  
  // Show loading state while checking user authentication
  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 rounded-full border-2 border-nigeria-green border-t-transparent animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Checking credentials...</p>
        </div>
      </div>
    );
  }
  
  // Render nothing if authentication redirects are in progress
  if (!currentUser || currentUser.role !== "rating_officer") {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="container pt-24 pb-20 px-4 max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Rating Officer Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage tournaments, players, and rating calculations</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              onClick={handleRefresh}
              className="h-9"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Data
                </>
              )}
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              asChild
              className="h-9"
            >
              <Link to="/system-testing">
                <Beaker className="mr-2 h-4 w-4" />
                System Testing
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Dashboard Content */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <DashboardErrorBoundary>
            <OfficerDashboardProvider>
              <NewOfficerDashboard />
            </OfficerDashboardProvider>
          </DashboardErrorBoundary>
        </div>
        
        {/* System Reset */}
        <div className="mt-8">
          <ResetSystemData onReset={handleSystemReset} />
        </div>
      </div>
    </div>
  );
}
