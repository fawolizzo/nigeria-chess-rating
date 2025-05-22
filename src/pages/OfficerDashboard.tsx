
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
  const [isContentLoading, setIsContentLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const refreshToastIdRef = useRef<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxLoadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const authCheckCompletedRef = useRef(false);
  
  // Force-complete loading after a maximum time to prevent stuck loading state
  useEffect(() => {
    // Set an absolute maximum loading time
    maxLoadingTimeoutRef.current = setTimeout(() => {
      if (isContentLoading || isUserLoading) {
        logMessage(LogLevel.WARNING, 'OfficerDashboard', 'Forcing completion after maximum timeout');
        authCheckCompletedRef.current = true;
        setIsContentLoading(false);
      }
    }, 3000); // Hard limit of 3 seconds
    
    return () => {
      if (maxLoadingTimeoutRef.current) {
        clearTimeout(maxLoadingTimeoutRef.current);
      }
    };
  }, [isContentLoading, isUserLoading]);
  
  // Prevent access for non-rating officers and handle redirects
  useEffect(() => {
    // If auth check is still in progress, set a reasonable timeout
    if (isUserLoading) {
      loadingTimeoutRef.current = setTimeout(() => {
        authCheckCompletedRef.current = true;
        if (!currentUser) {
          logMessage(LogLevel.WARNING, 'OfficerDashboard', 'Auth check timed out, redirecting to login');
          navigate("/login");
        }
      }, 2000); // 2 second timeout for auth check
    } else {
      authCheckCompletedRef.current = true;
      
      if (!currentUser) {
        logMessage(LogLevel.WARNING, 'OfficerDashboard', 'No current user, redirecting to login');
        navigate("/login");
        return;
      }
      
      if (currentUser.role !== "rating_officer") {
        logMessage(LogLevel.WARNING, 'OfficerDashboard', `User role is ${currentUser.role}, not rating_officer`);
        toast({
          title: "Access Denied",
          description: "This page is only accessible to Rating Officers",
          variant: "destructive",
        });
        
        // Redirect based on user role
        if (currentUser.role === "tournament_organizer") {
          if (currentUser.status === "approved") {
            navigate("/organizer-dashboard");
          } else {
            navigate("/pending-approval");
          }
        } else {
          navigate("/");
        }
        return;
      }
      
      logMessage(LogLevel.INFO, 'OfficerDashboard', `Rating officer logged in: ${currentUser.email}`);
      
      // Clear initial content loading state after short delay
      loadingTimeoutRef.current = setTimeout(() => {
        setIsContentLoading(false);
      }, 500);
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [currentUser, isUserLoading, navigate, toast]);
  
  const handleSystemReset = () => {
    // Log out the current user after reset
    logout();
    navigate("/login");
  };
  
  const handleRefresh = async () => {
    try {
      // If already refreshing, don't start another refresh operation
      if (isRefreshing) return;
      
      setIsRefreshing(true);
      
      // Only show toast if there's no toast currently shown
      if (!refreshToastIdRef.current) {
        // Show refresh toast and store its ID
        const toastInstance = toast({
          title: "Refreshing Data",
          description: "The dashboard data is being refreshed...",
          duration: 3000,
        });
        refreshToastIdRef.current = toastInstance.id;
      }
      
      await forceSync();
      
      // Show success toast
      toast({
        title: "Data Refreshed",
        description: "The dashboard data has been refreshed successfully.",
        duration: 2000,
      });
      
      // Clear the toast ID after successful completion
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
  
  // Show minimal loading state that auto-completes after a maximum time
  if ((isUserLoading && !authCheckCompletedRef.current) || 
      (!currentUser && !authCheckCompletedRef.current)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="flex flex-col items-center">
          <LoadingSpinner size="lg" className="border-nigeria-green" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Checking credentials...</p>
        </div>
      </div>
    );
  }
  
  // User authentication check
  if (!currentUser || currentUser.role !== "rating_officer") {
    return null; // Will be redirected by useEffect
  }
  
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
