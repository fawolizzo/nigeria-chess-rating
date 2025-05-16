
// Re-export the toast functionality from the hook implementation
import { 
  useToast, 
  toast, 
  dismissToast, 
  type Toast,
  type ToasterToast 
} from "@/hooks/use-toast";

export { 
  useToast, 
  toast, 
  dismissToast 
};

export type {
  Toast,
  ToasterToast
};
