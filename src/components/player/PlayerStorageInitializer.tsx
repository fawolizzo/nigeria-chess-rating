
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

/**
 * Simplified component to initialize storage on mount
 */
const PlayerStorageInitializer: React.FC = () => {
  const { toast } = useToast();
  
  useEffect(() => {
    console.log("[PlayerStorageInitializer] Component mounting");
    
    try {
      // Test storage availability
      try {
        localStorage.setItem('storage_test', 'test');
        localStorage.removeItem('storage_test');
        console.log("[PlayerStorageInitializer] Storage access test successful");
      } catch (storageError) {
        console.error("[PlayerStorageInitializer] Storage access test failed:", storageError);
        toast({
          title: "Storage Access Error",
          description: "Your browser may be blocking access to local storage. Try disabling private browsing or clearing cookies.",
          variant: "destructive",
        });
        throw new Error("Storage access failed");
      }
      
      // Add a listener for online events to sync when connection is restored
      const handleOnline = () => {
        console.log("[PlayerStorageInitializer] Device came online");
        toast({
          title: "Connection Restored",
          description: "You're back online.",
        });
      };
      
      window.addEventListener('online', handleOnline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
      };
    } catch (error) {
      console.error("[PlayerStorageInitializer] Error initializing storage:", error);
    }
    
    return () => {
      console.log("[PlayerStorageInitializer] Component unmounting");
    };
  }, [toast]);

  return null; // This component doesn't render anything
};

export default PlayerStorageInitializer;
