import { useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for managing toast notifications during sync operations
 */
export function useToastManager() {
  const { toast } = useToast();
  const refreshToastIdRef = useRef<string | null>(null);

  /**
   * Manages toast display to prevent duplicates
   * @param title Toast title
   * @param description Toast description
   */
  const manageToastDisplay = useCallback(
    (title: string, description: string) => {
      // Only show a new toast if no refresh toast is currently showing
      if (!refreshToastIdRef.current) {
        const toastInstance = toast({
          title,
          description,
          duration: 3000,
        });
        refreshToastIdRef.current = toastInstance.id;
      }
    },
    [toast]
  );

  return {
    refreshToastIdRef,
    manageToastDisplay,
  };
}
