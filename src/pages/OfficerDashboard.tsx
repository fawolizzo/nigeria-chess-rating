
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useUser } from "@/contexts/UserContext";
import DashboardContainer from "@/components/officer/dashboard/DashboardContainer";
import { OfficerDashboardProvider } from "@/contexts/officer/OfficerDashboardContext";
import ResetSystemData from "@/components/ResetSystemData";
import SyncStatusIndicator from "@/components/SyncStatusIndicator";
import { useToast } from "@/hooks/use-toast";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const OfficerDashboard: React.FC = () => {
  const { currentUser, isLoading: isUserLoading, logout, forceSync } = useUser();
  const navigate = useNavigate();
  const [isContentLoading, setIsContentLoading] = useState(true);
  const { toast } = useToast();
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxLoadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const authCheckCompletedRef = useRef(false);
  const forceAuthFinishedRef = useRef(false);
  
  // Force-complete loading after a maximum time to absolutely prevent stuck loading state
  useEffect(() => {
    // Set an absolute maximum loading time - even shorter than before
    maxLoadingTimeoutRef.current = setTimeout(() => {
      if (!forceAuthFinishedRef.current) {
        logMessage(LogLevel.WARNING, 'OfficerDashboard', 'Forcing auth check completion after absolute maximum timeout');
        forceAuthFinishedRef.current = true;
        authCheckCompletedRef.current = true;
        setIsContentLoading(false);
        
        // If by this point we still don't have a user and we're on the officer dashboard page,
        // force navigate to login
        if (!currentUser) {
          logMessage(LogLevel.WARNING, 'OfficerDashboard', 'No user after maximum timeout, redirecting to login');
          navigate("/login");
        }
      }
    }, 2000); // Even shorter hard limit of 2 seconds
    
    return () => {
      if (maxLoadingTimeoutRef.current) {
        clearTimeout(maxLoadingTimeoutRef.current);
      }
    };
  }, [navigate, currentUser]);
  
  // Prevent access for non-rating officers and handle redirects
  useEffect(() => {
    // Clear loading state immediately if user is already loaded
    if (!isUserLoading && currentUser) {
      authCheckCompletedRef.current = true;
      setIsContentLoading(false);
      
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
      }
    }
    
    // If auth check is still in progress, set an even shorter timeout (1.5 seconds)
    if (isUserLoading && !authCheckCompletedRef.current) {
      loadingTimeoutRef.current = setTimeout(() => {
        authCheckCompletedRef.current = true;
        setIsContentLoading(false);
        
        if (!currentUser) {
          logMessage(LogLevel.WARNING, 'OfficerDashboard', 'Auth check timed out, redirecting to login');
          navigate("/login");
        }
      }, 1500); // 1.5 second timeout for auth check - shorter than before
    } else if (!isUserLoading && !currentUser) {
      // If user is not loading but we have no user, redirect immediately
      authCheckCompletedRef.current = true;
      logMessage(LogLevel.WARNING, 'OfficerDashboard', 'No current user, redirecting to login');
      navigate("/login");
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
  
  // Show minimal loading state that auto-completes after a maximum time
  if ((isUserLoading && !authCheckCompletedRef.current) || 
      (!currentUser && !authCheckCompletedRef.current && !forceAuthFinishedRef.current)) {
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
    // Will be redirected by useEffect
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="container pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <div className="mb-6">
          <SyncStatusIndicator prioritizeUserData={true} />
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <OfficerDashboardProvider>
            <DashboardContainer />
          </OfficerDashboardProvider>
        </div>
        
        <div className="mt-8">
          <ResetSystemData onReset={handleSystemReset} />
        </div>
      </div>
    </div>
  );
};

export default OfficerDashboard;
