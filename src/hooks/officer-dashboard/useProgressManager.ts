
import { useState, useCallback } from 'react';

export function useProgressManager(initialValue = 0) {
  const [progress, setProgress] = useState(initialValue);
  
  const incrementProgress = useCallback((amount: number) => {
    setProgress(prev => {
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
  
  return {
    loadingProgress: progress,
    incrementProgress,
    resetProgress,
    completeProgress,
    setProgress
  };
}
