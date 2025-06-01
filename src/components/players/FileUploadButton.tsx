
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

  const generateNcrId = () => {
    const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    return `NCR${randomPart}`;
  };

  const processExcelFile = (file: File) => {
    setIsLoading(true);
    setError(null);
    
    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result;
        
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
        
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
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
    const headers = rows[0].map(h => String(h).trim().toLowerCase());
    
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
    const classicalRatingIndex = findHeaderIndex(['std', 'standard', 'classical', 'fide', 'rating']);
    const rapidRatingIndex = findHeaderIndex(['rpd', 'rapid']);
    const blitzRatingIndex = findHeaderIndex(['blz', 'blitz']);
    const birthYearIndex = findHeaderIndex(['b-year', 'byear', 'birth year', 'birthyear', 'year']);
    const fideIdIndex = findHeaderIndex(['fide id', 'fideid', 'fide_id', 'id']);
    
    if (nameIndex === -1) {
      setError("Could not find a column for player names. Please include a column with 'Name', 'Player', or 'Full Name' in the header.");
      setIsLoading(false);
      return;
    }
    
    const processedPlayers: Partial<Player>[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      if (!row.length || (nameIndex !== -1 && !row[nameIndex])) {
        continue;
      }
      
      let playerName = nameIndex !== -1 ? row[nameIndex] : "";
      
      if (!playerName || playerName.toString().trim() === "") {
        continue;
      }
      
      const ncrId = generateNcrId();
      
      const player: Partial<Player> = {
        id: ncrId,
        name: playerName.toString().trim(),
        // State and Gender will be manually updated by rating officer
        state: '', // Will be updated manually
        gender: 'M', // Default, will be updated manually
        city: '',
        country: 'Nigeria',
        phone: '',
        email: '',
        gamesPlayed: 31,
        status: 'approved'
      };
      
      // Handle title
      if (titleIndex !== -1 && row[titleIndex]) {
        player.title = row[titleIndex].toString().trim();
        player.titleVerified = true; // FIDE titles are verified
      }
      
      // Handle FIDE ID
      if (fideIdIndex !== -1 && row[fideIdIndex]) {
        player.fideId = row[fideIdIndex].toString().trim();
      }
      
      // Handle classical rating with +100 bonus for FIDE players
      if (classicalRatingIndex !== -1 && row[classicalRatingIndex]) {
        const rating = parseInt(row[classicalRatingIndex].toString(), 10);
        if (!isNaN(rating)) {
          player.rating = rating + 100; // +100 bonus for FIDE players
          player.ratingStatus = 'established';
        } else {
          player.rating = 900;
          player.ratingStatus = 'established';
        }
      } else {
        player.rating = 900;
        player.ratingStatus = 'established';
      }
      
      // Handle rapid rating with +100 bonus
      if (rapidRatingIndex !== -1 && row[rapidRatingIndex]) {
        const rapidRating = parseInt(row[rapidRatingIndex].toString(), 10);
        if (!isNaN(rapidRating)) {
          player.rapidRating = rapidRating + 100;
          player.rapidGamesPlayed = 31;
          player.rapidRatingStatus = 'established';
        } else {
          player.rapidRating = 900;
          player.rapidGamesPlayed = 31;
          player.rapidRatingStatus = 'established';
        }
      } else {
        player.rapidRating = 900;
        player.rapidGamesPlayed = 31;
        player.rapidRatingStatus = 'established';
      }
      
      // Handle blitz rating with +100 bonus
      if (blitzRatingIndex !== -1 && row[blitzRatingIndex]) {
        const blitzRating = parseInt(row[blitzRatingIndex].toString(), 10);
        if (!isNaN(blitzRating)) {
          player.blitzRating = blitzRating + 100;
          player.blitzGamesPlayed = 31;
          player.blitzRatingStatus = 'established';
        } else {
          player.blitzRating = 900;
          player.blitzGamesPlayed = 31;
          player.blitzRatingStatus = 'established';
        }
      } else {
        player.blitzRating = 900;
        player.blitzGamesPlayed = 31;
        player.blitzRatingStatus = 'established';
      }
      
      // Handle birth year
      if (birthYearIndex !== -1 && row[birthYearIndex]) {
        const birthYear = parseInt(row[birthYearIndex].toString(), 10);
        if (!isNaN(birthYear)) {
          player.birthYear = birthYear;
        }
      }
      
      const currentDate = new Date().toISOString();
      player.ratingHistory = [{
        date: currentDate,
        rating: player.rating || 900,
        reason: "Initial FIDE rating with +100 bonus"
      }];
      
      player.rapidRatingHistory = [{
        date: currentDate,
        rating: player.rapidRating || 900,
        reason: "Initial FIDE rating with +100 bonus"
      }];
      
      player.blitzRatingHistory = [{
        date: currentDate,
        rating: player.blitzRating || 900,
        reason: "Initial FIDE rating with +100 bonus"
      }];
      
      player.tournamentResults = [];
      player.achievements = [];
      
      processedPlayers.push(player);
    }
    
    if (processedPlayers.length === 0) {
      setError("No valid players found in the uploaded file");
      setIsLoading(false);
      return;
    }
    
    const formattedPlayers = processedPlayers.map(player => ({
      id: player.id,
      name: player.name,
      rating: player.rating || 900,
      state: '', // Will be updated manually
      gender: 'M', // Default, will be updated manually
      title: player.title || '',
      rapidRating: player.rapidRating,
      blitzRating: player.blitzRating,
      fideId: player.fideId
    }));
    
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
    
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExt !== 'xlsx' && fileExt !== 'xls' && fileExt !== 'csv') {
      setError("Please upload an Excel file (.xlsx or .xls) or CSV file (.csv)");
      return;
    }
    
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
          Upload FIDE player list Excel or CSV file. Required: Player Name. Optional: Title, Classical/Rapid/Blitz ratings, Birth Year, FIDE ID.
          <br />
          <strong>Note:</strong> State and Gender will be updated manually by the rating officer.
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
