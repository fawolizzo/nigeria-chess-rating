import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import Navbar from '@/components/Navbar';
import { logMessage, LogLevel } from '@/utils/debugLogger';

interface OrganizerDashboardSkeletonProps {
  onManualReload?: () => void;
  loadingStage?: string;
}

const OrganizerDashboardSkeleton: React.FC<OrganizerDashboardSkeletonProps> = ({
  onManualReload,
  loadingStage = 'loading',
}) => {
  const [loadingDuration, setLoadingDuration] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [showReload, setShowReload] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);

  // Monitor page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);
      logMessage(
        LogLevel.INFO,
        'OrganizerDashboardSkeleton',
        `Page visibility changed: ${isVisible ? 'visible' : 'hidden'}`
      );
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Start loading timer
  useEffect(() => {
    const startTime = Date.now();

    const intervalId = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      setLoadingDuration(elapsedSeconds);

      // Show warning after 10 seconds
      if (elapsedSeconds >= 10 && !showWarning) {
        setShowWarning(true);
        logMessage(
          LogLevel.WARNING,
          'OrganizerDashboardSkeleton',
          'Loading taking longer than expected'
        );
      }

      // Show reload option after 20 seconds
      if (elapsedSeconds >= 20 && !showReload) {
        setShowReload(true);
        logMessage(
          LogLevel.WARNING,
          'OrganizerDashboardSkeleton',
          'Loading timeout threshold reached'
        );
      }

      // Force reload after 30 seconds, but only if page is visible
      if (elapsedSeconds >= 30 && isPageVisible) {
        logMessage(
          LogLevel.ERROR,
          'OrganizerDashboardSkeleton',
          'Loading timeout exceeded, forcing reload'
        );
        clearInterval(intervalId);

        if (onManualReload) {
          onManualReload();
        } else {
          window.location.reload();
        }
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [showWarning, showReload, isPageVisible, onManualReload]);

  const handleManualReload = () => {
    logMessage(
      LogLevel.INFO,
      'OrganizerDashboardSkeleton',
      'User triggered manual reload'
    );
    if (onManualReload) {
      onManualReload();
    } else {
      window.location.reload();
    }
  };

  // Get stage-specific loading message
  const getLoadingMessage = () => {
    switch (loadingStage) {
      case 'checking authentication':
        return 'Checking your authentication status...';
      case 'loading tournaments':
        return 'Loading your tournament data...';
      case 'retrying':
        return 'Retrying data load...';
      default:
        return 'Loading data...';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-7xl mx-auto pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Loading Status Information */}
        {(showWarning || showReload) && (
          <Alert
            variant={showReload ? 'destructive' : 'warning'}
            className="mb-6"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>
              {showReload
                ? 'Loading Timeout'
                : 'Loading Taking Longer Than Expected'}
            </AlertTitle>
            <AlertDescription>
              {showReload
                ? 'The dashboard is taking too long to load. There might be network issues or server problems.'
                : 'Your dashboard is taking longer than expected to load. Please wait a moment...'}
            </AlertDescription>

            {showReload && (
              <div className="mt-4">
                <Button
                  onClick={handleManualReload}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload Dashboard
                </Button>
              </div>
            )}
          </Alert>
        )}

        {/* Current Loading Stage Alert */}
        {!showReload && !showWarning && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Loading</AlertTitle>
            <AlertDescription>
              {getLoadingMessage()} Please wait...
            </AlertDescription>
          </Alert>
        )}

        {/* Main Loading Indicator */}
        <div className="flex flex-col items-center justify-center mb-8">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {loadingStage}: {loadingDuration > 0 && `(${loadingDuration}s)`}
          </p>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-32 w-full rounded-lg animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboardSkeleton;
