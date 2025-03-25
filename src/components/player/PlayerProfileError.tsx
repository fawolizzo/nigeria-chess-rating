
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";

interface PlayerProfileErrorProps {
  error: string | null;
  onBackClick: () => void;
  onRetry?: () => void;
}

const PlayerProfileError: React.FC<PlayerProfileErrorProps> = ({ 
  error, 
  onBackClick,
  onRetry
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6 text-nigeria-green hover:text-nigeria-green-dark hover:bg-nigeria-green/5 -ml-2" 
          onClick={onBackClick}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Players
        </Button>
        
        <div className="text-center py-12 max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Player Not Found</h1>
          <p className="text-gray-500 mb-6">{error || "The player you are looking for doesn't exist or has been removed."}</p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={onBackClick} variant="outline">
              Return to Players List
            </Button>
            
            {onRetry && (
              <Button onClick={onRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfileError;
