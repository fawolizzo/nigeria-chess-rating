
import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { validateTimeControl } from "@/utils/timeControlValidation";
import { TournamentFormSchemaType } from "./TournamentFormSchema";

export function useCustomTimeControl(form: UseFormReturn<TournamentFormSchemaType>) {
  const [isCustomTimeControl, setIsCustomTimeControl] = useState(false);
  const [customTimeControl, setCustomTimeControl] = useState("");
  const [customTimeControlError, setCustomTimeControlError] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);

  // Monitor form validity including custom time control
  useEffect(() => {
    const subscription = form.watch(() => {
      // We need to check both the form validity and the custom time control validity
      form.trigger().then(isValid => {
        const hasCustomTimeControlError = isCustomTimeControl && 
          (!customTimeControl || customTimeControlError !== null);
        
        setIsFormValid(isValid && !hasCustomTimeControlError);
        
        // Debug form validation
        console.log("Form validation status:", {
          formIsValid: isValid,
          isCustomTimeControl,
          customTimeControl,
          hasCustomTimeControlError,
          finalIsValid: isValid && !hasCustomTimeControlError
        });
      });
    });
    
    return () => subscription.unsubscribe();
  }, [form, isCustomTimeControl, customTimeControl, customTimeControlError]);

  return {
    isCustomTimeControl,
    setIsCustomTimeControl,
    customTimeControl,
    setCustomTimeControl,
    customTimeControlError,
    setCustomTimeControlError,
    isFormValid
  };
}
