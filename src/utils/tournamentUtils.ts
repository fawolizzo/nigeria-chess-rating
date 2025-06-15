
import { Tournament } from "@/lib/mockData";

export const getTournamentStatus = (tournament: Tournament): "pending" | "approved" | "rejected" | "ongoing" | "completed" | "processed" => {
  const now = new Date();
  const startDate = new Date(tournament.start_date);
  const endDate = new Date(tournament.end_date);

  // Check explicit status first
  if (tournament.status === "pending" || tournament.status === "approved" || tournament.status === "rejected" || tournament.status === "processed") {
    return tournament.status;
  }

  // For approved tournaments, determine status based on dates
  if (tournament.status === "approved") {
    if (now < startDate) {
      return "approved"; // Tournament is approved but hasn't started yet
    } else if (now >= startDate && now <= endDate) {
      return "ongoing";
    } else {
      return "completed";
    }
  }

  // Default fallback
  return tournament.status as "pending" | "approved" | "rejected" | "ongoing" | "completed" | "processed";
};

export const canStartTournament = (tournament: Tournament): boolean => {
  const status = getTournamentStatus(tournament);
  return status === "approved" && tournament.players && tournament.players.length >= 2;
};
