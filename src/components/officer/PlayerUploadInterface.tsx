import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Upload, Users } from "lucide-react";
import FileUploadButton from "@/components/players/FileUploadButton";
import CreatePlayerDialog from "./CreatePlayerDialog";
import { createPlayer } from "@/services/player/playerCoreService";
import { Player } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";

interface PlayerUploadInterfaceProps {
  onPlayersUpdated?: () => void;
}

const PlayerUploadInterface: React.FC<PlayerUploadInterfaceProps> = ({ onPlayersUpdated }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
    count?: number;
  }>({ type: null, message: '' });
  const { toast } = useToast();

  const handlePlayersImported = async (players: Partial<Player>[]) => {
    console.log('🔄 PlayerUploadInterface: Starting player import for', players.length, 'players');
    setIsProcessing(true);
    setUploadStatus({ type: 'info', message: `Processing ${players.length} players...` });

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const playerData of players) {
      try {
        console.log('🔄 PlayerUploadInterface: Creating player:', playerData.name);
        
        // Ensure all required fields are present
        if (!playerData.name || !playerData.email) {
          throw new Error(`Missing required fields for player: ${playerData.name || 'Unknown'}`);
        }

        const createdPlayer = await createPlayer(playerData);
        console.log('✅ PlayerUploadInterface: Successfully created:', createdPlayer.name);
        successCount++;
      } catch (error) {
        console.error('❌ PlayerUploadInterface: Failed to create player:', playerData.name, error);
        errorCount++;
        errors.push(`${playerData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const message = `Upload complete: ${successCount} players added successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`;
    setUploadStatus({
      type: successCount > 0 ? 'success' : 'error',
      message,
      count: successCount
    });

    if (errors.length > 0 && errors.length <= 3) {
      console.log('❌ PlayerUploadInterface: Errors encountered:', errors);
    }

    if (successCount > 0) {
      toast({
        title: "Players uploaded successfully",
        description: `${successCount} players have been added to the database.`,
      });
      
      if (onPlayersUpdated) {
        onPlayersUpdated();
      }
    } else {
      toast({
        title: "Upload failed",
        description: "No players could be uploaded. Check the console for details.",
        variant: "destructive"
      });
    }

    setIsProcessing(false);
  };

  const handleSinglePlayerCreated = async (playerData: any) => {
    console.log('🔄 PlayerUploadInterface: Creating single player:', playerData);
    setIsProcessing(true);

    try {
      const createdPlayer = await createPlayer(playerData);
      console.log('✅ PlayerUploadInterface: Single player created successfully:', createdPlayer.name);
      
      setUploadStatus({
        type: 'success',
        message: `Player "${createdPlayer.name}" created successfully`,
        count: 1
      });

      toast({
        title: "Player created",
        description: `${createdPlayer.name} has been added to the database.`,
      });

      if (onPlayersUpdated) {
        onPlayersUpdated();
      }
    } catch (error) {
      console.error('❌ PlayerUploadInterface: Failed to create single player:', error);
      
      setUploadStatus({
        type: 'error',
        message: `Failed to create player: ${error instanceof Error ? error.message : 'Unknown error'}`
      });

      toast({
        title: "Failed to create player",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearStatus = () => {
    setUploadStatus({ type: null, message: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Player Management</h3>
        </div>
        <div className="flex gap-2">
          <CreatePlayerDialog onPlayerCreated={handleSinglePlayerCreated} />
        </div>
      </div>

      {/* Upload Status */}
      {uploadStatus.type && (
        <Alert variant={uploadStatus.type === 'error' ? 'destructive' : 'default'} className="relative">
          {uploadStatus.type === 'success' && <CheckCircle className="h-4 w-4" />}
          {uploadStatus.type === 'error' && <AlertCircle className="h-4 w-4" />}
          {uploadStatus.type === 'info' && <Upload className="h-4 w-4" />}
          <AlertDescription className="flex justify-between items-center">
            <span>{uploadStatus.message}</span>
            <Button variant="ghost" size="sm" onClick={clearStatus}>×</Button>
          </AlertDescription>
        </Alert>
      )}

      {/* File Upload Section */}
      <div className="space-y-4">
        <div>
          <h4 className="text-md font-medium mb-2">Bulk Upload from Excel/CSV</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Upload multiple players from FIDE rating lists or custom Excel files.
          </p>
        </div>
        
        <FileUploadButton
          onPlayersImported={handlePlayersImported}
          buttonText={isProcessing ? "Processing..." : "Select Excel/CSV File"}
        />
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Processing players...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerUploadInterface;