
import { Player } from "@/lib/mockData";
import { createPlayer } from "./playerCoreService";
import { getFromStorage } from "@/utils/storageUtils";

export const uploadPlayersFromExcel = async (file: File): Promise<{ success: boolean; message: string; count?: number }> => {
  try {
    console.log('🔄 uploadPlayersFromExcel: Starting file processing...');
    const XLSX = await import('xlsx');
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log('📊 uploadPlayersFromExcel: Parsed', jsonData.length, 'rows from Excel');

    // Use Supabase instead of localStorage for checking existing players
    const { getAllPlayersFromSupabase } = await import('./playerQueryService');
    let existingPlayers = [];
    try {
      existingPlayers = await getAllPlayersFromSupabase();
      console.log('📋 uploadPlayersFromExcel: Found', existingPlayers.length, 'existing players in Supabase');
    } catch (error) {
      console.log('⚠️ uploadPlayersFromExcel: Could not fetch existing players, proceeding without duplicate check');
      existingPlayers = [];
    }

    let addedCount = 0;
    let skippedCount = 0;

    for (const row of jsonData) {
      const rowData = row as any;
      
      // Ensure required fields
      const name = rowData.Name || rowData.name || "";
      const email = rowData.Email || rowData.email || `${name.replace(/\s+/g, '').toLowerCase()}@ncr.temp`;
      
      if (!name) {
        console.log('⚠️ uploadPlayersFromExcel: Skipping row with missing name');
        skippedCount++;
        continue;
      }

      const playerData = {
        name,
        email,
        phone: rowData.Phone || rowData.phone || "",
        state: rowData.State || rowData.state || "",
        city: rowData.City || rowData.city || "",
        rating: parseInt(rowData.Rating || rowData.rating) || 800,
        rapidRating: parseInt(rowData.RapidRating || rowData.rapidRating) || 800,
        blitzRating: parseInt(rowData.BlitzRating || rowData.blitzRating) || 800,
        title: (rowData.Title || rowData.title || "") as "GM" | "IM" | "FM" | "CM" | "WGM" | "WIM" | "WFM" | "WCM" | undefined,
        titleVerified: Boolean(rowData.TitleVerified || rowData.titleVerified || false),
        fideId: rowData.FideId || rowData.fideId || "",
        gamesPlayed: parseInt(rowData.GamesPlayed || rowData.gamesPlayed) || 31,
        rapidGamesPlayed: parseInt(rowData.RapidGamesPlayed || rowData.rapidGamesPlayed) || 31,
        blitzGamesPlayed: parseInt(rowData.BlitzGamesPlayed || rowData.blitzGamesPlayed) || 31,
        gender: (rowData.Gender || rowData.gender || "M") as "M" | "F",
        country: rowData.Country || rowData.country || "Nigeria",
        status: "approved" as const,
        created_at: new Date().toISOString()
      };

      // Check for duplicates in Supabase data
      const existingPlayer = existingPlayers.find((p: Player) => 
        p.email === playerData.email || p.name === playerData.name
      );

      if (existingPlayer) {
        console.log('⚠️ uploadPlayersFromExcel: Skipping duplicate player:', playerData.name);
        skippedCount++;
        continue;
      }

      try {
        console.log('🔄 uploadPlayersFromExcel: Creating player:', playerData.name);
        const newPlayer = await createPlayer(playerData);
        console.log('✅ uploadPlayersFromExcel: Successfully created player:', newPlayer.name);
        addedCount++;
      } catch (playerError) {
        console.error('❌ uploadPlayersFromExcel: Failed to create player:', playerData.name, playerError);
        skippedCount++;
      }
    }

    const message = `Successfully uploaded ${addedCount} players${skippedCount > 0 ? ` (${skippedCount} skipped)` : ''}`;
    console.log('✅ uploadPlayersFromExcel: Complete -', message);

    return {
      success: true,
      message,
      count: addedCount
    };
  } catch (error) {
    console.error("❌ uploadPlayersFromExcel: Error uploading players:", error);
    return {
      success: false,
      message: `Failed to upload players: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
