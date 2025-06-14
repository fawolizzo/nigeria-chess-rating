
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tournament } from "@/lib/mockData";

export interface TournamentRatingDialogProps {
  tournament: Tournament;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TournamentRatingDialog: React.FC<TournamentRatingDialogProps> = ({
  tournament,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleProcessRatings = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate rating processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update tournament status to processed
      const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
      const updatedTournaments = tournaments.map((t: Tournament) =>
        t.id === tournament.id ? { ...t, status: 'processed' } : t
      );
      localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
      
      toast({
        title: "Success",
        description: "Tournament ratings have been processed successfully.",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process tournament ratings.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Process Tournament Ratings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Process ratings for tournament: <strong>{tournament.name}</strong>
          </p>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleProcessRatings} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Process Ratings"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TournamentRatingDialog;
