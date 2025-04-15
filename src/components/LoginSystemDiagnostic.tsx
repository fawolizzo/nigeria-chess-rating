import React, { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { checkStorageHealth } from "@/utils/debugLogger";
import { Loader2, RefreshCw, Check, X, AlertTriangle, Database } from "lucide-react";

/**
 * Diagnostic component for checking login and registration system health
 * This is a developer-only component for troubleshooting issues
 */
const LoginSystemDiagnostic: React.FC = () => {
  // Only show in development mode
  const isProduction = import.meta.env.PROD;
  if (isProduction) return null;
  
  const { users, refreshUserData, forceSync } = useUser();
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [healthStatus, setHealthStatus] = useState<{
    healthy: boolean;
    issues: string[];
  }>({ healthy: true, issues: [] });
  
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    ratingOfficers: 0,
    approvedRatingOfficers: 0,
    pendingRatingOfficers: 0,
    tournamentOrganizers: 0,
    approvedTournamentOrganizers: 0,
    pendingTournamentOrganizers: 0
  });
  
  // Calculate user statistics
  useEffect(() => {
    const ratingOfficers = users.filter(u => u.role === "rating_officer");
    const approvedRatingOfficers = ratingOfficers.filter(u => u.status === "approved");
    const pendingRatingOfficers = ratingOfficers.filter(u => u.status === "pending");
    
    const tournamentOrganizers = users.filter(u => u.role === "tournament_organizer");
    const approvedTournamentOrganizers = tournamentOrganizers.filter(u => u.status === "approved");
    const pendingTournamentOrganizers = tournamentOrganizers.filter(u => u.status === "pending");
    
    setUserStats({
      totalUsers: users.length,
      ratingOfficers: ratingOfficers.length,
      approvedRatingOfficers: approvedRatingOfficers.length,
      pendingRatingOfficers: pendingRatingOfficers.length,
      tournamentOrganizers: tournamentOrganizers.length,
      approvedTournamentOrganizers: approvedTournamentOrganizers.length,
      pendingTournamentOrganizers: pendingTournamentOrganizers.length
    });
  }, [users]);
  
  const runSystemCheck = async () => {
    setIsChecking(true);
    
    try {
      // Refresh user data
      await refreshUserData();
      await forceSync();
      
      // Check storage health
      const healthCheck = checkStorageHealth();
      setHealthStatus(healthCheck);
      
      setLastChecked(new Date());
    } catch (error) {
      console.error("Error running system check:", error);
      setHealthStatus({
        healthy: false,
        issues: [`Error running system check: ${error.message}`]
      });
    } finally {
      setIsChecking(false);
    }
  };
  
  return isProduction ? null : (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Database className="h-5 w-5 mr-2 text-blue-500" />
          System Diagnostic
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={runSystemCheck}
          disabled={isChecking}
          className="flex items-center"
        >
          {isChecking ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Run Diagnostics
        </Button>
      </div>
      
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <div 
            className={`h-3 w-3 rounded-full mr-2 ${
              healthStatus.healthy ? 'bg-green-500' : 'bg-red-500'
            }`} 
          />
          <span className="text-sm font-medium">
            System Health: {healthStatus.healthy ? 'Healthy' : 'Issues Detected'}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {lastChecked ? `Last checked: ${lastChecked.toLocaleTimeString()}` : 'Not checked yet'}
        </span>
      </div>
      
      {healthStatus.issues.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300 flex items-center mb-2">
            <AlertTriangle className="h-4 w-4 mr-1" />
            System Issues Detected
          </h3>
          <ul className="text-xs text-red-700 dark:text-red-300 pl-4 list-disc">
            {healthStatus.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="users">
          <AccordionTrigger className="text-sm">
            User Accounts ({userStats.totalUsers})
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span className="font-medium">Rating Officers</span>
                <span>{userStats.ratingOfficers}</span>
              </div>
              <div className="flex justify-between items-center pl-4 text-xs">
                <span className="flex items-center">
                  <Check className="h-3 w-3 text-green-500 mr-1" />
                  Approved
                </span>
                <span>{userStats.approvedRatingOfficers}</span>
              </div>
              <div className="flex justify-between items-center pl-4 text-xs">
                <span className="flex items-center">
                  <AlertTriangle className="h-3 w-3 text-amber-500 mr-1" />
                  Pending
                </span>
                <span>{userStats.pendingRatingOfficers}</span>
              </div>
              
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span className="font-medium">Tournament Organizers</span>
                <span>{userStats.tournamentOrganizers}</span>
              </div>
              <div className="flex justify-between items-center pl-4 text-xs">
                <span className="flex items-center">
                  <Check className="h-3 w-3 text-green-500 mr-1" />
                  Approved
                </span>
                <span>{userStats.approvedTournamentOrganizers}</span>
              </div>
              <div className="flex justify-between items-center pl-4 text-xs">
                <span className="flex items-center">
                  <AlertTriangle className="h-3 w-3 text-amber-500 mr-1" />
                  Pending
                </span>
                <span>{userStats.pendingTournamentOrganizers}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="accounts">
          <AccordionTrigger className="text-sm">
            Rating Officer Accounts
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 text-xs">
              {users
                .filter(user => user.role === "rating_officer")
                .sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime())
                .map(officer => (
                  <div key={officer.id} className="border rounded-md p-2 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">{officer.fullName}</div>
                        <div className="text-gray-500 dark:text-gray-400">{officer.email}</div>
                        <div className="text-gray-500 dark:text-gray-400">{officer.state}</div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          officer.status === 'approved' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                        }`}>
                          {officer.status}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(officer.registrationDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              
              {users.filter(user => user.role === "rating_officer").length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-2">
                  No rating officer accounts found
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        This diagnostic panel is only visible during development.
      </div>
    </div>
  );
};

export default LoginSystemDiagnostic;
