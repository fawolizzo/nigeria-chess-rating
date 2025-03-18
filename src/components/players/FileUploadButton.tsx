import { useState } from "react";
import { Upload, X, FileSpreadsheet, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { read, utils } from "xlsx";
import { Player, getAllPlayers, addPlayer } from "@/lib/mockData";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@/contexts/UserContext";

interface FileUploadButtonProps {
  onPlayersImported: (players: Partial<Player>[]) => void;
  buttonText?: string;
}

const FileUploadButton = ({ onPlayersImported, buttonText = "Import Players" }: FileUploadButtonProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useUser();
  
  const isRatingOfficer = currentUser?.role === "rating_officer";

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
      
      const data = await file.arrayBuffer();
      console.log("File loaded as ArrayBuffer, size:", data.byteLength);
      
      const workbook = read(data, { type: 'array' });
      console.log("Workbook loaded:", workbook.SheetNames);
      
      if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error("Invalid Excel file format");
      }
      
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      if (!worksheet) {
        throw new Error("Worksheet not found");
      }
      
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
      
      const headerRow = rawData[0];
      console.log("Header row:", headerRow);
      
      const columnMap: Record<string, number> = {};
      
      const fieldMappings: Record<string, string[]> = {
        name: ["player", "players", "name", "full name", "player name", "full", "fullname"],
        title: ["title", "chess title"],
        rating: ["std.", "standard", "classical", "rating", "elo", "fide rating", "chess rating", "elo rating"],
        rapidRating: ["rpd.", "rapid", "rapid rating"],
        blitzRating: ["blz.", "blitz", "blitz rating"],
        birthYear: ["b-year", "birth year", "year", "birthyear", "birth", "byear", "dob", "birth date", "birthdate"],
        gender: ["gender", "sex", "m/f", "male/female"],
        fed: ["fed", "federation", "country"]
      };
      
      if (headerRow && Array.isArray(headerRow)) {
        headerRow.forEach((header: any, index: number) => {
          if (!header) return;
          
          const headerText = String(header).toLowerCase().trim();
          console.log(`Checking header at index ${index}: "${headerText}"`);
          
          Object.entries(fieldMappings).forEach(([field, possibleNames]) => {
            if (possibleNames.some(name => headerText === name || headerText.includes(name))) {
              columnMap[field] = index;
              console.log(`Match found: "${headerText}" for field "${field}" at index ${index}`);
            }
          });
          
          if (headerText === "#" || headerText === "no" || headerText === "num" || headerText === "number") {
            columnMap["id"] = index;
          }

          // Check for state column
          if (headerText === "state" || headerText === "location") {
            columnMap["state"] = index;
          }
        });
      } else {
        console.log("Header row is not an array:", headerRow);
      }
      
      console.log("Identified columns:", columnMap);
      
      if (!('name' in columnMap)) {
        if (headerRow && headerRow.length > 1) {
          columnMap['name'] = 1;
          console.log("Using column 1 as player name column");
        }
      }
      
      if (!('name' in columnMap) && rawData.length > 1) {
        for (let i = 0; i < rawData[1].length; i++) {
          const value = rawData[1][i];
          if (typeof value === 'string' && value.length > 3 && /^[A-Za-z\s,]+$/.test(value)) {
            columnMap['name'] = i;
            console.log(`Found potential name column at index ${i}`);
            break;
          }
        }
      }
      
      if (!('name' in columnMap)) {
        toast({
          title: "Invalid file format",
          description: "Could not identify a player name column. Please ensure your file has a 'Player' or 'Name' column.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      const processedPlayers: Partial<Player>[] = [];
      
      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;
        
        const nameIndex = columnMap['name'];
        const name = row[nameIndex];
        
        if (!name) continue;
        
        const title = 'title' in columnMap ? row[columnMap['title']] : null;
        
        // Parse the player's ratings
        let classicalRating: number | undefined = undefined;
        let rapidRating: number | undefined = undefined;
        let blitzRating: number | undefined = undefined;
        const currentDate = new Date().toISOString().split('T')[0];
        
        // Parse Classical Rating
        if ('rating' in columnMap && row[columnMap['rating']] !== undefined) {
          const ratingValue = row[columnMap['rating']];
          if (ratingValue !== null && ratingValue !== "") {
            const parsedRating = parseInt(String(ratingValue));
            if (!isNaN(parsedRating)) {
              classicalRating = parsedRating;
            }
          }
        }
        
        // Parse Rapid Rating
        if ('rapidRating' in columnMap && row[columnMap['rapidRating']] !== undefined) {
          const rapidValue = row[columnMap['rapidRating']];
          if (rapidValue !== null && rapidValue !== "") {
            const parsedRapid = parseInt(String(rapidValue));
            if (!isNaN(parsedRapid)) {
              rapidRating = parsedRapid;
            }
          }
        }
        
        // Parse Blitz Rating
        if ('blitzRating' in columnMap && row[columnMap['blitzRating']] !== undefined) {
          const blitzValue = row[columnMap['blitzRating']];
          if (blitzValue !== null && blitzValue !== "") {
            const parsedBlitz = parseInt(String(blitzValue));
            if (!isNaN(parsedBlitz)) {
              blitzRating = parsedBlitz;
            }
          }
        }
        
        // Only apply floor rating if no ratings are provided
        if (!classicalRating && !rapidRating && !blitzRating) {
          classicalRating = 800;
          console.log(`No ratings provided for player ${name}, using floor rating of 800`);
        }
        
        let birthYear: number | undefined = undefined;
        if ('birthYear' in columnMap && row[columnMap['birthYear']] !== undefined) {
          const birthYearValue = row[columnMap['birthYear']];
          if (birthYearValue !== null && birthYearValue !== "") {
            const parsedYear = parseInt(String(birthYearValue));
            if (!isNaN(parsedYear) && parsedYear > 1900 && parsedYear <= new Date().getFullYear()) {
              birthYear = parsedYear;
            }
          }
        }
        
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
        
        const state = 'state' in columnMap ? String(row[columnMap['state']] || '').trim() : '';
        const federation = 'fed' in columnMap ? String(row[columnMap['fed']] || '').trim() : 'Nigeria';
        
        const player: Player = {
          id: uuidv4(),
          name: String(name).trim(),
          gender,
          birthYear,
          state: state || undefined,
          country: federation || 'Nigeria',
          status: 'approved',  // Rating officer imported players are automatically approved
          tournamentResults: [],
        };
        
        if (title && String(title).trim()) {
          player.title = String(title).trim();
        }
        
        // Apply 100-point bonus for Rating Officer uploads and set games played according to rules
        if (classicalRating) {
          // Classical rating 
          const finalClassicalRating = isRatingOfficer ? classicalRating + 100 : classicalRating;
          player.rating = finalClassicalRating;
          
          // If rating officer gave a +100 bonus, set games played to 30 (established rating)
          if (isRatingOfficer) {
            player.gamesPlayed = 30;
            player.ratingStatus = 'established';
          } else {
            player.gamesPlayed = 0;
            player.ratingStatus = 'provisional';
          }
          
          player.ratingHistory = [{
            date: currentDate,
            rating: finalClassicalRating,
            reason: isRatingOfficer ? "Initial rating by Rating Officer (+100)" : "Initial rating"
          }];
        } else {
          // No classical rating provided, use floor rating
          player.rating = 800;
          player.gamesPlayed = 0;
          player.ratingStatus = 'provisional';
          player.ratingHistory = [{
            date: currentDate,
            rating: 800,
            reason: "Floor rating assigned"
          }];
        }
        
        // Add rapid rating if provided
        if (rapidRating) {
          const finalRapidRating = isRatingOfficer ? rapidRating + 100 : rapidRating;
          player.rapidRating = finalRapidRating;
          
          // If rating officer gave a +100 bonus, set games played to 30 (established rating)
          if (isRatingOfficer) {
            player.rapidGamesPlayed = 30;
            player.rapidRatingStatus = 'established';
          } else {
            player.rapidGamesPlayed = 0;
            player.rapidRatingStatus = 'provisional';
          }
          
          player.rapidRatingHistory = [{
            date: currentDate,
            rating: finalRapidRating,
            reason: isRatingOfficer ? "Initial rating by Rating Officer (+100)" : "Initial rating"
          }];
        } else {
          // Only set floor rating for rapid if specifically processing a rapid tournament
          // Otherwise, leave it undefined
        }
        
        // Add blitz rating if provided
        if (blitzRating) {
          const finalBlitzRating = isRatingOfficer ? blitzRating + 100 : blitzRating;
          player.blitzRating = finalBlitzRating;
          
          // If rating officer gave a +100 bonus, set games played to 30 (established rating)
          if (isRatingOfficer) {
            player.blitzGamesPlayed = 30;
            player.blitzRatingStatus = 'established';
          } else {
            player.blitzGamesPlayed = 0;
            player.blitzRatingStatus = 'provisional';
          }
          
          player.blitzRatingHistory = [{
            date: currentDate,
            rating: finalBlitzRating,
            reason: isRatingOfficer ? "Initial rating by Rating Officer (+100)" : "Initial rating"
          }];
        } else {
          // Only set floor rating for blitz if specifically processing a blitz tournament
          // Otherwise, leave it undefined
        }
        
        console.log(`Processed player: "${player.name}", classical: ${player.rating}, rapid: ${player.rapidRating}, blitz: ${player.blitzRating}, id: ${player.id}`);
        
        // Add each player to localStorage immediately
        addPlayer(player);
        
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
      
      // Check that players were actually saved to localStorage
      const currentPlayers = getAllPlayers();
      console.log(`System now has ${currentPlayers.length} players after import`);
      
      onPlayersImported(processedPlayers);
      
      toast({
        title: "Players imported",
        description: `Successfully imported ${processedPlayers.length} players from file.${isRatingOfficer ? " Players received +100 rating points as per Rating Officer rules." : ""}`,
      });
      
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
