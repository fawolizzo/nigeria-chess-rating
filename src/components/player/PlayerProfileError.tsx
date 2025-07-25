import React from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  Home,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
// import { forceSyncAllStorage } from '@/utils/storageUtils';

interface PlayerProfileErrorProps {
  error: string | null;
  onBackClick: () => void;
  onRetry?: () => void;
}

const PlayerProfileError: React.FC<PlayerProfileErrorProps> = ({
  error,
  onBackClick,
  onRetry,
}) => {
  const { toast } = useToast();

  const runDiagnostics = () => {
    console.log('[PlayerProfileError] Running diagnostics');
    toast({
      title: 'Running Diagnostics',
      description: 'Checking storage and application state...',
    });

    // Check storage state
    try {
      // Test storage access
      try {
        localStorage.setItem('diagnostic_test', 'test');
        localStorage.removeItem('diagnostic_test');

        sessionStorage.setItem('diagnostic_test', 'test');
        sessionStorage.removeItem('diagnostic_test');
      } catch (storageAccessError) {
        console.error(
          '[DIAGNOSTICS] Storage access failed:',
          storageAccessError
        );
        toast({
          title: 'Storage Access Error',
          description:
            'Your browser is blocking access to local storage. Try disabling private browsing mode.',
          variant: 'destructive',
        });
        return;
      }

      // Force sync storage
      // forceSyncAllStorage();

      // Log diagnostic information
      const diagnosticReport = {
        url: window.location.href,
        playerId: window.location.pathname.split('/').pop(),
        browserInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          cookiesEnabled: navigator.cookieEnabled,
          isOnline: navigator.onLine,
        },
        localStorage: {
          keys: Object.keys(localStorage).filter((key) =>
            key.startsWith('ncr_')
          ),
          playersExists: !!localStorage.getItem('ncr_players'),
          playersSize: localStorage.getItem('ncr_players')?.length || 0,
        },
        sessionStorage: {
          keys: Object.keys(sessionStorage),
          cachedPlayerId: sessionStorage.getItem('last_viewed_player_id'),
          hasCachedPlayer: !!sessionStorage.getItem('last_viewed_player'),
          cachedPlayerSize:
            sessionStorage.getItem('last_viewed_player')?.length || 0,
        },
        error: error,
        timestamp: new Date().toISOString(),
      };

      console.log(
        '[DIAGNOSTICS] Player Profile Error Report:',
        diagnosticReport
      );

      // Attempt to repair the cached data
      const cachedPlayerId = sessionStorage.getItem('last_viewed_player_id');
      if (cachedPlayerId) {
        try {
          const players = JSON.parse(
            localStorage.getItem('ncr_players') || '[]'
          );
          const matchingPlayer = Array.isArray(players)
            ? players.find((p) => p.id === cachedPlayerId)
            : null;

          if (matchingPlayer) {
            console.log(
              '[DIAGNOSTICS] Found matching player in storage, updating cache'
            );
            sessionStorage.setItem(
              'last_viewed_player',
              JSON.stringify(matchingPlayer)
            );
            toast({
              title: 'Cache Repaired',
              description: 'Successfully repaired player cache data.',
            });
          }
        } catch (repairError) {
          console.error('[DIAGNOSTICS] Cache repair failed:', repairError);
        }
      }

      toast({
        title: 'Diagnostics Complete',
        description: 'Diagnostic information has been logged to the console.',
      });

      // After diagnostics, if there's a retry function, try it
      if (onRetry) {
        setTimeout(onRetry, 500);
      }
    } catch (e) {
      console.error('[DIAGNOSTICS] Error running diagnostics:', e);
      toast({
        title: 'Diagnostic Failed',
        description:
          'Could not complete diagnostics. Please try a different browser.',
        variant: 'destructive',
      });
    }
  };

  const clearCacheAndRetry = () => {
    console.log('[PlayerProfileError] Clearing cache and retrying');

    // Clear session storage cache
    try {
      sessionStorage.removeItem('last_viewed_player_id');
      sessionStorage.removeItem('last_viewed_player');

      toast({
        title: 'Cache Cleared',
        description: 'Temporary data has been cleared. Retrying...',
      });

      // After clearing cache, retry if function provided
      if (onRetry) {
        setTimeout(onRetry, 300);
      }
    } catch (error) {
      console.error('[PlayerProfileError] Error clearing cache:', error);
      toast({
        title: 'Error',
        description: 'Could not clear cache. Please try refreshing the page.',
        variant: 'destructive',
      });
    }
  };

  const hardRefresh = () => {
    console.log('[PlayerProfileError] Performing hard refresh');
    toast({
      title: 'Refreshing Page',
      description: 'Reloading the page from server...',
    });

    // Force a reload from server
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
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
        <p className="text-gray-500 mb-6">
          {error ||
            "The player you are looking for doesn't exist or has been removed."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
          <Button onClick={onBackClick} variant="outline">
            Return to Players List
          </Button>

          {onRetry && (
            <Button onClick={onRetry} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}

          <Button
            onClick={clearCacheAndRetry}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Clear Cache & Retry
          </Button>

          <Link to="/">
            <Button variant="secondary">
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </Link>
        </div>

        <div className="flex justify-center gap-3 mt-4">
          <Button
            variant="link"
            className="text-nigeria-green hover:text-nigeria-green-dark"
            onClick={runDiagnostics}
          >
            <HelpCircle className="h-4 w-4 mr-1" />
            Run Diagnostics
          </Button>

          <Button
            variant="link"
            className="text-nigeria-green hover:text-nigeria-green-dark"
            onClick={hardRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Hard Refresh
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfileError;
