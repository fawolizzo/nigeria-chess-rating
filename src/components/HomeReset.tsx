
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { performSystemReset } from "@/utils/storageSync";

const HomeReset: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetSystem = () => {
    if (window.confirm("Are you sure you want to reset all system data? This will remove all users, players, and tournaments across ALL devices. This action cannot be undone.")) {
      try {
        setIsResetting(true);
        console.log("Starting complete system reset...");
        
        toast({
          title: "System Reset Started",
          description: "Clearing all data across devices. Please wait...",
          duration: 3000,
        });
        
        // Use the enhanced system reset function
        performSystemReset();
        
        // Note: The page will automatically reload from performSystemReset
        // so we don't need additional reload logic here
      } catch (error) {
        console.error("Error during system reset:", error);
        toast({
          title: "Reset Failed",
          description: "An error occurred during the reset. Please try again.",
          variant: "destructive",
        });
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="mt-8 text-center">
      <Button 
        variant="outline" 
        onClick={handleResetSystem}
        className="bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-300"
        disabled={isResetting}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isResetting ? 'animate-spin' : ''}`} />
        {isResetting ? "Resetting All Devices..." : "Reset System Data (All Devices)"}
      </Button>
      <p className="text-xs text-gray-500 mt-2">
        This will clear all data on all connected devices and allow you to start fresh.
      </p>
    </div>
  );
};

export default HomeReset;
