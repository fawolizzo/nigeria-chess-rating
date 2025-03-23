
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";

interface PlayerProfileErrorProps {
  error: string | null;
  onBackClick: () => void;
}

const PlayerProfileError: React.FC<PlayerProfileErrorProps> = ({ error, onBackClick }) => {
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
        
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">Player Not Found</h1>
          <p className="text-gray-500 mb-6">{error || "The player you are looking for doesn't exist or has been removed."}</p>
          <Button onClick={onBackClick}>
            Return to Players List
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfileError;
