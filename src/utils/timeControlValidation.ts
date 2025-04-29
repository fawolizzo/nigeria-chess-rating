
export type TimeControlValidationResult = {
  isValid: boolean;
  error?: string;
};

export const validateTimeControl = (value: string): TimeControlValidationResult => {
  if (!value.trim()) {
    return { isValid: false, error: "Time control is required" };
  }

  // Support both formats:
  // 1. "XXmin" or "XXmin + YYsec" format
  // 2. "XX+YY" format used in chess notation
  
  // First check the "XXmin + YYsec" format
  const formatRegex1 = /^(\d+)min(?:\s*\+\s*(\d+)sec)?$/;
  const matches1 = value.trim().match(formatRegex1);
  
  if (matches1) {
    const minutes = parseInt(matches1[1], 10);
    const seconds = matches1[2] ? parseInt(matches1[2], 10) : 0;

    if (minutes === 0) {
      return { isValid: false, error: "Minutes must be greater than 0" };
    }

    if (seconds >= 60) {
      return { isValid: false, error: "Seconds must be less than 60" };
    }

    return { isValid: true };
  }
  
  // Check the "XX+YY" format
  const formatRegex2 = /^(\d+)\s*\+\s*(\d+)$/;
  const matches2 = value.trim().match(formatRegex2);
  
  if (matches2) {
    const minutes = parseInt(matches2[1], 10);
    const seconds = parseInt(matches2[2], 10);
    
    if (minutes === 0) {
      return { isValid: false, error: "Minutes must be greater than 0" };
    }

    if (seconds >= 60) {
      return { isValid: false, error: "Seconds must be less than 60" };
    }
    
    return { isValid: true };
  }

  return {
    isValid: false,
    error: "Invalid format. Use format: XXmin + YYsec or XX+YY (e.g., 90min or 15+10)"
  };
};
