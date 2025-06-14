
// Export all player service functions from centralized location
export { createPlayer, updatePlayerInSupabase, getPlayerFromSupabase } from "./playerCoreService";
export { getAllPlayersFromSupabase, getAllUsers, getPlayerByIdFromSupabase } from "./playerQueryService";
export { approvePlayerInSupabase, rejectPlayerInSupabase } from "./playerApprovalService";
export { uploadPlayersFromExcel } from "./playerExcelService";
export { addPlayerToTournament, removePlayerFromTournament } from "./playerTournamentService";

// Import functions for legacy exports
import { createPlayer, getPlayerFromSupabase, updatePlayerInSupabase } from "./playerCoreService";
import { getPlayerByIdFromSupabase } from "./playerQueryService";

// Legacy exports for backward compatibility
export const createPlayerInSupabase = createPlayer;
export const getPlayerFromSupabase as getPlayerFromSupabaseAlias = getPlayerFromSupabase;
export const getPlayerByIdFromSupabase as getPlayerByIdAlias = getPlayerByIdFromSupabase;
export const updatePlayerInSupabase as updatePlayerAlias = updatePlayerInSupabase;
