import { useState, useCallback, useRef } from 'react';

export function useProgressManager(initialValue = 0) {
  const [progress, setProgress] = useState(initialValue);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any existing timers when incrementing to prevent multiple increments
  const incrementProgress = useCallback((amount: number) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setProgress((prev) => {
      // Cap at 100
      return Math.min(prev + amount, 100);
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(0);
  }, []);

  const completeProgress = useCallback(() => {
    setProgress(100);
  }, []);

  // Clean up any timers on unmount
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    loadingProgress: progress,
    incrementProgress,
    resetProgress,
    completeProgress,
    setProgress,
    cleanup,
  };
}
