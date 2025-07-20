import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

/**
 * Custom hook to handle player profile navigation
 */
export function usePlayerLinks() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const navigateToPlayer = useCallback(
    (playerId: string) => {
      if (!playerId) {
        toast({
          title: 'Error',
          description: 'Player ID is missing or invalid',
          variant: 'destructive',
        });
        return;
      }

      // Navigate to the correct URL format: /players/:id
      navigate(`/players/${playerId}`);
    },
    [navigate, toast]
  );

  return {
    navigateToPlayer,
  };
}

export default usePlayerLinks;
