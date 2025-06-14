
// Export all player service functions from centralized location
export { createPlayer, updatePlayerInSupabase, getPlayerFromSupabase } from "./playerCoreService";
export { getAllPlayersFromSupabase, getAllUsers, getPlayerByIdFromSupabase } from "./playerQueryService";
export { approvePlayerInSupabase, rejectPlayerInSupabase } from "./playerApprovalService";
export { uploadPlayersFromExcel } from "./playerExcelService";
export { addPlayerToTournament, removePlayerFromTournament } from "./playerTournamentService";

// Legacy exports for backward compatibility
export const createPlayerInSupabase = createPlayer;
export const getPlayerFromSupabase as getPlayerFromSupabase;
export const getPlayerByIdFromSupabase as getPlayerByIdFromSupabase;

// Fix the exports
import { createPlayer } from "./playerCoreService";
import { getPlayerFromSupabase as getPlayer, getPlayerByIdFromSupabase as getPlayerById } from "./playerQueryService";

export const createPlayerInSupabase = createPlayer;
export { getPlayer as getPlayerFromSupabase };
export { getPlayerById as getPlayerByIdFromSupabase };
