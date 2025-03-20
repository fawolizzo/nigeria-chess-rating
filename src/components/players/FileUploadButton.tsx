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

  const processExcelFile = (file: File) => {
    setIsLoading(true);
    setError(null);
    
    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          setError("The uploaded file does not contain any data");
          setIsLoading(false);
          return;
        }
        
        // Process and validate the data
        const processedPlayers = jsonData.map((player: any) => {
          // Convert field names if needed or add defaults
          return {
            fullName: player.fullName || player.name || player.Name || player.FULLNAME || "",
            rating: parseInt(player.rating || player.Rating || player.RATING || "800", 10),
            state: player.state || player.State || player.STATE || "",
            city: player.city || player.City || player.CITY || "",
            gender: player.gender || player.Gender || player.GENDER || "M",
          };
        });
        
        // Filter out players with empty names
        const validPlayers = processedPlayers.filter(p => p.fullName.trim().length > 0);
        
        if (validPlayers.length === 0) {
          setError("No valid players found in the uploaded file");
          setIsLoading(false);
          return;
        }
        
        // Call the appropriate callback with the processed data
        if (onFileUpload) {
          onFileUpload(validPlayers);
        }
        
        if (onPlayersImported) {
          onPlayersImported(validPlayers);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error processing Excel file:", error);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      return;
    }
    
    // Check file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExt !== 'xlsx' && fileExt !== 'xls') {
      setError("Please upload an Excel file (.xlsx or .xls)");
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
          Upload your player list Excel file. The file should include columns for player name, rating, state, and gender.
        </p>
        
        <input
          type="file"
          id="player-upload"
          className="hidden"
          accept=".xlsx,.xls"
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
