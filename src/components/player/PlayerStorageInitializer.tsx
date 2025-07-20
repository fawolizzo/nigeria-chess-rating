import { useEffect } from 'react';
import { useProductionSync } from '@/hooks/useProductionSync';
import { useStorageInitialization } from '@/hooks/useStorageInitialization';
import { useSyncListeners } from '@/hooks/useSyncListeners';
import { useSyncFunctions } from '@/hooks/useSyncFunctions';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';

/**
 * Component to initialize storage and handle sync events on mount
 */
const PlayerStorageInitializer: React.FC = () => {
  const { toast } = useToast();
  const { refreshUserData, clearAllData, forceSync } = useUser();
  const { initialize, isInitialized, syncInProgressRef, isProduction } =
    useStorageInitialization();

  // Enable production sync mechanisms
  useProductionSync();

  // Set up sync functions
  useSyncFunctions(syncInProgressRef, refreshUserData, forceSync, clearAllData);

  // Set up sync event listeners
  useSyncListeners(syncInProgressRef, refreshUserData, isProduction);

  // Initialize system on mount
  useEffect(() => {
    console.log('[PlayerStorageInitializer] Component mounting');

    try {
      // Use a small delay to ensure other components are ready
      setTimeout(() => {
        initialize().catch((error) => {
          console.error(
            '[PlayerStorageInitializer] Initialization error:',
            error
          );

          if (!isProduction) {
            toast({
              title: 'Initialization Error',
              description:
                'There was a problem initializing the application. Please refresh the page or try again later.',
              variant: 'destructive',
              duration: 5000,
            });
          }
        });
      }, 100);
    } catch (error) {
      console.error(
        '[PlayerStorageInitializer] Error initializing storage:',
        error
      );

      if (!isProduction) {
        toast({
          title: 'Initialization Error',
          description:
            'There was a problem initializing the application. Please refresh the page.',
          variant: 'destructive',
        });
      }
    }

    return () => {
      console.log('[PlayerStorageInitializer] Component unmounting');
    };
  }, [toast, initialize, isProduction]);

  return null;
};

export default PlayerStorageInitializer;
