import { useState, useEffect } from 'react';
import { toast, dismissToast } from './toast-utils';
import { memoryState, ToastState, listeners } from './toast-state';
import type { ToasterToast } from './toast-state';
import type { Toast } from './toast-utils';

// Hook to use toast functionality
export function useToast() {
  const [state, setState] = useState<ToastState>(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: dismissToast,
  };
}

export type { ToasterToast, Toast };
export { toast, dismissToast };
