
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from 'xlsx';
import { Player } from '@/lib/mockData';

export interface FileUploadButtonProps {
  onFileUpload?: (players: any[]) => void;
  onPlayersImported?: (players: Partial<Player>[]) => void;
  buttonText?: string;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({ 
  onFileUpload, 
  onPlayersImported,
  buttonText = "Select Excel File" 
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Generate a unique NCR ID for each player
  const generateNcrId = () => {
    const randomPart = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
    const timestamp = Date.now().toString().slice(-5); // Last 5 digits of timestamp
    return `NCR${randomPart}${timestamp}`;
  };

  const processExcelFile = (file: File) => {
    setIsLoading(true);
    setError(null);
    
    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result;
        
        // Handle CSV files
        if (file.name.toLowerCase().endsWith('.csv')) {
          const text = data as string;
          const rows = text.split('\n').map(line => line.split(','));
          
          if (rows.length <= 1) {
            setError("The uploaded CSV file does not contain any data");
            setIsLoading(false);
            return;
          }
          
          processFileData(rows);
          return;
        }
        
        // Handle Excel files
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Get JSON data from worksheet
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        
        if (jsonData.length <= 1) {
          setError("The uploaded file does not contain any data");
          setIsLoading(false);
          return;
        }
        
        processFileData(jsonData as string[][]);
      } catch (error) {
        console.error("Error processing file:", error);
        setError("Failed to process the uploaded file. Please check the format.");
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError("Failed to read the uploaded file");
      setIsLoading(false);
    };
    
    reader.readAsBinaryString(file);
  };

  const processFileData = (rows: string[][]) => {
    // Get header row
    const headers = rows[0].map(h => String(h).trim().toLowerCase());
    console.log("File headers:", headers);
    
    // Find column indices based on header names
    const findHeaderIndex = (possibleNames: string[]) => {
      for (const name of possibleNames) {
        const index = headers.findIndex(header => 
          header.includes(name.toLowerCase())
        );
        if (index !== -1) return index;
      }
      return -1;
    };
    
    const nameIndex = findHeaderIndex(['player', 'players', 'name', 'fullname', 'full name']);
    const titleIndex = findHeaderIndex(['title', 'titles']);
    const federationIndex = findHeaderIndex(['fed', 'federation', 'country', 'nation']);
    const classicalRatingIndex = findHeaderIndex(['std', 'standard', 'classical', 'fide', 'rating']);
    const rapidRatingIndex = findHeaderIndex(['rpd', 'rapid']);
    const blitzRatingIndex = findHeaderIndex(['blz', 'blitz']);
    const birthYearIndex = findHeaderIndex(['b-year', 'byear', 'birth year', 'birthyear', 'year']);
    const genderIndex = findHeaderIndex(['gender', 'sex']);
    const stateIndex = findHeaderIndex(['state', 'region', 'province']);
    
    console.log(`Column indices - Name: ${nameIndex}, Title: ${titleIndex}, Federation: ${federationIndex}, Classical: ${classicalRatingIndex}, Rapid: ${rapidRatingIndex}, Blitz: ${blitzRatingIndex}, State: ${stateIndex}`);
    
    // If name column not found, show error
    if (nameIndex === -1) {
      setError("Could not find a column for player names. Please include a column with 'Name', 'Player', or 'Full Name' in the header.");
      setIsLoading(false);
      return;
    }
    
    // Process data rows
    const processedPlayers: Partial<Player>[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Skip empty rows
      if (!row.length || (nameIndex !== -1 && !row[nameIndex])) {
        continue;
      }
      
      let playerName = nameIndex !== -1 ? row[nameIndex] : "";
      
      // Skip rows without a name
      if (!playerName || playerName.toString().trim() === "") {
        continue;
      }
      
      // Get state from state column or extract from federation
      let state = "";
      if (stateIndex !== -1 && row[stateIndex]) {
        state = row[stateIndex].toString().trim();
      } else if (federationIndex !== -1 && row[federationIndex]) {
        const federation = row[federationIndex].toString();
        if (federation.includes("NGR")) {
          state = federation.replace("NGR", "").trim();
        }
      }
      
      // Generate a unique NCR ID for the player
      const ncrId = generateNcrId();
      
      const player: Partial<Player> = {
        id: ncrId,
        name: playerName.toString().trim(),
        state: state || undefined,
        gamesPlayed: 30, // Start at 30 games for rating officer uploads (established)
        status: 'approved'
      };
      
      // Add title if available
      if (titleIndex !== -1 && row[titleIndex]) {
        player.title = row[titleIndex].toString().trim();
      }
      
      // Add classical rating with +100 bonus
      if (classicalRatingIndex !== -1 && row[classicalRatingIndex]) {
        const rating = parseInt(row[classicalRatingIndex].toString(), 10);
        if (!isNaN(rating)) {
          player.rating = rating + 100; // Add the +100 bonus
          player.ratingStatus = 'established';
        } else {
          player.rating = 900; // 800 floor + 100 bonus
          player.ratingStatus = 'established';
        }
      } else {
        player.rating = 900; // 800 floor + 100 bonus
        player.ratingStatus = 'established';
      }
      
      // Add rapid rating with +100 bonus if available
      if (rapidRatingIndex !== -1 && row[rapidRatingIndex]) {
        const rapidRating = parseInt(row[rapidRatingIndex].toString(), 10);
        if (!isNaN(rapidRating)) {
          player.rapidRating = rapidRating + 100;
          player.rapidGamesPlayed = 30;
          player.rapidRatingStatus = 'established';
        }
      }
      
      // Add blitz rating with +100 bonus if available
      if (blitzRatingIndex !== -1 && row[blitzRatingIndex]) {
        const blitzRating = parseInt(row[blitzRatingIndex].toString(), 10);
        if (!isNaN(blitzRating)) {
          player.blitzRating = blitzRating + 100;
          player.blitzGamesPlayed = 30;
          player.blitzRatingStatus = 'established';
        }
      }
      
      // Add birth year if available
      if (birthYearIndex !== -1 && row[birthYearIndex]) {
        const birthYear = parseInt(row[birthYearIndex].toString(), 10);
        if (!isNaN(birthYear)) {
          player.birthYear = birthYear;
        }
      }
      
      // Add gender if available
      if (genderIndex !== -1 && row[genderIndex]) {
        const gender = row[genderIndex].toString().trim().toUpperCase();
        player.gender = gender === 'F' ? 'F' : 'M';  // Default to 'M' if not 'F'
      } else {
        player.gender = 'M'; // Default gender
      }
      
      // Add rating history entry
      const currentDate = new Date().toISOString();
      player.ratingHistory = [{
        date: currentDate,
        rating: player.rating || 900,
        reason: "Initial rating with +100 bonus"
      }];
      
      // Add rapid rating history if available
      if (player.rapidRating) {
        player.rapidRatingHistory = [{
          date: currentDate,
          rating: player.rapidRating,
          reason: "Initial rating with +100 bonus"
        }];
      }
      
      // Add blitz rating history if available
      if (player.blitzRating) {
        player.blitzRatingHistory = [{
          date: currentDate,
          rating: player.blitzRating,
          reason: "Initial rating with +100 bonus"
        }];
      }
      
      // Add to processed players
      processedPlayers.push(player);
      console.log("Processed player:", player);
    }
    
    if (processedPlayers.length === 0) {
      setError("No valid players found in the uploaded file");
      setIsLoading(false);
      return;
    }
    
    console.log(`Successfully processed ${processedPlayers.length} players`);
    
    // Transform player data for display in the table
    const formattedPlayers = processedPlayers.map(player => ({
      id: player.id,
      name: player.name,
      rating: player.rating || 900,
      state: player.state || '',
      gender: player.gender || 'M',
      title: player.title || '',
      rapidRating: player.rapidRating,
      blitzRating: player.blitzRating
    }));
    
    // Call the appropriate callback with the processed data
    if (onFileUpload) {
      onFileUpload(formattedPlayers);
    }
    
    if (onPlayersImported) {
      onPlayersImported(processedPlayers);
    }
    
    setIsLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      return;
    }
    
    // Check file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExt !== 'xlsx' && fileExt !== 'xls' && fileExt !== 'csv') {
      setError("Please upload an Excel file (.xlsx or .xls) or CSV file (.csv)");
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit");
      return;
    }
    
    processExcelFile(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
        <Upload className="h-10 w-10 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-4">
          Upload your player list Excel or CSV file. The file should include columns for player name, rating, state, and gender.
        </p>
        
        <input
          type="file"
          id="player-upload"
          className="hidden"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          disabled={isLoading}
        />
        
        <label htmlFor="player-upload">
          <Button 
            type="button" 
            disabled={isLoading} 
            className="cursor-pointer" 
            asChild
          >
            <span>
              {isLoading ? "Processing..." : buttonText}
            </span>
          </Button>
        </label>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default FileUploadButton;
