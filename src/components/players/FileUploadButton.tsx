
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
      console.log("Processing file:", file.name, "Type:", file.type);
      
      // Read file as ArrayBuffer
      const data = await file.arrayBuffer();
      console.log("File loaded as ArrayBuffer, size:", data.byteLength);
      
      // Parse Excel file
      try {
        const workbook = read(data, { type: 'array' });
        console.log("Workbook loaded:", workbook.SheetNames);
        
        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error("Invalid Excel file format");
        }
        
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        if (!worksheet) {
          throw new Error("Worksheet not found");
        }
        
        // Get raw data as array to examine structure
        const rawData = utils.sheet_to_json<any>(worksheet, { 
          raw: false,
          header: 1,
          blankrows: false
        });
        
        console.log("Raw Excel data:", rawData);
        
        if (!rawData || rawData.length <= 1) {
          toast({
            title: "Empty file",
            description: "The file doesn't contain enough data. Please check the file.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        
        // Look at first row to identify column headers
        const headerRow = rawData[0];
        console.log("Header row:", headerRow);
        
        // Map common header names to standard fields
        const columnMap: Record<string, number> = {};
        
        // These are the field names we're looking for
        const fieldMappings: Record<string, string[]> = {
          name: ["player", "name", "full name", "player name", "full", "fullname"],
          title: ["title", "chess title"],
          rating: ["rating", "elo", "fide rating", "chess rating", "elo rating"],
          birthYear: ["birth year", "b-year", "year", "birthyear", "birth", "byear", "dob", "birth date", "birthdate"],
          gender: ["gender", "sex", "m/f", "male/female"]
        };
        
        // Find the index of each field in the header row
        if (headerRow && Array.isArray(headerRow)) {
          headerRow.forEach((header: any, index: number) => {
            if (!header) return;
            
            const headerText = String(header).toLowerCase().trim();
            console.log(`Checking header at index ${index}: "${headerText}"`);
            
            // Check each field type
            Object.entries(fieldMappings).forEach(([field, possibleNames]) => {
              if (possibleNames.some(name => headerText === name || headerText.includes(name))) {
                columnMap[field] = index;
                console.log(`Match found: "${headerText}" for field "${field}" at index ${index}`);
              }
            });
            
            // Additional special cases
            if (headerText === "#" || headerText === "no" || headerText === "num" || headerText === "number") {
              columnMap["id"] = index;
            }
          });
        } else {
          console.log("Header row is not an array:", headerRow);
        }
        
        console.log("Identified columns:", columnMap);
        
        // If we can't find player name column, try alternative approach
        if (!('name' in columnMap)) {
          // Look for a column that might contain player names (usually the 2nd column)
          if (headerRow && headerRow.length > 1) {
            columnMap['name'] = 1; // Typically the 2nd column (index 1) contains names
            console.log("Using column 1 as player name column");
          }
        }
        
        // If we still don't have a name column, try to guess which column might contain names
        if (!('name' in columnMap) && rawData.length > 1) {
          // Check if any column in the first data row has string values that could be names
          for (let i = 0; i < rawData[1].length; i++) {
            const value = rawData[1][i];
            if (typeof value === 'string' && value.length > 3 && /^[A-Za-z\s,]+$/.test(value)) {
              columnMap['name'] = i;
              console.log(`Found potential name column at index ${i}`);
              break;
            }
          }
        }
        
        // If we still don't have a name column, we can't proceed
        if (!('name' in columnMap)) {
          toast({
            title: "Invalid file format",
            description: "Could not identify a player name column. Please ensure your file has a 'Player' or 'Name' column.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        
        // Process the data rows
        const processedPlayers: Partial<Player>[] = [];
        
        // Start from row 1 (skip header)
        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;
          
          // Get player name
          const nameIndex = columnMap['name'];
          const name = row[nameIndex];
          
          if (!name) continue; // Skip rows without names
          
          const title = 'title' in columnMap ? row[columnMap['title']] : null;
          
          let rating: number = 800;
          if ('rating' in columnMap && row[columnMap['rating']] !== undefined) {
            const ratingValue = row[columnMap['rating']];
            if (ratingValue !== null && ratingValue !== "") {
              rating = parseInt(String(ratingValue)) || 800;
            }
          }
          
          let birthYear: number | undefined = undefined;
          if ('birthYear' in columnMap && row[columnMap['birthYear']] !== undefined) {
            const birthYearValue = row[columnMap['birthYear']];
            if (birthYearValue !== null && birthYearValue !== "") {
              const parsedYear = parseInt(String(birthYearValue));
              // Validate year is reasonable (between 1900 and current year)
              if (!isNaN(parsedYear) && parsedYear > 1900 && parsedYear <= new Date().getFullYear()) {
                birthYear = parsedYear;
              }
            }
          }
          
          // Default gender to M, but check for specific gender value if available
          let gender: 'M' | 'F' = 'M';
          if ('gender' in columnMap && row[columnMap['gender']] !== undefined) {
            const genderValue = row[columnMap['gender']];
            if (genderValue && typeof genderValue === 'string') {
              const genderStr = genderValue.toString().toUpperCase().trim();
              if (genderStr === 'F' || genderStr === 'FEMALE' || genderStr === 'W' || genderStr === 'WOMEN') {
                gender = 'F';
              }
            }
          }
          
          // Create the player object
          const player: Partial<Player> = {
            name: String(name).trim(),
            rating,
            gender,
            birthYear
          };
          
          // Add title if it exists and isn't empty
          if (title && String(title).trim()) {
            player.title = String(title).trim();
          }
          
          console.log(`Processed player: "${player.name}", rating: ${player.rating}, gender: ${player.gender}`);
          processedPlayers.push(player);
        }
        
        console.log(`Found ${processedPlayers.length} valid players`);
        
        if (processedPlayers.length === 0) {
          toast({
            title: "No valid players found",
            description: "Could not extract any valid players from the file. Please check the file format.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        
        // Send the players to the parent component
        onPlayersImported(processedPlayers);
        
        toast({
          title: "Players imported",
          description: `Successfully imported ${processedPlayers.length} players from file.`,
        });
        
        // Reset file selection
        setFile(null);
      } catch (parseError) {
        console.error("Error parsing Excel file:", parseError);
        toast({
          title: "Error parsing file",
          description: "The file format could not be processed. Please check that it's a valid Excel or CSV file.",
          variant: "destructive"
        });
      }
      
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
