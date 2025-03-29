
// Re-export the toast functionality from the UI component
import { toast as toastFunction, useToast as useToastHook } from "@/components/ui/toast";

export const toast = toastFunction;
export const useToast = useToastHook;

export default useToastHook;
