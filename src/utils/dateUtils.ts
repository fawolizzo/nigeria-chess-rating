import { parseISO, format, isValid } from 'date-fns';

/**
 * Formats a date string or Date object into a specified string format.
 * Handles ISO strings and Date objects.
 * @param dateString - The date string (preferably ISO 8601) or Date object to format.
 * @param formatStr - The desired output format string (default: 'PPpp' - e.g., "Sep 20, 2023, 7:00:00 PM").
 *                    Common formats: 'yyyy-MM-dd', 'MMM dd, yyyy', 'P' (short date), 'p' (short time).
 * @returns The formatted date string, or 'Invalid date' if parsing/formatting fails, or 'N/A' if input is null/undefined.
 */
export const formatDate = (dateString: string | Date | undefined | null, formatStr: string = 'PPpp'): string => {
  if (dateString === null || dateString === undefined || dateString === '') {
    return 'N/A';
  }

  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    
    if (!isValid(date)) {
      // Attempt to parse simple "YYYY-MM-DD" if parseISO fails and it's a string
      if (typeof dateString === 'string') {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // month is 0-indexed
          const day = parseInt(parts[2], 10);
          const localDate = new Date(year, month, day);
          if (isValid(localDate)) {
            return format(localDate, formatStr);
          }
        }
      }
      console.warn("Invalid date provided to formatDate:", dateString);
      return 'Invalid date';
    }
    return format(date, formatStr);
  } catch (error) {
    console.error("Error formatting date in formatDate utility:", dateString, error);
    return 'Invalid date';
  }
};

/**
 * Formats a date specifically for display purposes, e.g., "MMM dd, yyyy".
 * @param dateString - The date string or Date object.
 * @returns Formatted date string or 'N/A'.
 */
export const formatDisplayDate = (dateString: string | Date | undefined | null): string => {
  return formatDate(dateString, 'MMM dd, yyyy');
};

/**
 * Formats a date and time for display purposes, e.g., "MMM dd, yyyy h:mm a".
 * @param dateString - The date string or Date object.
 * @returns Formatted date-time string or 'N/A'.
 */
export const formatDisplayDateTime = (dateString: string | Date | undefined | null): string => {
  return formatDate(dateString, 'MMM dd, yyyy h:mm a');
};
