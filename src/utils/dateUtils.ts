import { format, isValid, parseISO } from 'date-fns';

/**
 * Format a date string to a readable format
 * @param dateString The date string to format (ISO format expected)
 * @returns A formatted date string (e.g. "May 15, 2023")
 */
export function formatDate(dateString: string): string {
  try {
    // Handle ISO format strings
    const parsedDate = parseISO(dateString);

    // Check if date is valid
    if (isValid(parsedDate)) {
      return format(parsedDate, 'MMM dd, yyyy');
    }

    // If not valid as ISO, try parsing as YYYY-MM-DD directly
    const dateParts = dateString.split('-');
    if (dateParts.length === 3) {
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed in JS
      const day = parseInt(dateParts[2], 10);

      const date = new Date(year, month, day);
      return isValid(date) ? format(date, 'MMM dd, yyyy') : 'Invalid date';
    }

    return 'Invalid date';
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Compare two dates for sorting
 * @param dateA First date string
 * @param dateB Second date string
 * @returns -1 if dateA is before dateB, 1 if dateA is after dateB, 0 if equal
 */
export function compareDates(dateA: string, dateB: string): number {
  try {
    const parsedDateA = parseISO(dateA);
    const parsedDateB = parseISO(dateB);

    if (isValid(parsedDateA) && isValid(parsedDateB)) {
      return parsedDateA.getTime() - parsedDateB.getTime();
    }

    return 0;
  } catch (error) {
    return 0;
  }
}
