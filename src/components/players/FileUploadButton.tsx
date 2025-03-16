
import { useState } from "react";
import { Upload, X, FileSpreadsheet, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { read, utils } from "xlsx";
import { Player } from "@/lib/mockData";
import { useToast } from "@/components/ui/use-toast";

interface FileUploadButtonProps {
  onPlayersImported: (players: Partial<Player>[]) => void;
  buttonText?: string;
}

const FileUploadButton = ({ onPlayersImported, buttonText = "Import Players" }: FileUploadButtonProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processFile = async () => {
    if (!file) return;
    
    setIsLoading(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      
      if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error("Invalid Excel file format");
      }
      
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      if (!worksheet) {
        throw new Error("Worksheet not found");
      }
      
      const jsonData = utils.sheet_to_json<any>(worksheet);
      console.log("Parsed Excel data:", jsonData);
      
      if (!jsonData || jsonData.length === 0) {
        toast({
          title: "Empty file",
          description: "The file doesn't contain any data. Please check the file.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Log the structure of the first row to help with debugging
      if (jsonData.length > 0) {
        console.log("First row structure:", Object.keys(jsonData[0]));
      }
      
      // Map the data to our Player structure with better column detection
      const players = jsonData.map((row) => {
        // Try to handle common column names with much more flexibility
        // Name field detection
        const nameKeys = ["name", "player", "player name", "player_name", "fullname", "full name", "full_name"];
        const nameValue = findValueByKeys(row, nameKeys);
        
        // Rating field detection
        const ratingKeys = ["rating", "elo", "fide", "chess rating", "chess_rating"];
        const ratingValue = findValueByKeys(row, ratingKeys);
        
        // Title field detection
        const titleKeys = ["title", "chess title", "chess_title"];
        const titleValue = findValueByKeys(row, titleKeys);
        
        // Gender field detection
        const genderKeys = ["gender", "sex"];
        const genderValue = findValueByKeys(row, genderKeys);
        
        // State field detection
        const stateKeys = ["state", "province", "region"];
        const stateValue = findValueByKeys(row, stateKeys);
        
        // City field detection
        const cityKeys = ["city", "town"];
        const cityValue = findValueByKeys(row, cityKeys);
        
        // Get proper values with fallbacks
        const name = nameValue || "";
        const rating = parseInt(ratingValue) || 800;
        const title = titleValue || undefined;
        const gender = (typeof genderValue === 'string' && genderValue.toUpperCase() === "F") ? "F" : "M";
        const state = stateValue || undefined;
        const city = cityValue || undefined;
        
        console.log(`Processed player: ${name}, rating: ${rating}, gender: ${gender}, state: ${state}`);
        
        return {
          name,
          rating,
          title,
          gender: gender as "M" | "F",
          state,
          city,
          status: "pending" as const
        };
      });
      
      // Filter out any rows without names
      const validPlayers = players.filter(player => player.name && player.name.trim() !== "");
      
      console.log(`Found ${validPlayers.length} valid players out of ${players.length} total rows`);
      
      if (validPlayers.length === 0) {
        toast({
          title: "No valid players found",
          description: "The file doesn't contain properly formatted player data. Column names should include 'name', 'rating', etc.",
          variant: "destructive"
        });
        return;
      }
      
      onPlayersImported(validPlayers);
      
      toast({
        title: "Players imported",
        description: `Successfully imported ${validPlayers.length} players from file.`,
      });
      
      // Reset file selection
      setFile(null);
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Error importing players",
        description: "Could not process the file. Please make sure it's a valid CSV or Excel file.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to find a value using various possible keys (case insensitive)
  const findValueByKeys = (row: any, possibleKeys: string[]): any => {
    // First check exact matches
    for (const key of possibleKeys) {
      if (row[key] !== undefined) return row[key];
    }
    
    // Then check for case-insensitive matches
    const rowKeys = Object.keys(row);
    for (const possibleKey of possibleKeys) {
      const matchingKey = rowKeys.find(
        k => k.toLowerCase() === possibleKey.toLowerCase()
      );
      if (matchingKey && row[matchingKey] !== undefined) {
        return row[matchingKey];
      }
    }
    
    // Finally check for partial matches
    for (const possibleKey of possibleKeys) {
      const matchingKey = rowKeys.find(
        k => k.toLowerCase().includes(possibleKey.toLowerCase())
      );
      if (matchingKey && row[matchingKey] !== undefined) {
        return row[matchingKey];
      }
    }
    
    return null;
  };

  const clearFile = () => {
    setFile(null);
  };

  return (
    <div className="flex flex-col space-y-4">
      {!file ? (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
          <label className="cursor-pointer w-full flex flex-col items-center">
            <input
              type="file"
              className="sr-only"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              onClick={(e) => {
                // Reset the file input value to allow selecting the same file again
                (e.target as HTMLInputElement).value = "";
              }}
            />
            <FileUp className="h-10 w-10 text-muted-foreground mb-3" />
            <span className="text-base font-medium mb-1">Click to upload</span>
            <span className="text-sm text-muted-foreground mb-3">
              CSV, XLS or XLSX files supported
            </span>
            <Button variant="default" size="sm" className="flex items-center gap-1">
              <Upload className="h-4 w-4 mr-1" />
              {buttonText}
            </Button>
          </label>
        </div>
      ) : (
        <div className="flex flex-col space-y-3">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <FileSpreadsheet className="h-5 w-5 text-blue-500" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {Math.round(file.size / 1024)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFile}
              disabled={isLoading}
              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            className="w-full"
            onClick={processFile}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Process File"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUploadButton;
