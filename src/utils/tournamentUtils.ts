
import { Tournament } from "@/lib/mockData";

/**
 * Categorize tournaments by status
 */
export const categorizeTournaments = (tournaments: Tournament[]) => {
  const upcoming: Tournament[] = [];
  const ongoing: Tournament[] = [];
  const completed: Tournament[] = [];
  const processed: Tournament[] = [];
  const pending: Tournament[] = [];
  const rejected: Tournament[] = [];
  
  tournaments.forEach((tournament) => {
    switch (tournament.status) {
      case "upcoming":
        upcoming.push(tournament);
        break;
      case "ongoing":
        ongoing.push(tournament);
        break;
      case "completed":
        completed.push(tournament);
        break;
      case "processed":
        processed.push(tournament);
        break;
      case "pending":
        pending.push(tournament);
        break;
      case "rejected":
        rejected.push(tournament);
        break;
      default:
        // Handle any other states
        break;
    }
  });
  
  return { upcoming, ongoing, completed, processed, pending, rejected };
};
