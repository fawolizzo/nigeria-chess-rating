import { Tournament } from "../lib/mockData"; // Adjust path as needed

/**
 * Categorizes tournaments into upcoming, ongoing, and completed.
 * @param tournamentsToCategorize - An array of Tournament objects.
 * @returns An object with arrays for upcoming, ongoing, and completed tournaments.
 */
export const categorizeTournaments = (tournamentsToCategorize: Tournament[]) => {
  const upcoming: Tournament[] = [];
  const ongoing: Tournament[] = [];
  const completed: Tournament[] = [];

  if (Array.isArray(tournamentsToCategorize)) {
    tournamentsToCategorize.forEach((tournament) => {
      // Assuming startDate and endDate are ISO strings or YYYY-MM-DD
      // new Date() correctly parses these.
      const startDate = new Date(tournament.startDate);
      const endDate = new Date(tournament.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize today to the start of the day for consistent comparison

      // Normalize event dates to the start of their respective days
      const normalizedStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const normalizedEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      if (normalizedEndDate < today || tournament.status === "completed" || tournament.status === "processed") {
        completed.push(tournament);
      } else if (normalizedStartDate <= today && normalizedEndDate >= today) { // Check if today is within start and end date
        ongoing.push(tournament);
      } else if (normalizedStartDate > today) {
        upcoming.push(tournament);
      } else {
        // If it doesn't fit other categories but isn't explicitly completed/processed,
        // and end date is not yet passed, it might be considered ongoing or upcoming based on start date.
        // This case might need refinement based on exact business logic for edge cases like
        // tournaments that started in the past but whose end date is today or in the future,
        // and are not yet marked 'ongoing'.
        // For now, if start date is in past and end date is not, and not completed/processed, consider ongoing.
        if (normalizedStartDate <= today) {
            ongoing.push(tournament);
        } else {
            // If startDate is in the future by this point, it's upcoming.
            // This case should be caught by `normalizedStartDate > today` already.
            // Adding for completeness, though likely redundant given prior conditions.
            upcoming.push(tournament);
        }
      }
    });
  }

  return { upcoming, ongoing, completed };
};
