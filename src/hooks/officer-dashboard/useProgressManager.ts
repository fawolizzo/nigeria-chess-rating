
import { useState, useCallback, useRef, useEffect } from "react";

export function useProgressManager() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const mounted = useRef(true);
  
  // Reset hook state on unmount
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);
  
  const incrementProgress = useCallback((amount = 10) => {
    if (mounted.current) {
      setLoadingProgress(prev => {
        const increment = Math.min(amount, 20);
        return Math.min(prev + increment, 99); 
      });
    }
  }, []);
  
  const resetProgress = useCallback(() => {
    if (mounted.current) {
      setLoadingProgress(0);
    }
  }, []);
  
  const completeProgress = useCallback(() => {
    if (mounted.current) {
      setLoadingProgress(100);
    }
  }, []);
  
  return {
    loadingProgress,
    incrementProgress,
    resetProgress,
    completeProgress
  };
}
