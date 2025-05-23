
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useUser } from "@/contexts/UserContext";
import OfficerDashboardContent from "@/components/officer/OfficerDashboardContent";
import OfficerDashboardHeader from "@/components/officer/OfficerDashboardHeader";
import ResetSystemData from "@/components/ResetSystemData";
import SyncStatusIndicator from "@/components/SyncStatusIndicator";
import { useToast } from "@/hooks/use-toast";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const OfficerDashboard: React.FC = () => {
  const { currentUser, isLoading: isUserLoading, logout, forceSync } = useUser();
  const navigate = useNavigate();
  // const [isContentLoading, setIsContentLoading] = useState(true); // Replaced by initialAuthCheckTimedOut logic
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const refreshToastIdRef = useRef<string | null>(null);
  
  const [initialAuthCheckTimedOut, setInitialAuthCheckTimedOut] = useState(false);
  const initializedRef = useRef(false); // To ensure main auth logic runs once

  // Safety timeout for initial authentication check
  useEffect(() => {
    // Only run this timeout if user loading is in progress and we haven't initialized yet
    if (isUserLoading && !initializedRef.current) {
      const timer = setTimeout(() => {
        logMessage(LogLevel.WARNING, 'OfficerDashboard', 'Initial auth check has timed out.');
        setInitialAuthCheckTimedOut(true);
      }, 5000); // 5-second timeout

      return () => clearTimeout(timer);
    }
  }, [isUserLoading]);

  // Prevent access for non-rating officers and handle redirects
  useEffect(() => {
    // If user loading is complete or the auth check has timed out, then proceed with checks.
    if ((!isUserLoading || initialAuthCheckTimedOut) && !initializedRef.current) {
      initializedRef.current = true; // Mark that we've run this logic block

      if (!currentUser) {
        logMessage(LogLevel.WARNING, 'OfficerDashboard', 'No current user after loading/timeout, redirecting to login.');
        navigate("/login", { replace: true });
        return;
      }
      
      if (currentUser.role !== "rating_officer") {
        logMessage(LogLevel.WARNING, 'OfficerDashboard', `User role is ${currentUser.role}, not rating_officer. Redirecting.`);
        toast({
          title: "Access Denied",
          description: "This page is only accessible to Rating Officers.",
          variant: "destructive",
        });
        
        if (currentUser.role === "tournament_organizer") {
          if (currentUser.status === "approved") {
            navigate("/organizer-dashboard", { replace: true });
          } else {
            navigate("/pending-approval", { replace: true });
          }
        } else {
          navigate("/", { replace: true });
        }
        return;
      }
      // If user is a rating officer, no navigation needed from here.
      // The component will proceed to render the dashboard.
    }
  }, [currentUser, isUserLoading, initialAuthCheckTimedOut, navigate, toast]);
  
  const handleSystemReset = () => {
    logout();
    navigate("/login", { replace: true });
  };
  
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    
    if (!refreshToastIdRef.current) {
      const toastInstance = toast({
        title: "Refreshing Data",
        description: "The dashboard data is being refreshed...",
        duration: 3000, // Keep it open a bit longer initially
      });
      refreshToastIdRef.current = toastInstance.id;
    }
    
    try {
      await forceSync();
      toast({
        title: "Data Refreshed",
        description: "The dashboard data has been refreshed successfully.",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Refresh Failed",
        description: "There was an error refreshing the data. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsRefreshing(false);
      refreshToastIdRef.current = null; // Clear ref after operation
    }
  };
  
  // Show loading spinner only if user is loading AND the auth check hasn't timed out.
  if (isUserLoading && !initialAuthCheckTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="flex flex-col items-center">
          <LoadingSpinner size="lg" className="border-nigeria-green" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Checking credentials...</p>
        </div>
      </div>
    );
  }
  
  // If user is not a rating_officer or no user (after loading/timeout), render null.
  // The useEffect above will handle redirection.
  if (!currentUser || currentUser.role !== "rating_officer") {
    return null; // Redirection is handled by the useEffect
  }
  
  // Render dashboard content if user is authenticated and authorized
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="container pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <OfficerDashboardHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />
        
        <div className="mb-6">
          <SyncStatusIndicator prioritizeUserData={true} />
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <OfficerDashboardContent />
        </div>
        
        <div className="mt-8">
          <ResetSystemData onReset={handleSystemReset} />
        </div>
      </div>
    </div>
  );
};

export default OfficerDashboard;
