
export type TimeControlValidationResult = {
  isValid: boolean;
  error?: string;
};

export const validateTimeControl = (value: string): TimeControlValidationResult => {
  if (!value.trim()) {
    return { isValid: false, error: "Time control is required" };
  }

  // Basic format: "XXmin" or "XXmin + YYsec"
  const formatRegex = /^(\d+)min(?:\s*\+\s*(\d+)sec)?$/;
  const matches = value.trim().match(formatRegex);

  if (!matches) {
    return {
      isValid: false,
      error: "Invalid format. Use format: XXmin or XXmin + YYsec (e.g., 90min or 15min + 10sec)"
    };
  }

  const minutes = parseInt(matches[1], 10);
  const seconds = matches[2] ? parseInt(matches[2], 10) : 0;

  if (minutes === 0) {
    return { isValid: false, error: "Minutes must be greater than 0" };
  }

  if (seconds >= 60) {
    return { isValid: false, error: "Seconds must be less than 60" };
  }

  return { isValid: true };
};
