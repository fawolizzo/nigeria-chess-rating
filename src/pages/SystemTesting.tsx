
import Navbar from "@/components/Navbar";
import SystemTestRunner from "@/components/SystemTestRunner";
import { useUser } from "@/contexts/UserContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Bug, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const SystemTesting = () => {
  const { currentUser, isLoading } = useUser();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Restrict to rating officers only
    if (!isLoading && (!currentUser || currentUser.role !== "rating_officer")) {
      navigate("/login");
    }
  }, [currentUser, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nigeria-green"></div>
      </div>
    );
  }
  
  if (!currentUser || currentUser.role !== "rating_officer") {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="container pt-24 pb-20 px-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="size-7 text-nigeria-green" />
              System Testing
            </h1>
            <p className="text-muted-foreground mt-1">
              Verify system functionality with end-to-end tests
            </p>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/officer-dashboard")}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Button>
        </div>
        
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Bug className="text-amber-500 size-5" />
              <h2 className="font-semibold text-lg">About System Testing</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              System testing verifies that all components of the Nigerian Chess Rating System work together correctly.
              These tests simulate real user workflows and validate end-to-end functionality, including:
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>User registration and login flow</li>
              <li>Tournament creation and management</li>
              <li>Player registration and approval</li>
              <li>Rating calculation and processing</li>
              <li>Cross-device data synchronization</li>
            </ul>
          </div>
          
          <SystemTestRunner />
        </div>
      </div>
    </div>
  );
};

export default SystemTesting;
