
import { useEffect } from "react";
import { initializeStorageListeners } from "@/utils/storageUtils";

/**
 * Component to initialize storage listeners on mount
 */
const PlayerStorageInitializer: React.FC = () => {
  useEffect(() => {
    initializeStorageListeners();
  }, []);

  return null; // This component doesn't render anything
};

export default PlayerStorageInitializer;
