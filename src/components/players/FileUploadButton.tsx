
import { useState } from "react";
import { Upload, X, FileSpreadsheet } from "lucide-react";
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
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json<any>(worksheet);
      
      // Map the data to our Player structure
      const players = jsonData.map((row) => {
        // Try to handle common column names with some flexibility
        const name = row.name || row.Name || row.PLAYER || row.Player || row.FULL_NAME || row.full_name || row["Full Name"] || "";
        const rating = parseInt(row.rating || row.Rating || row.RATING || row.ELO || row.elo || row.FIDE || row.fide || "0") || 800;
        const title = row.title || row.Title || row.TITLE || "";
        const gender = (row.gender || row.Gender || row.GENDER || row.sex || row.Sex || row.SEX || "M").toUpperCase() === "F" ? "F" : "M";
        const state = row.state || row.State || row.STATE || "";
        const city = row.city || row.City || row.CITY || "";
        
        return {
          name,
          rating,
          title: title || undefined,
          gender: gender as ("M" | "F"),
          state: state || undefined,
          city: city || undefined,
          status: "pending" as const // Use const assertion to match the expected union type
        };
      });
      
      // Filter out any rows without names
      const validPlayers = players.filter(player => player.name);
      
      if (validPlayers.length === 0) {
        toast({
          title: "No valid players found",
          description: "The file doesn't contain properly formatted player data. Please check the file format.",
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

  const clearFile = () => {
    setFile(null);
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        <label className="relative cursor-pointer">
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
          <Button
            variant="outline"
            size="sm"
            type="button"
            className="flex items-center gap-1"
          >
            <Upload className="h-4 w-4" />
            {buttonText}
          </Button>
        </label>
        
        {file && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={processFile}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Process File"}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFile}
              disabled={isLoading}
              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      
      {file && (
        <div className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
          <FileSpreadsheet className="h-4 w-4 text-blue-500" />
          <span className="truncate max-w-[200px]">{file.name}</span>
          <span className="text-xs text-muted-foreground">
            ({Math.round(file.size / 1024)} KB)
          </span>
        </div>
      )}
    </div>
  );
};

export default FileUploadButton;
