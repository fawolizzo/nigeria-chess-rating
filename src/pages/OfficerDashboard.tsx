
import React, { useEffect, useState } from "react";
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
  const [loadingTimeoutExceeded, setLoadingTimeoutExceeded] = useState(false);
  const { toast } = useToast();
  
  // Prevent access for non-rating officers and handle redirects
  useEffect(() => {
    if (!isUserLoading) {
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
      
      // Small delay to avoid content flashing
      const timer = setTimeout(() => {
        setIsContentLoading(false);
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [currentUser, isUserLoading, navigate, toast]);
  
  // Add timeout protection to prevent infinite loading state
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isContentLoading) {
        logMessage(LogLevel.WARNING, 'OfficerDashboard', 'Loading timeout exceeded, forcing content display');
        setLoadingTimeoutExceeded(true);
        setIsContentLoading(false);
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [isContentLoading]);
  
  const handleSystemReset = () => {
    // Log out the current user after reset
    logout();
    navigate("/login");
  };
  
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await forceSync();
      toast({
        title: "Data Refreshed",
        description: "The dashboard data has been refreshed successfully.",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Refresh Failed",
        description: "There was an error refreshing the data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // If user data is still loading, show loading
  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="flex flex-col items-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Checking credentials...</p>
        </div>
      </div>
    );
  }
  
  // If content is loading and timeout not exceeded, show loading
  if (isContentLoading && !loadingTimeoutExceeded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="flex flex-col items-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
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
