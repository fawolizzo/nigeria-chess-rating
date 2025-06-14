
import { Player } from "@/lib/mockData";
import { createPlayer } from "./playerCoreService";
import { getFromStorage } from "@/utils/storageUtils";

export const uploadPlayersFromExcel = async (file: File): Promise<{ success: boolean; message: string; count?: number }> => {
  try {
    const XLSX = await import('xlsx');
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const players = getFromStorage('players', []);
    let addedCount = 0;

    for (const row of jsonData) {
      const rowData = row as any;
      
      const playerData = {
        name: rowData.Name || rowData.name || "",
        email: rowData.Email || rowData.email || "",
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
        gender: (rowData.Gender || rowData.gender || "M") as "M" | "F",
        country: rowData.Country || rowData.country || "Nigeria"
      };

      const existingPlayer = players.find((p: Player) => 
        p.email === playerData.email || p.name === playerData.name
      );

      if (!existingPlayer && playerData.name && playerData.email) {
        const newPlayer = await createPlayer(playerData);
        addedCount++;
      }
    }

    return {
      success: true,
      message: `Successfully uploaded ${addedCount} players`,
      count: addedCount
    };
  } catch (error) {
    console.error("Error uploading players:", error);
    return {
      success: false,
      message: "Failed to upload players from Excel file"
    };
  }
};
